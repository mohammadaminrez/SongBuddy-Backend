import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User';
import Post from '../models/Post';
import { databaseService } from '../services/database';
import { logger } from '../utils/logger';

// Load environment variables
dotenv.config();

async function addPostsForFollowing() {
  try {
    // Connect to database
    await databaseService.connect();
    logger.info('Connected to MongoDB for adding posts to following users');

    const existingUserId = '31ey4rngsv4lachasdm4awbpsu2m';
    
    // Find the existing user and populate their following
    const existingUser = await User.findOne({ id: existingUserId }).populate('following');
    if (!existingUser) {
      logger.error('Existing user not found');
      return;
    }

    logger.info(`Found existing user: ${existingUser.displayName}`);
    logger.info(`User is following ${existingUser.following.length} users`);

    // Create posts for each user that the existing user is following
    const postsToCreate = [
      // Alice Johnson posts
      {
        userId: 'user1',
        username: 'Alice Johnson',
        userProfilePicture: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
        songName: 'Anti-Hero',
        artistName: 'Taylor Swift',
        songImage: 'https://i.scdn.co/image/ab67616d0000b273bb54dde68cd23e2a268ae0f5',
        description: 'Taylor Swift never misses! This song hits different every time 🎵',
        likeCount: 0,
        likes: []
      },
      {
        userId: 'user1',
        username: 'Alice Johnson',
        userProfilePicture: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
        songName: 'As It Was',
        artistName: 'Harry Styles',
        songImage: 'https://i.scdn.co/image/ab67616d0000b273f7b7174bef6f3fbfda3a0bb7',
        description: 'Harry Styles always delivers the perfect vibes! This song is pure magic ✨',
        likeCount: 0,
        likes: []
      },

      // Bob Smith posts
      {
        userId: 'user2',
        username: 'Bob Smith',
        userProfilePicture: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
        songName: 'Bohemian Rhapsody',
        artistName: 'Queen',
        songImage: 'https://i.scdn.co/image/ab67616d0000b273ce4f1737bc8a646c8c4bd25a',
        description: 'Classic Queen! This song is a masterpiece that never gets old 👑',
        likeCount: 0,
        likes: []
      },
      {
        userId: 'user2',
        username: 'Bob Smith',
        userProfilePicture: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
        songName: 'Hotel California',
        artistName: 'Eagles',
        songImage: 'https://i.scdn.co/image/ab67616d0000b273dbb1b3f6e7e8b7c7e8b7c7e8',
        description: 'Eagles at their finest! This song takes me on a journey every time 🦅',
        likeCount: 0,
        likes: []
      },

      // Charlie Brown posts
      {
        userId: 'user3',
        username: 'Charlie Brown',
        userProfilePicture: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
        songName: 'Imagine',
        artistName: 'John Lennon',
        songImage: 'https://i.scdn.co/image/ab67616d0000b273dbb1b3f6e7e8b7c7e8b7c7e8',
        description: 'John Lennon\'s vision of peace still resonates today. Timeless message 🌍',
        likeCount: 0,
        likes: []
      },
      {
        userId: 'user3',
        username: 'Charlie Brown',
        userProfilePicture: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
        songName: 'Hey Jude',
        artistName: 'The Beatles',
        songImage: 'https://i.scdn.co/image/ab67616d0000b273dbb1b3f6e7e8b7c7e8b7c7e8',
        description: 'The Beatles never disappoint! This song is pure comfort and joy 🎸',
        likeCount: 0,
        likes: []
      }
    ];

    // Create posts and add them to the respective users
    const createdPosts = [];
    for (const postData of postsToCreate) {
      const post = new Post(postData);
      await post.save();
      createdPosts.push(post);
      
      // Add post to user's posts array
      const user = await User.findOne({ id: postData.userId });
      if (user) {
        user.posts.push(post._id);
        await user.save();
        logger.info(`Created post: ${postData.songName} by ${postData.username}`);
      }
    }

    // Add some likes to make the posts more engaging
    const likeRelationships = [
      { postIndex: 0, likedBy: ['user2', 'user3'] }, // Alice's Anti-Hero
      { postIndex: 1, likedBy: ['user2'] }, // Alice's As It Was
      { postIndex: 2, likedBy: ['user1', 'user3'] }, // Bob's Bohemian Rhapsody
      { postIndex: 3, likedBy: ['user1'] }, // Bob's Hotel California
      { postIndex: 4, likedBy: ['user1', 'user2'] }, // Charlie's Imagine
      { postIndex: 5, likedBy: ['user2'] } // Charlie's Hey Jude
    ];

    for (const likeRel of likeRelationships) {
      const post = createdPosts[likeRel.postIndex];
      if (post) {
        post.likes = likeRel.likedBy;
        post.likeCount = post.likes.length;
        await post.save();
        logger.info(`Added ${post.likeCount} likes to post: ${post.songName}`);
      }
    }

    logger.info('🎉 Posts for following users created successfully!');
    
    // Display summary
    console.log('\n📊 Posts Added Summary:');
    console.log('=======================');
    console.log(`👤 ${existingUser.displayName} is following ${existingUser.following.length} users`);
    console.log(`📝 Created ${createdPosts.length} new posts for those users`);
    
    console.log('\n🎵 New Posts in Feed:');
    console.log('=====================');
    for (const post of createdPosts) {
      console.log(`\n🎵 ${post.songName} by ${post.artistName}`);
      console.log(`   👤 Posted by: ${post.username}`);
      console.log(`   💬 "${post.description}"`);
      console.log(`   ❤️  Likes: ${post.likeCount}`);
    }

    console.log('\n✅ Now your home feed will show posts from users you follow!');

  } catch (error) {
    logger.error('Error adding posts for following users:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    logger.info('Disconnected from MongoDB');
  }
}

// Run the function
if (require.main === module) {
  addPostsForFollowing()
    .then(() => {
      console.log('\n✅ Posts for following users added successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Failed to add posts:', error);
      process.exit(1);
    });
}

export default addPostsForFollowing;
