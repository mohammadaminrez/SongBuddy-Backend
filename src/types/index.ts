import { Document } from 'mongoose';

// User Types
export interface IUser extends Document {
  _id: string;
  id: string; // Required field from Flutter app
  displayName: string; // Required field
  email: string; // Required field
  username?: string; // Optional field
  profilePicture?: string; // Optional field
  country?: string; // Optional field
  bio?: string; // Optional field
  followers: string[];
  following: string[];
  preferences: {
    theme: 'light' | 'dark';
    notifications: boolean;
    privacy: 'public' | 'private';
  };
  spotifyId?: string; // Optional Spotify ID for connected accounts
  currentlyPlaying?: any;
  topArtists?: any[];
  topTracks?: any[];
  recentlyPlayed?: any[];
  isActive: boolean;
  lastActiveAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// User creation/update request from Flutter app
export interface CreateUserRequest {
  id: string;
  displayName: string;
  email: string;
  username?: string;
  profilePicture?: string;
  country?: string;
  bio?: string;
}

// Post Types
export interface IPost extends Document {
  _id: string;
  id: string;
  userId: string;
  username: string;
  userProfilePicture: string;
  songName: string;
  artistName: string;
  songImage: string;
  description: string;
  likeCount: number;
  likes: string[];
  timeline: string;
  createdAt: Date;
  updatedAt: Date;
}

// Comment Types
export interface IComment extends Document {
  _id: string;
  postId: string;
  userId: string;
  content: string;
  likes: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Notification Types
export interface INotification extends Document {
  _id: string;
  userId: string;
  type: 'like' | 'follow' | 'comment' | 'share';
  fromUserId: string;
  postId?: string;
  commentId?: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
}

// Spotify Types
export interface SpotifyUser {
  id: string;
  display_name: string;
  email: string;
  images: Array<{ url: string; height: number; width: number }>;
  country: string;
  product: string;
}

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: Array<{ id: string; name: string }>;
  album: {
    id: string;
    name: string;
    images: Array<{ url: string; height: number; width: number }>;
  };
  preview_url: string;
  external_urls: { spotify: string };
  duration_ms: number;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// JWT Payload
export interface JWTPayload {
  userId: string;
  spotifyId: string;
  email: string;
  iat: number;
  exp: number;
}

// Request Types
export interface AuthenticatedRequest extends Request {
  user?: IUser;
  targetUser?: IUser;
  params: { [key: string]: string };
  body: any;
}

// Socket Types
export interface SocketData {
  userId: string;
  user: IUser;
}

export interface NotificationData {
  type: string;
  message: string;
  userId: string;
  fromUserId?: string;
  postId?: string;
}
