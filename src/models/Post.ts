import mongoose, { Schema } from 'mongoose';
import { IPost } from '../types';

const postSchema = new Schema<IPost>({
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
    maxlength: 500,
    default: ''
  },
  likeCount: {
    type: Number,
    default: 0
  },
  likes: [{
    type: String,
    ref: 'User'
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
postSchema.index({ userId: 1, createdAt: -1 });
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

// Virtual field for dynamic timeline
postSchema.virtual('timeline').get(function() {
  const now = new Date();
  const created = this.createdAt;
  const diffInSeconds = Math.floor((now.getTime() - created.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return 'now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes}m`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}h`;
  } else if (diffInSeconds < 2592000) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days}d`;
  } else if (diffInSeconds < 31536000) {
    const months = Math.floor(diffInSeconds / 2592000);
    return `${months}mo`;
  } else {
    const years = Math.floor(diffInSeconds / 31536000);
    return `${years}y`;
  }
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
        userId: 1,
        username: 1,
        userProfilePicture: 1,
        songName: 1,
        artistName: 1,
        songImage: 1,
        description: 1,
        likeCount: 1,
        likes: 1,
        timeline: 1,
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
