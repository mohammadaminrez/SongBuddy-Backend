import mongoose, { Schema } from 'mongoose';
import { IPost } from '../types';

const postSchema = new Schema<IPost>({
  id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  userId: {
    type: String,
    required: true,
    index: true
  },
  username: {
    type: String,
    required: true,
    trim: true
  },
  userProfilePicture: {
    type: String,
    default: ''
  },
  songName: {
    type: String,
    required: true,
    trim: true
  },
  artistName: {
    type: String,
    required: true,
    trim: true
  },
  songImage: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true,
    maxlength: 500,
    trim: true
  },
  likeCount: {
    type: Number,
    default: 0
  },
  likes: [{
    type: String, // User IDs who liked
    ref: 'User'
  }],
  timeline: {
    type: String,
    default: 'now'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
postSchema.index({ userId: 1, createdAt: -1 });
postSchema.index({ id: 1 });
postSchema.index({ createdAt: -1 });
postSchema.index({ likes: 1 });

// Text search index
postSchema.index({ 
  songName: 'text', 
  artistName: 'text', 
  description: 'text'
});

// Virtual fields
postSchema.virtual('likesCount').get(function() {
  return this.likes.length;
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
        createdAt: 1,
        updatedAt: 1,
        'user._id': 1,
        'user.displayName': 1,
        'user.profilePicture': 1,
        likesCount: { $size: '$likes' }
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
          $size: '$likes'
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

export default mongoose.model<IPost>('Post', postSchema);
