import express from 'express';
import Post from '../models/Post';
import User from '../models/User';
import { logger } from '../utils/logger';
import { ApiResponse } from '../types';

const router = express.Router();

// POST /api/posts/create - Create new post
router.post('/create', async (req, res) => {
  try {
    const postData = req.body;
    
    logger.info('Post creation request:', postData);

    // Create new post
    const newPost = new Post({
      id: postData.id || 'post-' + Date.now(),
      userId: postData.userId,
      username: postData.username,
      userProfilePicture: postData.userProfilePicture || '',
      songName: postData.songName,
      artistName: postData.artistName,
      songImage: postData.songImage,
      description: postData.description,
      timeline: postData.timeline || 'now',
      likeCount: 0,
      likes: [],
      comments: [],
      shares: 0
    });

    const savedPost = await newPost.save();
    logger.info('Post created successfully:', savedPost._id);

    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      data: {
        id: savedPost.id,
        userId: savedPost.userId,
        username: savedPost.username,
        userProfilePicture: savedPost.userProfilePicture,
        songName: savedPost.songName,
        artistName: savedPost.artistName,
        songImage: savedPost.songImage,
        description: savedPost.description,
        likeCount: savedPost.likeCount,
        timeline: savedPost.timeline,
        createdAt: savedPost.createdAt
      }
    } as ApiResponse<any>);

  } catch (error: any) {
    logger.error('Error creating post:', error);
    res.status(500).json({
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

    // Get posts from followed users + user's own posts
    const followingIds = user.following || [];
    const targetUserIds = [...followingIds, userId];

    const posts = await Post.find({ userId: { $in: targetUserIds } })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    logger.info(`Feed for user ${userId}: ${posts.length} posts`);

    return res.json({
      success: true,
      message: 'Feed retrieved successfully',
      data: posts.map(post => ({
        id: post.id,
        userId: post.userId,
        username: post.username,
        userProfilePicture: post.userProfilePicture,
        songName: post.songName,
        artistName: post.artistName,
        songImage: post.songImage,
        description: post.description,
        likeCount: post.likeCount,
        timeline: post.timeline,
        createdAt: post.createdAt
      })),
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

// GET /api/posts/search - Get random recent posts for search feed
router.get('/search', async (req, res) => {
  try {
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

    logger.info(`Search feed: ${posts.length} posts`);

    return res.json({
      success: true,
      message: 'Search feed retrieved successfully',
      data: posts.map(post => ({
        id: post.id,
        userId: post.userId,
        username: post.username,
        userProfilePicture: post.userProfilePicture,
        songName: post.songName,
        artistName: post.artistName,
        songImage: post.songImage,
        description: post.description,
        likeCount: post.likeCount,
        timeline: post.timeline,
        createdAt: post.createdAt
      })),
      pagination: {
        page,
        limit,
        total: posts.length
      }
    } as ApiResponse<any[]>);

  } catch (error: any) {
    logger.error('Error getting search feed:', error);
    return res.status(500).json({
      success: false,
      message: 'Error getting search feed',
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

    const post = await Post.findOne({ id: postId });
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

    return res.json({
      success: true,
      message: 'Post liked successfully',
      data: {
        postId: post.id,
        likeCount: post.likeCount,
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

    const post = await Post.findOne({ id: postId });
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

    return res.json({
      success: true,
      message: 'Post unliked successfully',
      data: {
        postId: post.id,
        likeCount: post.likeCount,
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

    const post = await Post.findOne({ id: postId });
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
        error: 'POST_NOT_FOUND'
      } as ApiResponse);
    }

    return res.json({
      success: true,
      message: 'Post retrieved successfully',
      data: {
        id: post.id,
        userId: post.userId,
        username: post.username,
        userProfilePicture: post.userProfilePicture,
        songName: post.songName,
        artistName: post.artistName,
        songImage: post.songImage,
        description: post.description,
        likeCount: post.likeCount,
        timeline: post.timeline,
        createdAt: post.createdAt
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

    const post = await Post.findOne({ id: postId, userId });
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found or not owned by user',
        error: 'POST_NOT_FOUND'
      } as ApiResponse);
    }

    await Post.findOneAndDelete({ id: postId });
    logger.info(`Post ${postId} deleted by user ${userId}`);

    return res.json({
      success: true,
      message: 'Post deleted successfully',
      data: {
        postId: post.id,
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

export default router;
