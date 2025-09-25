import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import { IUser } from '../types';

const userSchema = new Schema<IUser>({
  id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  displayName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  username: {
    type: String,
    trim: true,
    maxlength: 30,
    sparse: true // Allows multiple null values but enforces uniqueness for non-null values
  },
  profilePicture: {
    type: String,
    default: ''
  },
  country: {
    type: String,
    trim: true,
    maxlength: 50
  },
  bio: {
    type: String,
    maxlength: 160,
    default: ''
  },
  followers: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  following: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  posts: [{
    type: Schema.Types.ObjectId,
    ref: 'Post'
  }],
  preferences: {
    theme: {
      type: String,
      enum: ['light', 'dark'],
      default: 'dark'
    },
    notifications: {
      type: Boolean,
      default: true
    },
    privacy: {
      type: String,
      enum: ['public', 'private'],
      default: 'public'
    }
  },
  currentlyPlaying: {
    type: Schema.Types.Mixed,
    default: null
  },
  topArtists: [{
    type: Schema.Types.Mixed
  }],
  topTracks: [{
    type: Schema.Types.Mixed
  }],
  recentlyPlayed: [{
    type: Schema.Types.Mixed
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  lastActiveAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
userSchema.index({ id: 1 });
userSchema.index({ email: 1 });
userSchema.index({ username: 1 }, { sparse: true });
userSchema.index({ displayName: 'text' });
userSchema.index({ createdAt: -1 });

// Search-specific indexes for improved regex performance
userSchema.index({ displayName: 1 });
userSchema.index({ username: 1 });
userSchema.index({ isActive: 1, displayName: 1 });
userSchema.index({ isActive: 1, username: 1 });

// Compound index for search queries
userSchema.index({ 
  isActive: 1, 
  displayName: 'text', 
  username: 'text' 
});

// Virtual fields
userSchema.virtual('followersCount').get(function() {
  return this.followers ? this.followers.length : 0;
});

userSchema.virtual('followingCount').get(function() {
  return this.following ? this.following.length : 0;
});

// Instance methods
userSchema.methods.isFollowing = function(userId: string): boolean {
  return this.following ? this.following.some((id: any) => id.toString() === userId) : false;
};

userSchema.methods.follow = async function(userId: string): Promise<void> {
  if (!this.following) {
    this.following = [];
  }
  if (!this.isFollowing(userId)) {
    this.following.push(userId);
    await this.save();
  }
};

userSchema.methods.unfollow = async function(userId: string): Promise<void> {
  if (this.following) {
    this.following = this.following.filter((id: any) => id.toString() !== userId);
    await this.save();
  }
};

userSchema.methods.addFollower = async function(userId: string): Promise<void> {
  if (!this.followers) {
    this.followers = [];
  }
  if (!this.followers.some((id: any) => id.toString() === userId)) {
    this.followers.push(userId);
    await this.save();
  }
};

userSchema.methods.removeFollower = async function(userId: string): Promise<void> {
  if (this.followers) {
    this.followers = this.followers.filter((id: any) => id.toString() !== userId);
    await this.save();
  }
};

userSchema.methods.updateLastActive = async function(): Promise<void> {
  this.lastActiveAt = new Date();
  await this.save();
};

// Static methods
userSchema.statics.findById = function(id: string) {
  return this.findOne({ id });
};

userSchema.statics.findByEmail = function(email: string) {
  return this.findOne({ email: email.toLowerCase() });
};

userSchema.statics.findByUsername = function(username: string) {
  return this.findOne({ username });
};

userSchema.statics.searchUsers = function(query: string, limit: number = 10) {
  return this.find(
    { 
      $or: [
        { displayName: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ],
      isActive: true
    }
  ).limit(limit);
};

// Pre-save middleware
userSchema.pre('save', function(next) {
  if (this.isModified('email')) {
    this.email = this.email.toLowerCase();
  }
  next();
});

export default mongoose.model<IUser>('User', userSchema);
