import mongoose, { Schema } from 'mongoose';
import { IPost, IComment } from '../types';

const commentSchema = new Schema<IComment>({
  postId: {
    type: Schema.Types.ObjectId,
    ref: 'Post',
    required: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  likes: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

commentSchema.virtual('likesCount').get(function() {
  return this.likes.length;
});

const postSchema = new Schema<IPost>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  trackId: {
    type: String,
    required: true,
    index: true
  },
  trackName: {
    type: String,
    required: true,
    trim: true
  },
  artistName: {
    type: String,
    required: true,
    trim: true
  },
  albumName: {
    type: String,
    required: true,
    trim: true
  },
  albumCover: {
    type: String,
    required: true
  },
  previewUrl: {
    type: String,
    default: ''
  },
  externalUrl: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    maxlength: 500,
    default: ''
  },
  likes: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  comments: [commentSchema],
  shares: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
postSchema.index({ userId: 1, createdAt: -1 });
postSchema.index({ trackId: 1 });
postSchema.index({ createdAt: -1 });
postSchema.index({ likes: 1 });
postSchema.index({ 'comments.createdAt': -1 });

// Text search index
postSchema.index({ 
  trackName: 'text', 
  artistName: 'text', 
  albumName: 'text',
  description: 'text'
});

// Virtual fields
postSchema.virtual('likesCount').get(function() {
  return this.likes.length;
});

postSchema.virtual('commentsCount').get(function() {
  return this.comments.length;
});

// Instance methods
postSchema.methods.isLikedBy = function(userId: string): boolean {
  return this.likes.some((id: any) => id.toString() === userId);
};

postSchema.methods.like = async function(userId: string): Promise<void> {
  if (!this.isLikedBy(userId)) {
    this.likes.push(userId);
    await this.save();
  }
};

postSchema.methods.unlike = async function(userId: string): Promise<void> {
  this.likes = this.likes.filter((id: any) => id.toString() !== userId);
  await this.save();
};

postSchema.methods.addComment = async function(userId: string, content: string): Promise<IComment> {
  const comment = new this.comments({
    postId: this._id,
    userId,
    content
  });
  
  this.comments.push(comment);
  await this.save();
  return comment;
};

postSchema.methods.removeComment = async function(commentId: string): Promise<void> {
  this.comments = this.comments.filter((comment: any) => comment._id.toString() !== commentId);
  await this.save();
};

postSchema.methods.incrementShares = async function(): Promise<void> {
  this.shares += 1;
  await this.save();
};

// Static methods
postSchema.statics.getFeed = function(userId: string, page: number = 1, limit: number = 20) {
  const skip = (page - 1) * limit;
  
  return this.aggregate([
    {
      $lookup: {
        from: 'users',
        localField: 'userId',
        foreignField: '_id',
        as: 'user'
      }
    },
    {
      $unwind: '$user'
    },
    {
      $match: {
        $or: [
          { userId: new mongoose.Types.ObjectId(userId) },
          { 'user.followers': new mongoose.Types.ObjectId(userId) }
        ]
      }
    },
    {
      $sort: { createdAt: -1 }
    },
    {
      $skip: skip
    },
    {
      $limit: limit
    },
    {
      $project: {
        _id: 1,
        trackId: 1,
        trackName: 1,
        artistName: 1,
        albumName: 1,
        albumCover: 1,
        previewUrl: 1,
        externalUrl: 1,
        duration: 1,
        description: 1,
        likes: 1,
        comments: 1,
        shares: 1,
        createdAt: 1,
        updatedAt: 1,
        'user._id': 1,
        'user.displayName': 1,
        'user.profilePicture': 1,
        likesCount: { $size: '$likes' },
        commentsCount: { $size: '$comments' }
      }
    }
  ]);
};

postSchema.statics.getUserPosts = function(userId: string, page: number = 1, limit: number = 20) {
  const skip = (page - 1) * limit;
  
  return this.find({ userId })
    .populate('userId', 'displayName profilePicture')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

postSchema.statics.searchPosts = function(query: string, page: number = 1, limit: number = 20) {
  const skip = (page - 1) * limit;
  
  return this.find(
    { 
      $text: { $search: query },
      isActive: true
    },
    { score: { $meta: 'textScore' } }
  )
  .populate('userId', 'displayName profilePicture')
  .sort({ score: { $meta: 'textScore' }, createdAt: -1 })
  .skip(skip)
  .limit(limit);
};

postSchema.statics.getTrendingPosts = function(page: number = 1, limit: number = 20) {
  const skip = (page - 1) * limit;
  
  return this.aggregate([
    {
      $addFields: {
        engagementScore: {
          $add: [
            { $size: '$likes' },
            { $multiply: [{ $size: '$comments' }, 2] },
            { $multiply: ['$shares', 3] }
          ]
        }
      }
    },
    {
      $sort: { engagementScore: -1, createdAt: -1 }
    },
    {
      $skip: skip
    },
    {
      $limit: limit
    },
    {
      $lookup: {
        from: 'users',
        localField: 'userId',
        foreignField: '_id',
        as: 'user'
      }
    },
    {
      $unwind: '$user'
    }
  ]);
};

export const Comment = mongoose.model<IComment>('Comment', commentSchema);
export default mongoose.model<IPost>('Post', postSchema);
