import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import { IUser } from '../types';

const userSchema = new Schema<IUser>({
  spotifyId: {
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
  profilePicture: {
    type: String,
    default: ''
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
userSchema.index({ spotifyId: 1 });
userSchema.index({ email: 1 });
userSchema.index({ displayName: 'text' });
userSchema.index({ createdAt: -1 });

// Virtual fields
userSchema.virtual('followersCount').get(function() {
  return this.followers.length;
});

userSchema.virtual('followingCount').get(function() {
  return this.following.length;
});

// Instance methods
userSchema.methods.isFollowing = function(userId: string): boolean {
  return this.following.some((id: any) => id.toString() === userId);
};

userSchema.methods.follow = async function(userId: string): Promise<void> {
  if (!this.isFollowing(userId)) {
    this.following.push(userId);
    await this.save();
  }
};

userSchema.methods.unfollow = async function(userId: string): Promise<void> {
  this.following = this.following.filter((id: any) => id.toString() !== userId);
  await this.save();
};

userSchema.methods.addFollower = async function(userId: string): Promise<void> {
  if (!this.followers.some((id: any) => id.toString() === userId)) {
    this.followers.push(userId);
    await this.save();
  }
};

userSchema.methods.removeFollower = async function(userId: string): Promise<void> {
  this.followers = this.followers.filter((id: any) => id.toString() !== userId);
  await this.save();
};

userSchema.methods.updateLastActive = async function(): Promise<void> {
  this.lastActiveAt = new Date();
  await this.save();
};

// Static methods
userSchema.statics.findBySpotifyId = function(spotifyId: string) {
  return this.findOne({ spotifyId });
};

userSchema.statics.findByEmail = function(email: string) {
  return this.findOne({ email: email.toLowerCase() });
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
