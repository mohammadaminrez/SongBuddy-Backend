import mongoose, { Schema } from 'mongoose';
import { INotification } from '../types';

const notificationSchema = new Schema<INotification>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    required: true,
    enum: ['like', 'follow', 'comment', 'share'],
    index: true
  },
  fromUserId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  postId: {
    type: Schema.Types.ObjectId,
    ref: 'Post',
    required: function() {
      return ['like', 'comment', 'share'].includes(this.type);
    }
  },
  commentId: {
    type: Schema.Types.ObjectId,
    ref: 'Comment',
    required: function() {
      return this.type === 'comment';
    }
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  isRead: {
    type: Boolean,
    default: false,
    index: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, isRead: 1 });
notificationSchema.index({ fromUserId: 1 });
notificationSchema.index({ type: 1 });

// Compound indexes
notificationSchema.index({ userId: 1, type: 1, isRead: 1 });

// Static methods
notificationSchema.statics.getUserNotifications = function(
  userId: string, 
  page: number = 1, 
  limit: number = 20
) {
  const skip = (page - 1) * limit;
  
  return this.find({ userId })
    .populate('fromUserId', 'displayName profilePicture')
    .populate('postId', 'trackName artistName albumCover')
    .populate('commentId', 'content')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

notificationSchema.statics.getUnreadCount = function(userId: string) {
  return this.countDocuments({ userId, isRead: false });
};

notificationSchema.statics.markAllAsRead = function(userId: string) {
  return this.updateMany(
    { userId, isRead: false },
    { isRead: true }
  );
};

notificationSchema.statics.markAsRead = function(notificationId: string, userId: string) {
  return this.findOneAndUpdate(
    { _id: notificationId, userId },
    { isRead: true },
    { new: true }
  );
};

notificationSchema.statics.createNotification = async function(data: {
  userId: string;
  type: 'like' | 'follow' | 'comment' | 'share';
  fromUserId: string;
  postId?: string;
  commentId?: string;
  message: string;
}) {
  // Don't create notification if user is trying to notify themselves
  if (data.userId === data.fromUserId) {
    return null;
  }

  // Check if similar notification already exists (to avoid spam)
  const existingNotification = await this.findOne({
    userId: data.userId,
    type: data.type,
    fromUserId: data.fromUserId,
    postId: data.postId,
    isRead: false,
    createdAt: { $gte: new Date(Date.now() - 60000) } // Within last minute
  });

  if (existingNotification) {
    return existingNotification;
  }

  return this.create(data);
};

// Instance methods
notificationSchema.methods.markAsRead = async function() {
  this.isRead = true;
  return this.save();
};

export default mongoose.model<INotification>('Notification', notificationSchema);
