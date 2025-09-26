import express from 'express';
import Post from '../models/Post';
import User from '../models/User';
import { logger } from '../utils/logger';
import { ApiResponse } from '../types';

const router = express.Router();

// GET /api/posts/discovery - Get random posts from users not followed (Instagram-style)
router.get('/discovery', async (req, res) => {
  try {
    const { userId, limit = 20, page = 1 } = req.query;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required for discovery feed'
      } as ApiResponse);
    }

    const limitNum = Math.min(parseInt(limit as string) || 20, 50); // Cap at 50
    const pageNum = Math.max(parseInt(page as string) || 1, 1);
    const skip = (pageNum - 1) * limitNum;

    console.log(`🔍 Discovery feed request - User: ${userId}, Limit: ${limitNum}, Page: ${pageNum}`);

    // Step 1: Get users that current user is following
    const currentUser = await User.findOne({ id: userId as string });
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      } as ApiResponse);
    }

    const followingIds = currentUser.following || [];
    console.log(`👥 User is following ${followingIds.length} users: [${followingIds.join(', ')}]`);
    console.log(`👤 Current user ID: ${userId}`);
    console.log(`👤 Current user following array:`, followingIds);
    console.log(`👤 Following array types:`, followingIds.map(id => typeof id));
    
    // Convert ObjectId references to string IDs for comparison
    const followingUserIds = await User.find({ _id: { $in: followingIds } }).select('id');
    const followingStringIds = followingUserIds.map(user => user.id);
    console.log(`👥 Following user string IDs: [${followingStringIds.join(', ')}]`);
    
    // Create exclusion list (followed users + current user)
    const excludeUserIds = [...followingStringIds, userId as string];
    console.log(`🚫 Excluding users: [${excludeUserIds.join(', ')}]`);

    // Debug: Let's also check what posts exist and their user IDs
    const allPosts = await Post.find({}).limit(10).select('userId username songName');
    console.log(`🔍 Sample of all posts in database:`, allPosts.map(p => ({ userId: p.userId, username: p.username, song: p.songName })));

    // Step 2: Get posts from users NOT followed (exclude current user too)
    const candidatePosts = await Post.find({
      userId: { 
        $nin: excludeUserIds // Exclude followed users and current user
      }
    })
    .sort({ createdAt: -1 }) // Start with most recent
    .limit(limitNum * 3); // Get more candidates for scoring

    console.log(`📝 Found ${candidatePosts.length} candidate posts from non-followed users`);
    
    // Debug: Show which users the posts are from
    const candidateUserIds = [...new Set(candidatePosts.map(post => post.userId))];
    console.log(`👥 Candidate post authors: [${candidateUserIds.join(', ')}]`);
    
    // Debug: Show detailed info about each candidate post
    candidatePosts.forEach((post, index) => {
      console.log(`📄 Candidate ${index + 1}: userId="${post.userId}", username="${post.username}", song="${post.songName}"`);
    });

    // Step 3: Get user details for each post
    const postUserIds = [...new Set(candidatePosts.map(post => post.userId))];
    const users = await User.find({ id: { $in: postUserIds } })
      .select('id displayName username profilePicture followers following');
    
    const userMap = new Map(users.map(user => [user.id, user]));

    // Step 4: Calculate engagement scores
    const scoredPosts = candidatePosts.map(post => {
      const likes = post.likes?.length || 0;
      const comments = 0; // Posts don't have comments field in current model
      const user = userMap.get(post.userId);
      const userFollowers = user?.followers?.length || 0;
      
      // Calculate recency score (newer posts get higher score)
      const hoursSinceCreated = (Date.now() - new Date(post.createdAt).getTime()) / (1000 * 60 * 60);
      const recencyScore = Math.max(0, 48 - hoursSinceCreated) / 48; // Decay over 48 hours
      
      
      const baseEngagement = likes * 1.0; // Base engagement from likes
      const userPopularity = Math.log(userFollowers + 1) * 0.5; // Logarithmic user popularity
      const freshnessBonus = recencyScore * 3.0; // Strong recency bonus
      const randomnessFactor = Math.random() * 1.0; // High randomness for discovery
      
      // Calculate final engagement score
      const engagementScore = baseEngagement + userPopularity + freshnessBonus + randomnessFactor;
      
      console.log(`📊 Post ${post.id}: likes=${likes}, userFollowers=${userFollowers}, recency=${recencyScore.toFixed(2)}, score=${engagementScore.toFixed(2)}`);

      return {
        ...post.toObject(),
        engagementScore,
        debugInfo: {
          baseEngagement,
          userPopularity,
          freshnessBonus,
          randomnessFactor,
          likes,
          userFollowers,
          hoursSinceCreated
        }
      };
    });

    // Step 5: Sort by engagement score and apply Instagram-style randomization
    scoredPosts.sort((a, b) => b.engagementScore - a.engagementScore);
    
    // Apply additional randomization to top posts (Instagram-style)
    const topPosts = scoredPosts.slice(0, limitNum * 2); // Get more candidates
    const randomizedPosts = [];
    
    // Take top 30% as-is, then randomize the rest
    const topCount = Math.ceil(topPosts.length * 0.3);
    randomizedPosts.push(...topPosts.slice(0, topCount));
    
    // Shuffle the remaining posts
    const remainingPosts = topPosts.slice(topCount);
    for (let i = remainingPosts.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = remainingPosts[i];
      remainingPosts[i] = remainingPosts[j]!;
      remainingPosts[j] = temp!;
    }
    randomizedPosts.push(...remainingPosts);
    
    console.log(`🎲 Applied randomization: top ${topCount} posts + ${remainingPosts.length} shuffled`);
    
    // Step 6: Format response with user details
    const formattedPosts = randomizedPosts.slice(0, limitNum).map(post => {
      const user = userMap.get(post.userId);
      return {
        id: post.id,
        userId: post.userId,
        username: user?.displayName || user?.username || 'Unknown User',
        userAvatar: user?.profilePicture || 'https://i.pravatar.cc/150?img=1',
        songName: post.songName,
        artistName: post.artistName,
        songImage: post.songImage,
        description: post.description || '',
        likes: post.likes || [],
        comments: [], // Comments not implemented yet
        likesCount: (post.likes || []).length,
        commentsCount: 0, // Comments not implemented yet
        isLiked: post.likes?.includes(userId as string) || false,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        engagementScore: post.engagementScore
      };
    });

    // Get total count for pagination
    const totalCount = await Post.countDocuments({
      userId: { $nin: excludeUserIds }
    });

    console.log(`✅ Discovery feed: Returning ${formattedPosts.length} posts`);

    return res.status(200).json({
      success: true,
      message: 'Discovery posts retrieved successfully',
      data: formattedPosts,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limitNum)
      }
    } as ApiResponse<any[]>);

  } catch (error: any) {
    console.error('Error getting discovery posts:', error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving discovery posts',
      error: error.message
    } as ApiResponse);
  }
});

// Helper function to get likes with usernames
async function getLikesWithNames(likes: string[]) {
  if (!likes || likes.length === 0) return [];
  
  const likedUsers = await User.find({ id: { $in: likes } }).select('id displayName username');
  return likes.map(userId => {
    const user = likedUsers.find(u => u.id === userId);
    return {
      userId: userId,
      username: user?.displayName || user?.username || 'Unknown User'
    };
  });
}

// Helper function to check if current user liked a post
function isLikedByCurrentUser(likes: string[], currentUserId?: string): boolean {
  if (!currentUserId || !likes || likes.length === 0) return false;
  return likes.includes(currentUserId);
}

// POST /api/posts/create - Create new post
router.post('/create', async (req, res) => {
  try {
    const postData = req.body;
    
    logger.info('Post creation request:', postData);

    // Validate required fields
    const requiredFields = ['userId', 'username', 'songName', 'artistName', 'songImage'];
    const missingFields = requiredFields.filter(field => !postData[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`
      } as ApiResponse);
    }

    // Generate unique post ID
    const postId = postData.id || 'post-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);

    // Create new post
    const newPost = new Post({
      userId: postData.userId,
      username: postData.username,
      userProfilePicture: postData.userProfilePicture || '',
      songName: postData.songName,
      artistName: postData.artistName,
      songImage: postData.songImage,
      description: postData.description || '',
      likeCount: postData.likeCount || 0,
      likes: []
    });

    const savedPost = await newPost.save();
    logger.info('Post created successfully:', savedPost._id);

    // Add post to user's posts array
    await User.findOneAndUpdate(
      { id: postData.userId },
      { $push: { posts: savedPost._id } }
    );

    return res.status(201).json({
      success: true,
      message: 'Post created successfully',
      data: {
        id: postId,
        userId: savedPost.userId,
        username: savedPost.username,
        userProfilePicture: savedPost.userProfilePicture,
        songName: savedPost.songName,
        artistName: savedPost.artistName,
        songImage: savedPost.songImage,
        description: savedPost.description,
        likeCount: savedPost.likeCount,
        createdAt: savedPost.createdAt,
        timeline: savedPost.timeline, // This will use the virtual field
        isLikedByCurrentUser: false
      }
    } as ApiResponse<any>);

  } catch (error: any) {
    logger.error('Error creating post:', error);
    return res.status(500).json({
      success: false,
      message: 'Error creating post',
      error: error.message
    } as ApiResponse);
  }
});

// GET /api/posts/feed/:userId - Get home feed (posts from followed users)
router.get('/feed/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.query.currentUserId as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    // Get user's following list
    const user = await User.findOne({ id: userId });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        error: 'USER_NOT_FOUND'
      } as ApiResponse);
    }

    // Get posts from followed users only (exclude user's own posts)
    const followingObjectIds = user.following || [];
    
    // If user is not following anyone, return empty feed
    if (followingObjectIds.length === 0) {
      return res.json({
        success: true,
        message: 'Feed retrieved successfully',
        data: [],
        pagination: {
          page,
          limit,
          total: 0
        }
      } as ApiResponse<any[]>);
    }

    // Get the actual user IDs from the ObjectIds
    const followedUsers = await User.find({ _id: { $in: followingObjectIds } }).select('id');
    const followingIds = followedUsers.map(user => user.id);

    const posts = await Post.find({ userId: { $in: followingIds } })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    logger.info(`Feed for user ${userId}: ${posts.length} posts`);
    logger.info(`Following users: ${followingIds.join(', ')}`);
    logger.info(`Posts found for following users: ${posts.map(p => `${p.username} - ${p.songName}`).join(', ')}`);

    // Get likes with usernames for all posts
    const postsWithLikes = await Promise.all(posts.map(async (post) => {
      const likesWithNames = await getLikesWithNames(post.likes);
      return {
        id: post._id,
        userId: post.userId,
        username: post.username,
        userProfilePicture: post.userProfilePicture,
        songName: post.songName,
        artistName: post.artistName,
        songImage: post.songImage,
        description: post.description,
        likeCount: post.likeCount,
        timeline: post.timeline,
        likes: likesWithNames,
        createdAt: post.createdAt,
        isLikedByCurrentUser: isLikedByCurrentUser(post.likes, currentUserId)
      };
    }));

    return res.json({
      success: true,
      message: 'Feed retrieved successfully',
      data: postsWithLikes,
      pagination: {
        page,
        limit,
        total: posts.length
      }
    } as ApiResponse<any[]>);

  } catch (error: any) {
    logger.error('Error getting feed:', error);
    return res.status(500).json({
      success: false,
      message: 'Error getting feed',
      error: error.message
    } as ApiResponse);
  }
});

// GET /api/posts/search - Search posts by song name, artist, or description
router.get('/search', async (req, res) => {
  try {
    const { q: query, page = 1, limit = 20, currentUserId } = req.query;
    
    if (!query || query.toString().trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters long'
      } as ApiResponse);
    }

    const searchQuery = query.toString().trim();
    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 20;
    const skip = (pageNum - 1) * limitNum;

    logger.info(`Searching posts with query: "${searchQuery}"`);

    // Search posts by song name, artist name, or description
    const posts = await Post.find({
      $or: [
        { songName: { $regex: searchQuery, $options: 'i' } },
        { artistName: { $regex: searchQuery, $options: 'i' } },
        { description: { $regex: searchQuery, $options: 'i' } },
        { username: { $regex: searchQuery, $options: 'i' } }
      ]
    })
    .sort({ 
      // Prioritize exact matches, then by like count, then by creation date
      likeCount: -1,
      createdAt: -1 
    })
    .skip(skip)
    .limit(limitNum);

    const total = await Post.countDocuments({
      $or: [
        { songName: { $regex: searchQuery, $options: 'i' } },
        { artistName: { $regex: searchQuery, $options: 'i' } },
        { description: { $regex: searchQuery, $options: 'i' } },
        { username: { $regex: searchQuery, $options: 'i' } }
      ]
    });

    // Get likes with usernames for all posts
    const postsWithLikes = await Promise.all(posts.map(async (post) => {
      const likesWithNames = await getLikesWithNames(post.likes);
      return {
        id: post._id,
        userId: post.userId,
        username: post.username,
        userProfilePicture: post.userProfilePicture,
        songName: post.songName,
        artistName: post.artistName,
        songImage: post.songImage,
        description: post.description,
        likeCount: post.likeCount,
        likes: likesWithNames,
        timeline: post.timeline,
        createdAt: post.createdAt,
        isLikedByCurrentUser: isLikedByCurrentUser(post.likes, currentUserId as string)
      };
    }));

    logger.info(`Found ${postsWithLikes.length} posts for query: "${searchQuery}"`);

    return res.json({
      success: true,
      message: 'Posts found successfully',
      data: postsWithLikes,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    } as ApiResponse<any[]>);

  } catch (error: any) {
    logger.error('Error searching posts:', error);
    return res.status(500).json({
      success: false,
      message: 'Error searching posts',
      error: error.message
    } as ApiResponse);
  }
});

// GET /api/posts/discovery - Get random recent posts for discovery feed
router.get('/discovery', async (req, res) => {
  try {
    const currentUserId = req.query.currentUserId as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    // Get random recent posts
    const posts = await Post.aggregate([
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      { $sample: { size: limit } }
    ]);

    logger.info(`Discovery feed: ${posts.length} posts`);

    // Get likes with usernames for all posts
    const postsWithLikes = await Promise.all(posts.map(async (post) => {
      const likesWithNames = await getLikesWithNames(post.likes);
      return {
        id: post._id,
        userId: post.userId,
        username: post.username,
        userProfilePicture: post.userProfilePicture,
        songName: post.songName,
        artistName: post.artistName,
        songImage: post.songImage,
        description: post.description,
        likeCount: post.likeCount,
        likes: likesWithNames,
        timeline: post.timeline,
        createdAt: post.createdAt,
        isLikedByCurrentUser: isLikedByCurrentUser(post.likes, currentUserId)
      };
    }));

    return res.json({
      success: true,
      message: 'Discovery feed retrieved successfully',
      data: postsWithLikes,
      pagination: {
        page,
        limit,
        total: posts.length
      }
    } as ApiResponse<any[]>);

  } catch (error: any) {
    logger.error('Error getting discovery feed:', error);
    return res.status(500).json({
      success: false,
      message: 'Error getting discovery feed',
      error: error.message
    } as ApiResponse);
  }
});

// POST /api/posts/:postId/like - Like a post
router.post('/:postId/like', async (req, res) => {
  try {
    const { postId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      } as ApiResponse);
    }

    const post = await Post.findOne({ _id: postId });
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
        error: 'POST_NOT_FOUND'
      } as ApiResponse);
    }

    // Check if user already liked
    if (post.likes.includes(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Post already liked'
      } as ApiResponse);
    }

    // Add like
    post.likes.push(userId);
    post.likeCount = post.likes.length;
    await post.save();

    logger.info(`Post ${postId} liked by user ${userId}`);

    // Get usernames for all likes
    const likesWithNames = await getLikesWithNames(post.likes);

    return res.json({
      success: true,
      message: 'Post liked successfully',
      data: {
        postId: post._id,
        likeCount: post.likeCount,
        likes: likesWithNames,
        liked: true
      }
    } as ApiResponse<any>);

  } catch (error: any) {
    logger.error('Error liking post:', error);
    return res.status(500).json({
      success: false,
      message: 'Error liking post',
      error: error.message
    } as ApiResponse);
  }
});

// DELETE /api/posts/:postId/like - Unlike a post
router.delete('/:postId/like', async (req, res) => {
  try {
    const { postId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      } as ApiResponse);
    }

    const post = await Post.findOne({ _id: postId });
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
        error: 'POST_NOT_FOUND'
      } as ApiResponse);
    }

    // Remove like
    post.likes = post.likes.filter(id => id !== userId);
    post.likeCount = post.likes.length;
    await post.save();

    logger.info(`Post ${postId} unliked by user ${userId}`);

    // Get usernames for remaining likes
    const likesWithNames = await getLikesWithNames(post.likes);

    return res.json({
      success: true,
      message: 'Post unliked successfully',
      data: {
        postId: post._id,
        likeCount: post.likeCount,
        likes: likesWithNames,
        liked: false
      }
    } as ApiResponse<any>);

  } catch (error: any) {
    logger.error('Error unliking post:', error);
    return res.status(500).json({
      success: false,
      message: 'Error unliking post',
      error: error.message
    } as ApiResponse);
  }
});

// GET /api/posts/:postId - Get specific post
router.get('/:postId', async (req, res) => {
  try {
    const { postId } = req.params;
    const currentUserId = req.query.currentUserId as string;

    const post = await Post.findOne({ _id: postId });
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
        error: 'POST_NOT_FOUND'
      } as ApiResponse);
    }

    // Get likes with usernames
    const likesWithNames = await getLikesWithNames(post.likes);

    return res.json({
      success: true,
      message: 'Post retrieved successfully',
      data: {
        id: post._id,
        userId: post.userId,
        username: post.username,
        userProfilePicture: post.userProfilePicture,
        songName: post.songName,
        artistName: post.artistName,
        songImage: post.songImage,
        description: post.description,
        likeCount: post.likeCount,
        likes: likesWithNames,
        timeline: post.timeline,
        createdAt: post.createdAt,
        isLikedByCurrentUser: isLikedByCurrentUser(post.likes, currentUserId)
      }
    } as ApiResponse<any>);

  } catch (error: any) {
    logger.error('Error getting post:', error);
    return res.status(500).json({
      success: false,
      message: 'Error getting post',
      error: error.message
    } as ApiResponse);
  }
});

// PUT /api/posts/:postId - Edit post
router.put('/:postId', async (req, res) => {
  try {
    const { postId } = req.params;
    const { userId, description } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      } as ApiResponse);
    }

    if (!description) {
      return res.status(400).json({
        success: false,
        message: 'Description is required'
      } as ApiResponse);
    }

    // Find the post and verify ownership
    const post = await Post.findOne({ _id: postId, userId });
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found or not owned by user',
        error: 'POST_NOT_FOUND'
      } as ApiResponse);
    }

    // Update the description
    post.description = description;
    await post.save();

    logger.info(`Post ${postId} updated by user ${userId}`);

    // Get likes with usernames
    const likesWithNames = await getLikesWithNames(post.likes);

    return res.json({
      success: true,
      message: 'Post updated successfully',
      data: {
        id: post._id,
        userId: post.userId,
        username: post.username,
        userProfilePicture: post.userProfilePicture,
        songName: post.songName,
        artistName: post.artistName,
        songImage: post.songImage,
        description: post.description,
        likeCount: post.likeCount,
        likes: likesWithNames,
        timeline: post.timeline,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        isLikedByCurrentUser: false
      }
    } as ApiResponse<any>);

  } catch (error: any) {
    logger.error('Error updating post:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating post',
      error: error.message
    } as ApiResponse);
  }
});

// DELETE /api/posts/:postId - Delete post
router.delete('/:postId', async (req, res) => {
  try {
    const { postId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      } as ApiResponse);
    }

    const post = await Post.findOne({ _id: postId, userId });
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found or not owned by user',
        error: 'POST_NOT_FOUND'
      } as ApiResponse);
    }

    await Post.findOneAndDelete({ _id: postId });
    
    // Remove post from user's posts array
    await User.findOneAndUpdate(
      { id: userId },
      { $pull: { posts: postId } }
    );
    
    logger.info(`Post ${postId} deleted by user ${userId}`);

    return res.json({
      success: true,
      message: 'Post deleted successfully',
      data: {
        postId: post._id,
        deletedAt: new Date().toISOString()
      }
    } as ApiResponse<any>);

  } catch (error: any) {
    logger.error('Error deleting post:', error);
    return res.status(500).json({
      success: false,
      message: 'Error deleting post',
      error: error.message
    } as ApiResponse);
  }
});

// GET /api/posts/user/:userId - Get posts by specific user
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.query.currentUserId as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;
    const skip = offset || (page - 1) * limit;

    logger.info(`Getting posts for user: ${userId}, page: ${page}, limit: ${limit}`);

    // Find posts by user ID
    const posts = await Post.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    logger.info(`Found ${posts.length} posts for user ${userId}`);

    // Get likes with usernames for all posts
    const postsWithLikes = await Promise.all(posts.map(async (post) => {
      const likesWithNames = await getLikesWithNames(post.likes);
      return {
        id: post._id,
        userId: post.userId,
        username: post.username,
        userProfilePicture: post.userProfilePicture,
        songName: post.songName,
        artistName: post.artistName,
        songImage: post.songImage,
        description: post.description,
        likeCount: post.likeCount,
        timeline: post.timeline,
        likes: likesWithNames,
        createdAt: post.createdAt,
        isLikedByCurrentUser: isLikedByCurrentUser(post.likes, currentUserId)
      };
    }));

    return res.json({
      success: true,
      message: 'User posts retrieved successfully',
      data: postsWithLikes,
      pagination: {
        page,
        limit,
        total: posts.length
      }
    } as ApiResponse<any>);

  } catch (error: any) {
    logger.error('Error getting user posts:', error);
    return res.status(500).json({
      success: false,
      message: 'Error getting user posts',
      error: error.message
    } as ApiResponse);
  }
});

export default router;
