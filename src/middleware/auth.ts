import { Request, Response, NextFunction } from 'express';
import { jwtService } from '../services/jwtService';
import User from '../models/User';
import { AuthenticatedRequest } from '../types';
import { logger } from '../utils/logger';

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = (req.headers as any).authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Access token is required'
      });
      return;
    }

    // Verify the token
    const decoded = jwtService.verifyAccessToken(token);
    
    // Find the user
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    if (!user.isActive) {
      res.status(401).json({
        success: false,
        message: 'User account is deactivated'
      });
      return;
    }

    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    
    const message = error instanceof Error ? error.message : 'Authentication failed';
    
    res.status(401).json({
      success: false,
      message
    });
  }
};

export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = (req.headers as any).authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      try {
        const decoded = jwtService.verifyAccessToken(token);
        const user = await User.findById(decoded.userId);
        
        if (user && user.isActive) {
          req.user = user;
        }
      } catch (error) {
        // Token is invalid, but we continue without authentication
        logger.debug('Optional auth token verification failed:', error);
      }
    }

    next();
  } catch (error) {
    logger.error('Optional authentication error:', error);
    next(); // Continue even if optional auth fails
  }
};

export const requireSpotifyAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    // Check if user has Spotify ID (indicating they've connected Spotify)
    if (!req.user.spotifyId) {
      res.status(403).json({
        success: false,
        message: 'Spotify account connection required'
      });
      return;
    }

    next();
  } catch (error) {
    logger.error('Spotify auth requirement error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const validateToken = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = (req.headers as any).authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Token is required'
      });
      return;
    }

    // Verify token without fetching user
    jwtService.verifyAccessToken(token);
    
    res.json({
      success: true,
      message: 'Token is valid'
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid token';
    
    res.status(401).json({
      success: false,
      message
    });
  }
};

export const refreshTokenMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({
        success: false,
        message: 'Refresh token is required'
      });
      return;
    }

    // Verify refresh token
    const decoded = jwtService.verifyRefreshToken(refreshToken);
    
    // Find the user
    const user = await User.findById(decoded.userId);
    
    if (!user || !user.isActive) {
      res.status(401).json({
        success: false,
        message: 'User not found or inactive'
      });
      return;
    }

    // Generate new token pair
    const tokenPair = await jwtService.refreshTokenPair(refreshToken);
    
    res.json({
      success: true,
      message: 'Tokens refreshed successfully',
      data: tokenPair
    });
  } catch (error) {
    logger.error('Token refresh error:', error);
    
    const message = error instanceof Error ? error.message : 'Token refresh failed';
    
    res.status(401).json({
      success: false,
      message
    });
  }
};

// Middleware to check if user owns the resource
export const checkOwnership = (resourceUserIdField: string = 'userId') => {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const resourceUserId = req.params[resourceUserIdField] || req.body[resourceUserIdField];
      
      if (resourceUserId && resourceUserId !== req.user._id.toString()) {
        res.status(403).json({
          success: false,
          message: 'Access denied. You can only access your own resources.'
        });
        return;
      }

      next();
    } catch (error) {
      logger.error('Ownership check error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };
};

// Middleware to check if user is following another user
export const checkFollowing = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const targetUserId = req.params.userId;
    
    if (targetUserId === req.user._id.toString()) {
      // User is trying to follow themselves
      res.status(400).json({
        success: false,
        message: 'Cannot follow yourself'
      });
      return;
    }

    // Check if target user exists
    const targetUser = await User.findById(targetUserId);
    
    if (!targetUser) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    req.targetUser = targetUser;
    next();
  } catch (error) {
    logger.error('Following check error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
