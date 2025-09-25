import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User';
import Post from '../models/Post';
import { databaseService } from '../services/database';
import { logger } from '../utils/logger';

// Load environment variables
dotenv.config();

async function updateExistingUser() {
  try {
    // Connect to database
    await databaseService.connect();
    logger.info('Connected to MongoDB for updating existing user');

    const existingUserId = '31ey4rngsv4lachasdm4awbpsu2m';
    
    // Find the existing user
    const existingUser = await User.findOne({ id: existingUserId });
    if (!existingUser) {
      logger.error('Existing user not found');
      return;
    }

    logger.info(`Found existing user: ${existingUser.displayName}`);

    // Create some posts for the existing user
    const newPosts = [
      {
        userId: existingUserId,
        username: existingUser.displayName,
        userProfilePicture: existingUser.profilePicture,
        songName: 'Blinding Lights',
        artistName: 'The Weeknd',
        songImage: 'https://i.scdn.co/image/ab67616d0000b2738863bc11d2aa12b54f5aeb36',
        description: 'This song never gets old! Perfect for late night drives 🌃',
        likeCount: 0,
        likes: []
      },
      {
        userId: existingUserId,
        username: existingUser.displayName,
        userProfilePicture: existingUser.profilePicture,
        songName: 'Levitating',
        artistName: 'Dua Lipa',
        songImage: 'https://i.scdn.co/image/ab67616d0000b273f7b7174bef6f3fbfda3a0bb7',
        description: 'Dua Lipa\'s vocals are absolutely incredible! This song makes me want to dance 💃',
        likeCount: 0,
        likes: []
      },
      {
        userId: existingUserId,
        username: existingUser.displayName,
        userProfilePicture: existingUser.profilePicture,
        songName: 'Watermelon Sugar',
        artistName: 'Harry Styles',
        songImage: 'https://i.scdn.co/image/ab67616d0000b2732e8ed79e177ff6011076f5f0',
        description: 'Harry Styles never disappoints! This song brings summer vibes all year round ☀️',
        likeCount: 0,
        likes: []
      }
    ];

    // Create posts and add to user's posts array
    const createdPosts = [];
    for (const postData of newPosts) {
      const post = new Post(postData);
      await post.save();
      createdPosts.push(post);
      
      // Add post to user's posts array
      existingUser.posts.push(post._id);
      
      logger.info(`Created post: ${postData.songName} by ${postData.username}`);
    }

    // Save the user with updated posts
    await existingUser.save();

    // Get all other users for follow relationships
    const otherUsers = await User.find({ id: { $ne: existingUserId } });
    logger.info(`Found ${otherUsers.length} other users for follow relationships`);

    // Create follow relationships
    // Existing user follows some users
    const usersToFollow = otherUsers.slice(0, 3); // Follow first 3 users
    for (const userToFollow of usersToFollow) {
      existingUser.following.push(userToFollow._id);
      userToFollow.followers.push(existingUser._id);
      
      await userToFollow.save();
      logger.info(`${existingUser.displayName} now follows ${userToFollow.displayName}`);
    }

    // Some users follow the existing user
    const usersToFollowBack = otherUsers.slice(3); // Last 2 users follow back
    for (const follower of usersToFollowBack) {
      follower.following.push(existingUser._id);
      existingUser.followers.push(follower._id);
      
      await follower.save();
      logger.info(`${follower.displayName} now follows ${existingUser.displayName}`);
    }

    // Save the existing user with updated relationships
    await existingUser.save();

    // Add some likes to the existing user's posts
    const likeRelationships = [
      { postId: createdPosts[0]?._id, likedBy: [otherUsers[0]?.id, otherUsers[1]?.id] }, // Blinding Lights
      { postId: createdPosts[1]?._id, likedBy: [otherUsers[1]?.id, otherUsers[2]?.id] }, // Levitating
      { postId: createdPosts[2]?._id, likedBy: [otherUsers[0]?.id, otherUsers[2]?.id] }  // Watermelon Sugar
    ];

    for (const likeRel of likeRelationships) {
      if (likeRel.postId) {
        const post = await Post.findById(likeRel.postId);
        if (post) {
          post.likes = likeRel.likedBy.filter(id => id); // Filter out undefined
          post.likeCount = post.likes.length;
          await post.save();
          logger.info(`Added ${post.likeCount} likes to post: ${post.songName}`);
        }
      }
    }

    logger.info('🎉 Existing user update completed successfully!');
    
    // Display summary
    const updatedUser = await User.findOne({ id: existingUserId })
      .populate('posts')
      .populate('followers')
      .populate('following');

    if (updatedUser) {
      console.log('\n📊 Updated User Summary:');
      console.log('========================');
      console.log(`👤 ${updatedUser.displayName} (@${updatedUser.username || 'no username'})`);
      console.log(`   📧 ${updatedUser.email}`);
      console.log(`   🌍 ${updatedUser.country}`);
      console.log(`   📝 ${updatedUser.bio || 'No bio'}`);
      console.log(`   📊 Posts: ${updatedUser.posts.length}`);
      console.log(`   👥 Followers: ${updatedUser.followers.length}`);
      console.log(`   ➡️  Following: ${updatedUser.following.length}`);
      
      console.log('\n🎵 New Posts:');
      console.log('=============');
      for (const post of updatedUser.posts) {
        if (typeof post === 'object' && post !== null) {
          console.log(`\n🎵 ${(post as any).songName} by ${(post as any).artistName}`);
          console.log(`   💬 "${(post as any).description}"`);
          console.log(`   ❤️  Likes: ${(post as any).likeCount}`);
        }
      }
    }

  } catch (error) {
    logger.error('Error updating existing user:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    logger.info('Disconnected from MongoDB');
  }
}

// Run the update function
if (require.main === module) {
  updateExistingUser()
    .then(() => {
      console.log('\n✅ Existing user update completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Update failed:', error);
      process.exit(1);
    });
}

export default updateExistingUser;
