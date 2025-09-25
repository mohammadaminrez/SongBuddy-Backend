import express from 'express';
import User from '../models/User';
import Post from '../models/Post';
import { logger } from '../utils/logger';
import { CreateUserRequest, ApiResponse, IUser } from '../types';

const router = express.Router();

// POST /api/users/save - Save user data from Flutter app
router.post('/save', async (req, res) => {
  try {
    const userData = req.body;
    
    // DEBUG: Log everything we receive
    console.log('=== DEBUG USER SAVE ===');
    console.log('Full request body:', JSON.stringify(req.body, null, 2));
    console.log('Headers:', req.headers);
    console.log('Content-Type:', req.headers['content-type']);
    console.log('Raw body keys:', Object.keys(userData));
    console.log('Country value:', userData.country);
    console.log('Country type:', typeof userData.country);
    console.log('========================');
    
    logger.info('User save request:', userData);

    // Create new user and save to MongoDB
      const newUser = new User({
      id: userData.id || 'user-' + Date.now(),
      displayName: userData.displayName || 'User',
      email: userData.email || 'user@example.com',
      username: userData.username || '',
        profilePicture: userData.profilePicture || '',
      country: userData.country || '',
        bio: userData.bio || '',
      currentlyPlaying: userData.currentlyPlaying || null,
      topArtists: userData.topArtists || [],
      topTracks: userData.topTracks || [],
      recentlyPlayed: userData.recentlyPlayed || [],
        followers: [],
        following: [],
        preferences: {
          theme: 'dark',
          notifications: true,
          privacy: 'public'
        },
        isActive: true,
        lastActiveAt: new Date()
      });

      const savedUser = await newUser.save();

    // DEBUG: Log what was actually saved
    console.log('=== SAVED TO MONGODB ===');
    console.log('Saved user ID:', savedUser._id);
    console.log('Saved user country:', savedUser.country);
    console.log('Full saved user:', JSON.stringify(savedUser, null, 2));
    console.log('========================');
    
    logger.info('User saved to MongoDB:', savedUser._id);

    res.json({
        success: true,
      message: 'User saved successfully!',
        data: {
          id: savedUser.id,
          displayName: savedUser.displayName,
          email: savedUser.email,
        country: savedUser.country,
          username: savedUser.username,
          bio: savedUser.bio,
        currentlyPlaying: savedUser.currentlyPlaying,
        topArtists: savedUser.topArtists,
        topTracks: savedUser.topTracks,
        recentlyPlayed: savedUser.recentlyPlayed,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error: any) {
    logger.error('Error saving user:', error);
    res.status(500).json({
        success: false,
      message: 'Error saving user',
      error: error.message
    });
  }
});

// GET /api/users - Get all saved users
router.get('/', async (req, res) => {
  try {
    const users = await User.find({}).limit(10).sort({ createdAt: -1 });
    
    res.json({
      success: true,
      message: 'Users retrieved successfully',
      count: users.length,
      data: users.map(user => ({
        id: user.id,
        displayName: user.displayName,
        email: user.email,
        country: user.country,
        currentlyPlaying: user.currentlyPlaying,
        topArtists: user.topArtists,
        topTracks: user.topTracks,
        recentlyPlayed: user.recentlyPlayed,
        createdAt: user.createdAt
      }))
    });

  } catch (error: any) {
    logger.error('Error getting users:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting users',
      error: error.message
    });
  }
});

// GET /api/users/:id/profile - Get user profile with posts (efficient)
router.get('/:id/profile', async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.query.currentUserId as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    logger.info(`Getting profile for user: ${id}`);

    // Get user with populated posts
    const user = await User.findOne({ id })
      .populate({
        path: 'posts',
        options: {
          sort: { createdAt: -1 },
          skip: skip,
          limit: limit
        }
      });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        error: 'USER_NOT_FOUND'
      } as ApiResponse);
    }

    // Get likes with usernames for posts
    const postsWithLikes = await Promise.all(user.posts.map(async (post: any) => {
      // Get usernames for likes
      const likedUsers = await User.find({ id: { $in: post.likes } }).select('id displayName username');
      const likesWithNames = post.likes.map((userId: string) => {
        const user = likedUsers.find((u: any) => u.id === userId);
        return {
          userId: userId,
          username: user?.displayName || user?.username || 'Unknown User'
        };
      });
      
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
        isLikedByCurrentUser: post.likes.includes(currentUserId)
      };
    }));

    return res.json({
      success: true,
      message: 'User profile retrieved successfully',
      data: {
        user: {
          id: user.id,
          displayName: user.displayName,
          username: user.username,
          profilePicture: user.profilePicture,
          country: user.country,
          bio: user.bio,
          followersCount: user.followers.length,
          followingCount: user.following.length,
          postsCount: user.posts.length
        },
        posts: postsWithLikes,
        pagination: {
          page,
          limit,
          total: user.posts.length
        }
      }
    } as ApiResponse<any>);

  } catch (error: any) {
    logger.error('Error getting user profile:', error);
    return res.status(500).json({
      success: false,
      message: 'Error getting user profile',
      error: error.message
    } as ApiResponse);
  }
});

// GET /api/users/:id - Get user by id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findOne({ id });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        error: 'USER_NOT_FOUND'
      } as ApiResponse);
    }

    return res.status(200).json({
      success: true,
      message: 'User retrieved successfully',
      data: {
        id: user.id,
        displayName: user.displayName,
        email: user.email,
        username: user.username,
        profilePicture: user.profilePicture,
        country: user.country,
        bio: user.bio,
        currentlyPlaying: user.currentlyPlaying,
        topArtists: user.topArtists,
        topTracks: user.topTracks,
        recentlyPlayed: user.recentlyPlayed,
        followersCount: user.followers.length,
        followingCount: user.following.length,
        isActive: user.isActive,
        lastActiveAt: user.lastActiveAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    } as ApiResponse<any>);

  } catch (error: any) {
    logger.error('Error retrieving user:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'INTERNAL_ERROR'
    } as ApiResponse);
  }
});

// PUT /api/users/:id - Update user
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Remove ID from update data (ID cannot be changed)
    delete updateData.id;
    
    logger.info('User update request:', { id, updateData });

    const updatedUser = await User.findOneAndUpdate(
      { id },
      {
        displayName: updateData.displayName,
        email: updateData.email,
        username: updateData.username,
        profilePicture: updateData.profilePicture,
        country: updateData.country,
        bio: updateData.bio,
        currentlyPlaying: updateData.currentlyPlaying,
        topArtists: updateData.topArtists,
        topTracks: updateData.topTracks,
        recentlyPlayed: updateData.recentlyPlayed,
        lastActiveAt: new Date()
      },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        error: 'USER_NOT_FOUND'
      } as ApiResponse);
    }

    logger.info('User updated successfully:', updatedUser._id);

    return res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: {
        id: updatedUser.id,
        displayName: updatedUser.displayName,
        email: updatedUser.email,
        username: updatedUser.username,
        profilePicture: updatedUser.profilePicture,
        country: updatedUser.country,
        bio: updatedUser.bio,
        currentlyPlaying: updatedUser.currentlyPlaying,
        topArtists: updatedUser.topArtists,
        topTracks: updatedUser.topTracks,
        recentlyPlayed: updatedUser.recentlyPlayed,
        lastActiveAt: updatedUser.lastActiveAt,
        updatedAt: updatedUser.updatedAt
      }
    } as ApiResponse<any>);

  } catch (error: any) {
    logger.error('Error updating user:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Error updating user',
      error: error.message
    } as ApiResponse);
  }
});

// DELETE /api/users/:id - Delete user (logout)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    logger.info('User delete request:', { id });

    const deletedUser = await User.findOneAndDelete({ id });

    if (!deletedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        error: 'USER_NOT_FOUND'
      } as ApiResponse);
    }

    // CASCADE DELETE: Delete all user's posts
    await Post.deleteMany({ userId: id });
    
    // Remove user from all followers' following lists
    await User.updateMany(
      { following: deletedUser._id },
      { $pull: { following: deletedUser._id } }
    );
    
    // Remove user from all following users' followers lists
    await User.updateMany(
      { followers: deletedUser._id },
      { $pull: { followers: deletedUser._id } }
    );

    logger.info('User and all related data deleted successfully:', deletedUser._id);

    return res.status(200).json({
      success: true,
      message: 'User deleted successfully',
      data: {
        id: deletedUser.id,
        displayName: deletedUser.displayName,
        deletedAt: new Date().toISOString()
      }
    } as ApiResponse<any>);

  } catch (error: any) {
    logger.error('Error deleting user:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Error deleting user',
      error: error.message
    } as ApiResponse);
  }
});

// GET /api/users - Get all users (with pagination)
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const users = await User.find({ isActive: true })
      .select('id displayName email username profilePicture country bio followers following lastActiveAt createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments({ isActive: true });

    // Transform users to include counts
    const transformedUsers = users.map(user => ({
      id: user.id,
      displayName: user.displayName,
      email: user.email,
      username: user.username,
      profilePicture: user.profilePicture,
      country: user.country,
      bio: user.bio,
      followersCount: user.followers.length,
      followingCount: user.following.length,
      lastActiveAt: user.lastActiveAt,
      createdAt: user.createdAt
    }));

    return res.status(200).json({
      success: true,
      message: 'Users retrieved successfully',
      data: transformedUsers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    } as ApiResponse<any[]>);

  } catch (error: any) {
    logger.error('Error retrieving users:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'INTERNAL_ERROR'
    } as ApiResponse);
  }
});

// POST /api/users/:id/follow - Follow a user
router.post('/:id/follow', async (req, res) => {
  try {
    const { id: targetUserId } = req.params;
    const { followerId } = req.body;

    if (!followerId) {
      return res.status(400).json({
        success: false,
        message: 'Follower ID is required'
      } as ApiResponse);
    }

    if (followerId === targetUserId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot follow yourself'
      } as ApiResponse);
    }

    // Get both users
    const follower = await User.findOne({ id: followerId });
    const targetUser = await User.findOne({ id: targetUserId });

    if (!follower || !targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        error: 'USER_NOT_FOUND'
      } as ApiResponse);
    }

    // Check if already following
    if (follower.following.includes(targetUserId)) {
      return res.status(400).json({
        success: false,
        message: 'Already following this user'
      } as ApiResponse);
    }

    // Add to following/followers
    follower.following.push(targetUserId);
    targetUser.followers.push(followerId);

    await follower.save();
    await targetUser.save();

    logger.info(`User ${followerId} followed user ${targetUserId}`);

    return res.json({
      success: true,
      message: 'User followed successfully',
      data: {
        followerId,
        targetUserId,
        followingCount: follower.following.length,
        followersCount: targetUser.followers.length
      }
    } as ApiResponse<any>);

  } catch (error: any) {
    logger.error('Error following user:', error);
    return res.status(500).json({
      success: false,
      message: 'Error following user',
      error: error.message
    } as ApiResponse);
  }
});

// DELETE /api/users/:id/follow - Unfollow a user
router.delete('/:id/follow', async (req, res) => {
  try {
    const { id: targetUserId } = req.params;
    const { followerId } = req.body;

    if (!followerId) {
      return res.status(400).json({
        success: false,
        message: 'Follower ID is required'
      } as ApiResponse);
    }

    // Get both users
    const follower = await User.findOne({ id: followerId });
    const targetUser = await User.findOne({ id: targetUserId });

    if (!follower || !targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        error: 'USER_NOT_FOUND'
      } as ApiResponse);
    }

    // Remove from following/followers
    follower.following = follower.following.filter(id => id !== targetUserId);
    targetUser.followers = targetUser.followers.filter(id => id !== followerId);

    await follower.save();
    await targetUser.save();

    logger.info(`User ${followerId} unfollowed user ${targetUserId}`);

    return res.json({
      success: true,
      message: 'User unfollowed successfully',
      data: {
        followerId,
        targetUserId,
        followingCount: follower.following.length,
        followersCount: targetUser.followers.length
      }
    } as ApiResponse<any>);

  } catch (error: any) {
    logger.error('Error unfollowing user:', error);
    return res.status(500).json({
      success: false,
      message: 'Error unfollowing user',
      error: error.message
    } as ApiResponse);
  }
});

export default router;
