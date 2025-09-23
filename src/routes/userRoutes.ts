import express from 'express';
import User from '../models/User';
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

export default router;
