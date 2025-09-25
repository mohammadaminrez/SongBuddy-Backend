import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User';
import Post from '../models/Post';
import { databaseService } from '../services/database';
import { logger } from '../utils/logger';

// Load environment variables
dotenv.config();

// Sample users data
const sampleUsers = [
  {
    id: 'user1',
    displayName: 'Alice Johnson',
    username: 'alice_music',
    email: 'alice@example.com',
    profilePicture: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
    country: 'US',
    bio: 'Music lover and singer 🎵',
    currentlyPlaying: {
      item: {
        name: 'Bohemian Rhapsody',
        artists: [{ name: 'Queen' }],
        album: { name: 'A Night at the Opera' }
      }
    },
    topArtists: [
      { name: 'Queen', genres: ['rock', 'pop'] },
      { name: 'The Beatles', genres: ['rock', 'pop'] }
    ],
    topTracks: [
      { name: 'Bohemian Rhapsody', artists: [{ name: 'Queen' }] },
      { name: 'Hey Jude', artists: [{ name: 'The Beatles' }] }
    ]
  },
  {
    id: 'user2',
    displayName: 'Bob Smith',
    username: 'bob_rock',
    email: 'bob@example.com',
    profilePicture: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    country: 'UK',
    bio: 'Rock music enthusiast 🎸',
    currentlyPlaying: {
      item: {
        name: 'Stairway to Heaven',
        artists: [{ name: 'Led Zeppelin' }],
        album: { name: 'Led Zeppelin IV' }
      }
    },
    topArtists: [
      { name: 'Led Zeppelin', genres: ['rock', 'hard rock'] },
      { name: 'Pink Floyd', genres: ['rock', 'progressive'] }
    ],
    topTracks: [
      { name: 'Stairway to Heaven', artists: [{ name: 'Led Zeppelin' }] },
      { name: 'Comfortably Numb', artists: [{ name: 'Pink Floyd' }] }
    ]
  },
  {
    id: 'user3',
    displayName: 'Charlie Brown',
    username: 'charlie_jazz',
    email: 'charlie@example.com',
    profilePicture: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    country: 'CA',
    bio: 'Jazz and blues lover 🎷',
    currentlyPlaying: {
      item: {
        name: 'Take Five',
        artists: [{ name: 'Dave Brubeck' }],
        album: { name: 'Time Out' }
      }
    },
    topArtists: [
      { name: 'Dave Brubeck', genres: ['jazz'] },
      { name: 'Miles Davis', genres: ['jazz', 'bebop'] }
    ],
    topTracks: [
      { name: 'Take Five', artists: [{ name: 'Dave Brubeck' }] },
      { name: 'Kind of Blue', artists: [{ name: 'Miles Davis' }] }
    ]
  },
  {
    id: 'user4',
    displayName: 'Diana Prince',
    username: 'diana_pop',
    email: 'diana@example.com',
    profilePicture: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    country: 'AU',
    bio: 'Pop music fan and dancer 💃',
    currentlyPlaying: {
      item: {
        name: 'Shape of You',
        artists: [{ name: 'Ed Sheeran' }],
        album: { name: '÷ (Divide)' }
      }
    },
    topArtists: [
      { name: 'Ed Sheeran', genres: ['pop', 'folk'] },
      { name: 'Taylor Swift', genres: ['pop', 'country'] }
    ],
    topTracks: [
      { name: 'Shape of You', artists: [{ name: 'Ed Sheeran' }] },
      { name: 'Anti-Hero', artists: [{ name: 'Taylor Swift' }] }
    ]
  },
  {
    id: 'user5',
    displayName: 'Ethan Hunt',
    username: 'ethan_edm',
    email: 'ethan@example.com',
    profilePicture: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
    country: 'DE',
    bio: 'EDM producer and DJ 🎧',
    currentlyPlaying: {
      item: {
        name: 'Levels',
        artists: [{ name: 'Avicii' }],
        album: { name: 'True' }
      }
    },
    topArtists: [
      { name: 'Avicii', genres: ['edm', 'progressive house'] },
      { name: 'Swedish House Mafia', genres: ['edm', 'progressive house'] }
    ],
    topTracks: [
      { name: 'Levels', artists: [{ name: 'Avicii' }] },
      { name: 'Don\'t You Worry Child', artists: [{ name: 'Swedish House Mafia' }] }
    ]
  }
];

// Sample posts data
const samplePosts = [
  {
    userId: 'user1',
    username: 'Alice Johnson',
    userProfilePicture: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
    songName: 'Bohemian Rhapsody',
    artistName: 'Queen',
    songImage: 'https://i.scdn.co/image/ab67616d0000b273ce4f1737bc8a6468b4ff2b7e',
    description: 'This song never gets old! The harmonies are absolutely incredible 🎵',
    likeCount: 0,
    likes: []
  },
  {
    userId: 'user1',
    username: 'Alice Johnson',
    userProfilePicture: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
    songName: 'Hey Jude',
    artistName: 'The Beatles',
    songImage: 'https://i.scdn.co/image/ab67616d0000b273dc30583ba717007b00bcec46',
    description: 'The Beatles at their finest. This song brings back so many memories 💫',
    likeCount: 0,
    likes: []
  },
  {
    userId: 'user2',
    username: 'Bob Smith',
    userProfilePicture: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    songName: 'Stairway to Heaven',
    artistName: 'Led Zeppelin',
    songImage: 'https://i.scdn.co/image/ab67616d0000b273c8a11e48c91a982d086afc69',
    description: 'The greatest rock song ever written. Jimmy Page\'s guitar work is legendary 🎸',
    likeCount: 0,
    likes: []
  },
  {
    userId: 'user2',
    username: 'Bob Smith',
    userProfilePicture: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    songName: 'Comfortably Numb',
    artistName: 'Pink Floyd',
    songImage: 'https://i.scdn.co/image/ab67616d0000b273a4b8b0b0b0b0b0b0b0b0b0b',
    description: 'Pink Floyd\'s masterpiece. The guitar solo gives me chills every time 🌟',
    likeCount: 0,
    likes: []
  },
  {
    userId: 'user3',
    username: 'Charlie Brown',
    userProfilePicture: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    songName: 'Take Five',
    artistName: 'Dave Brubeck',
    songImage: 'https://i.scdn.co/image/ab67616d0000b273b0b0b0b0b0b0b0b0b0b0b0b',
    description: 'Jazz at its finest. The 5/4 time signature is pure genius 🎷',
    likeCount: 0,
    likes: []
  },
  {
    userId: 'user3',
    username: 'Charlie Brown',
    userProfilePicture: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    songName: 'Kind of Blue',
    artistName: 'Miles Davis',
    songImage: 'https://i.scdn.co/image/ab67616d0000b273c0c0c0c0c0c0c0c0c0c0c0c',
    description: 'The album that changed jazz forever. Miles Davis was a true innovator 🎺',
    likeCount: 0,
    likes: []
  },
  {
    userId: 'user4',
    username: 'Diana Prince',
    userProfilePicture: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    songName: 'Shape of You',
    artistName: 'Ed Sheeran',
    songImage: 'https://i.scdn.co/image/ab67616d0000b273d0d0d0d0d0d0d0d0d0d0d0d',
    description: 'Ed Sheeran\'s catchy melodies never fail to make me dance! 💃',
    likeCount: 0,
    likes: []
  },
  {
    userId: 'user4',
    username: 'Diana Prince',
    userProfilePicture: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    songName: 'Anti-Hero',
    artistName: 'Taylor Swift',
    songImage: 'https://i.scdn.co/image/ab67616d0000b273e0e0e0e0e0e0e0e0e0e0e0e',
    description: 'Taylor Swift\'s storytelling is unmatched. This song hits different ✨',
    likeCount: 0,
    likes: []
  },
  {
    userId: 'user5',
    username: 'Ethan Hunt',
    userProfilePicture: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
    songName: 'Levels',
    artistName: 'Avicii',
    songImage: 'https://i.scdn.co/image/ab67616d0000b273f0f0f0f0f0f0f0f0f0f0f0f',
    description: 'RIP Avicii. This track defined a generation of EDM 🎧',
    likeCount: 0,
    likes: []
  },
  {
    userId: 'user5',
    username: 'Ethan Hunt',
    userProfilePicture: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
    songName: 'Don\'t You Worry Child',
    artistName: 'Swedish House Mafia',
    songImage: 'https://i.scdn.co/image/ab67616d0000b273g0g0g0g0g0g0g0g0g0g0g0g',
    description: 'Swedish House Mafia at their peak. The drop is absolutely massive! 🔥',
    likeCount: 0,
    likes: []
  }
];

async function seedDatabase() {
  try {
    // Connect to database
    await databaseService.connect();
    logger.info('Connected to MongoDB for seeding');

    // Clear existing data
    await User.deleteMany({});
    await Post.deleteMany({});
    logger.info('Cleared existing data');

    // Create users
    const createdUsers = [];
    for (const userData of sampleUsers) {
      const user = new User(userData);
      await user.save();
      createdUsers.push(user);
      logger.info(`Created user: ${user.displayName}`);
    }

    // Create posts
    const createdPosts = [];
    for (const postData of samplePosts) {
      const post = new Post(postData);
      await post.save();
      createdPosts.push(post);
      
      // Add post to user's posts array
      const user = await User.findOne({ id: postData.userId });
      if (user) {
        user.posts.push(post._id);
        await user.save();
      }
      
      logger.info(`Created post: ${postData.songName} by ${postData.username}`);
    }

    // Create follow relationships
    const followRelationships = [
      // Alice follows Bob and Charlie
      { follower: 'user1', following: ['user2', 'user3'] },
      // Bob follows Alice and Diana
      { follower: 'user2', following: ['user1', 'user4'] },
      // Charlie follows Alice and Ethan
      { follower: 'user3', following: ['user1', 'user5'] },
      // Diana follows Bob and Charlie
      { follower: 'user4', following: ['user2', 'user3'] },
      // Ethan follows Diana and Alice
      { follower: 'user5', following: ['user4', 'user1'] }
    ];

    for (const relationship of followRelationships) {
      const follower = await User.findOne({ id: relationship.follower });
      if (follower) {
        for (const followingId of relationship.following) {
          const following = await User.findOne({ id: followingId });
          if (following) {
            // Add to follower's following list
            follower.following.push(following._id);
            // Add to following's followers list
            following.followers.push(follower._id);
            
            await follower.save();
            await following.save();
            
            logger.info(`${follower.displayName} now follows ${following.displayName}`);
          }
        }
      }
    }

    // Add some likes to posts
    const likeRelationships = [
      { postId: createdPosts[0]?._id, likedBy: ['user2', 'user3', 'user4'] }, // Alice's Bohemian Rhapsody
      { postId: createdPosts[2]?._id, likedBy: ['user1', 'user4', 'user5'] }, // Bob's Stairway to Heaven
      { postId: createdPosts[4]?._id, likedBy: ['user1', 'user2'] }, // Charlie's Take Five
      { postId: createdPosts[6]?._id, likedBy: ['user2', 'user3', 'user5'] }, // Diana's Shape of You
      { postId: createdPosts[8]?._id, likedBy: ['user1', 'user3', 'user4'] }  // Ethan's Levels
    ];

    for (const likeRel of likeRelationships) {
      const post = await Post.findById(likeRel.postId);
      if (post) {
        post.likes = likeRel.likedBy;
        post.likeCount = likeRel.likedBy.length;
        await post.save();
        logger.info(`Added ${likeRel.likedBy.length} likes to post: ${post.songName}`);
      }
    }

    logger.info('🎉 Database seeding completed successfully!');
    logger.info(`Created ${createdUsers.length} users`);
    logger.info(`Created ${createdPosts.length} posts`);
    logger.info('Created follow relationships');
    logger.info('Added likes to posts');

    // Display summary
    console.log('\n📊 Database Summary:');
    console.log('==================');
    
    for (const user of createdUsers) {
      const userPosts = await Post.find({ userId: user.id });
      const followers = await User.find({ followers: user._id });
      const following = await User.find({ following: user._id });
      
      console.log(`\n👤 ${user.displayName} (@${user.username})`);
      console.log(`   📧 ${user.email}`);
      console.log(`   🌍 ${user.country}`);
      console.log(`   📝 ${user.bio}`);
      console.log(`   📊 Posts: ${userPosts.length}`);
      console.log(`   👥 Followers: ${followers.length}`);
      console.log(`   ➡️  Following: ${following.length}`);
    }

    console.log('\n🎵 Posts Summary:');
    console.log('================');
    
    for (const post of createdPosts) {
      console.log(`\n🎵 ${post.songName} by ${post.artistName}`);
      console.log(`   👤 Posted by: ${post.username}`);
      console.log(`   💬 "${post.description}"`);
      console.log(`   ❤️  Likes: ${post.likeCount}`);
    }

  } catch (error) {
    logger.error('Error seeding database:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    logger.info('Disconnected from MongoDB');
  }
}

// Run the seeding function
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('\n✅ Seeding completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Seeding failed:', error);
      process.exit(1);
    });
}

export default seedDatabase;
