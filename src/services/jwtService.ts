import jwt from 'jsonwebtoken';
import { JWTPayload } from '../types';
import { logger } from '../utils/logger';

class JWTService {
  private static instance: JWTService;
  private readonly secret: string;
  private readonly expiresIn: string;
  private readonly refreshExpiresIn: string;

  private constructor() {
    this.secret = process.env.JWT_SECRET || 'fallback-secret-key';
    this.expiresIn = process.env.JWT_EXPIRES_IN || '7d';
    this.refreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '30d';

    if (!process.env.JWT_SECRET) {
      logger.warn('JWT_SECRET not set, using fallback secret. This is not secure for production!');
    }
  }

  public static getInstance(): JWTService {
    if (!JWTService.instance) {
      JWTService.instance = new JWTService();
    }
    return JWTService.instance;
  }

  public generateAccessToken(payload: {
    userId: string;
    spotifyId: string;
    email: string;
  }): string {
    try {
      const tokenPayload: JWTPayload = {
        userId: payload.userId,
        spotifyId: payload.spotifyId,
        email: payload.email,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + this.parseExpiresIn(this.expiresIn)
      };

      return jwt.sign(tokenPayload, this.secret, {
        expiresIn: this.expiresIn
      });
    } catch (error) {
      logger.error('Error generating access token:', error);
      throw new Error('Failed to generate access token');
    }
  }

  public generateRefreshToken(payload: {
    userId: string;
    spotifyId: string;
    email: string;
  }): string {
    try {
      const tokenPayload = {
        userId: payload.userId,
        spotifyId: payload.spotifyId,
        email: payload.email,
        type: 'refresh',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + this.parseExpiresIn(this.refreshExpiresIn)
      };

      return jwt.sign(tokenPayload, this.secret, {
        expiresIn: this.refreshExpiresIn
      });
    } catch (error) {
      logger.error('Error generating refresh token:', error);
      throw new Error('Failed to generate refresh token');
    }
  }

  public verifyAccessToken(token: string): JWTPayload {
    try {
      const decoded = jwt.verify(token, this.secret, {
        issuer: 'songbuddy-api',
        audience: 'songbuddy-app'
      }) as JWTPayload;

      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Access token has expired');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid access token');
      } else {
        logger.error('Error verifying access token:', error);
        throw new Error('Failed to verify access token');
      }
    }
  }

  public verifyRefreshToken(token: string): {
    userId: string;
    spotifyId: string;
    email: string;
    type: string;
  } {
    try {
      const decoded = jwt.verify(token, this.secret, {
        issuer: 'songbuddy-api',
        audience: 'songbuddy-app'
      }) as any;

      if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type');
      }

      return {
        userId: decoded.userId,
        spotifyId: decoded.spotifyId,
        email: decoded.email,
        type: decoded.type
      };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Refresh token has expired');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid refresh token');
      } else {
        logger.error('Error verifying refresh token:', error);
        throw new Error('Failed to verify refresh token');
      }
    }
  }

  public decodeToken(token: string): any {
    try {
      return jwt.decode(token);
    } catch (error) {
      logger.error('Error decoding token:', error);
      return null;
    }
  }

  public getTokenExpiration(token: string): Date | null {
    try {
      const decoded = this.decodeToken(token);
      if (decoded && decoded.exp) {
        return new Date(decoded.exp * 1000);
      }
      return null;
    } catch (error) {
      logger.error('Error getting token expiration:', error);
      return null;
    }
  }

  public isTokenExpired(token: string): boolean {
    try {
      const expiration = this.getTokenExpiration(token);
      if (!expiration) {
        return true;
      }
      return expiration < new Date();
    } catch (error) {
      logger.error('Error checking token expiration:', error);
      return true;
    }
  }

  public getTokenTimeRemaining(token: string): number {
    try {
      const expiration = this.getTokenExpiration(token);
      if (!expiration) {
        return 0;
      }
      const remaining = expiration.getTime() - Date.now();
      return Math.max(0, remaining);
    } catch (error) {
      logger.error('Error getting token time remaining:', error);
      return 0;
    }
  }

  private parseExpiresIn(expiresIn: string): number {
    const unit = expiresIn.slice(-1);
    const value = parseInt(expiresIn.slice(0, -1));

    switch (unit) {
      case 's': return value;
      case 'm': return value * 60;
      case 'h': return value * 60 * 60;
      case 'd': return value * 60 * 60 * 24;
      case 'w': return value * 60 * 60 * 24 * 7;
      default: return 60 * 60 * 24 * 7; // Default to 7 days
    }
  }

  public generateTokenPair(payload: {
    userId: string;
    spotifyId: string;
    email: string;
  }): {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  } {
    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshToken(payload);
    const expiresIn = this.parseExpiresIn(this.expiresIn);

    return {
      accessToken,
      refreshToken,
      expiresIn
    };
  }

  public async refreshTokenPair(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }> {
    const decoded = this.verifyRefreshToken(refreshToken);
    
    return this.generateTokenPair({
      userId: decoded.userId,
      spotifyId: decoded.spotifyId,
      email: decoded.email
    });
  }
}

export const jwtService = JWTService.getInstance();
export default jwtService;
