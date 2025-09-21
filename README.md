# 🎵 SongBuddy Backend

> **SongBuddy Backend API** - Node.js + Express + TypeScript + MongoDB for social music sharing platform

A robust backend API for SongBuddy, a social music sharing application that connects with Spotify to enable users to share their favorite tracks, discover new music, and connect with friends through the universal language of music.

## ✨ Features

- 🔐 **Spotify OAuth Integration** - Seamless authentication with Spotify accounts
- 👥 **Social Features** - Follow users, like posts, share music, real-time notifications
- 🎧 **Music Discovery** - Track recommendations, trending posts, search functionality
- 📱 **Real-time Updates** - Socket.io for live notifications and activity feeds
- 🔒 **Secure Authentication** - JWT tokens with refresh token rotation
- 📊 **User Management** - Profiles, preferences, privacy settings
- 🖼️ **File Upload** - Cloudinary integration for user avatars
- ⚡ **Performance** - Redis caching, optimized database queries
- 🛡️ **Security** - Rate limiting, input validation, CORS protection

## 🛠️ Tech Stack

### **Core Technologies**
- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Language:** TypeScript
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** JWT + Spotify OAuth 2.0

### **Additional Services**
- **Real-time:** Socket.io
- **File Storage:** Cloudinary
- **Caching:** Redis (optional)
- **Logging:** Custom structured logger
- **Security:** Helmet, CORS, Rate Limiting

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18.0.0 or higher
- **npm** 8.0.0 or higher
- **MongoDB** (local or MongoDB Atlas)
- **Spotify Developer Account**
- **Cloudinary Account** (for image uploads)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/mohammadaminrez/songbuddy-backend.git
   cd songbuddy-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp env.example .env
   ```
   
   Edit the `.env` file with your credentials:
   ```env
   # Database
   MONGODB_URI=mongodb://localhost:27017/songbuddy
   
   # JWT
   JWT_SECRET=your_super_secret_jwt_key_here
   JWT_EXPIRES_IN=7d
   
   # Spotify OAuth
   SPOTIFY_CLIENT_ID=your_spotify_client_id
   SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
   SPOTIFY_REDIRECT_URI=http://localhost:3000/api/auth/spotify/callback
   
   # Cloudinary
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   
   # Server
   PORT=3000
   NODE_ENV=development
   ```

4. **Run the application**
   ```bash
   # Development mode
   npm run dev
   
   # Production build
   npm run build
   npm start
   ```

## 📁 Project Structure

```
songbuddy-backend/
├── src/
│   ├── controllers/          # API route controllers
│   ├── models/              # Database models
│   │   ├── User.ts
│   │   ├── Post.ts
│   │   └── Notification.ts
│   ├── routes/              # API routes
│   ├── middleware/          # Custom middleware
│   │   └── auth.ts
│   ├── services/            # Business logic services
│   │   ├── database.ts
│   │   ├── spotifyService.ts
│   │   └── jwtService.ts
│   ├── utils/               # Utility functions
│   │   └── logger.ts
│   ├── types/               # TypeScript interfaces
│   │   └── index.ts
│   └── app.ts               # Main application file
├── tests/                   # Test files
├── logs/                    # Application logs
├── package.json
├── tsconfig.json
└── README.md
```

## 🔧 Available Scripts

```bash
# Development
npm run dev              # Start development server with hot reload
npm run dev:build        # Build and run in development

# Production
npm run build           # Build TypeScript to JavaScript
npm start              # Start production server

# Testing
npm test               # Run tests
npm run test:watch     # Run tests in watch mode
npm run test:coverage  # Run tests with coverage

# Code Quality
npm run lint           # Run ESLint
npm run lint:fix       # Fix ESLint errors
npm run type-check     # Check TypeScript types

# Utilities
npm run clean          # Clean build directory
```

## 🔐 Authentication

The API uses JWT tokens for authentication with Spotify OAuth integration:

### **Authentication Flow**
1. User initiates Spotify OAuth
2. Spotify redirects with authorization code
3. Backend exchanges code for access token
4. Backend creates/updates user account
5. Backend returns JWT tokens
6. Client uses JWT for API requests

### **Protected Routes**
All protected routes require the `Authorization` header:
```
Authorization: Bearer <jwt_token>
```

## 📊 API Endpoints

### **Authentication**
- `POST /api/auth/spotify` - Initiate Spotify OAuth
- `GET /api/auth/spotify/callback` - Spotify OAuth callback
- `POST /api/auth/refresh` - Refresh JWT tokens
- `POST /api/auth/logout` - Logout user

### **Users**
- `GET /api/users/profile` - Get current user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/:id` - Get user by ID
- `POST /api/users/:id/follow` - Follow a user
- `DELETE /api/users/:id/follow` - Unfollow a user
- `GET /api/users/search` - Search users

### **Posts**
- `GET /api/posts/feed` - Get user's feed
- `POST /api/posts` - Create a new post
- `GET /api/posts/:id` - Get post by ID
- `DELETE /api/posts/:id` - Delete post
- `POST /api/posts/:id/like` - Like a post
- `DELETE /api/posts/:id/like` - Unlike a post
- `GET /api/posts/trending` - Get trending posts

### **Notifications**
- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/:id/read` - Mark notification as read
- `PUT /api/notifications/read-all` - Mark all as read

## 🎧 Spotify Integration

The backend integrates with Spotify Web API to provide:

- **User Authentication** - OAuth 2.0 flow
- **Music Data** - Track, artist, album information
- **User Preferences** - Top tracks, recently played
- **Music Discovery** - Recommendations and search
- **Playback Status** - Currently playing tracks

### **Required Spotify Scopes**
```
user-read-private
user-read-email
user-read-currently-playing
user-read-playback-state
user-library-read
playlist-read-private
user-read-recently-played
user-top-read
```

## 🔄 Real-time Features

Socket.io integration provides real-time updates for:

- **Notifications** - New likes, follows, comments
- **Activity Feed** - Live post updates
- **User Presence** - Online/offline status
- **Chat Features** - Direct messages (future)

## 🛡️ Security Features

- **Rate Limiting** - Prevent API abuse
- **Input Validation** - Sanitize and validate requests
- **CORS Protection** - Configured origins
- **Helmet Security** - Security headers
- **JWT Token Rotation** - Secure token management
- **Environment Variables** - Sensitive data protection

## 📈 Performance Optimizations

- **Database Indexing** - Optimized queries
- **Redis Caching** - Frequently accessed data
- **Pagination** - Efficient data loading
- **Connection Pooling** - Database connections
- **Compression** - Response compression

## 🚀 Deployment

### **Environment Variables for Production**
```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/songbuddy
JWT_SECRET=your_production_jwt_secret
SPOTIFY_CLIENT_ID=your_production_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_production_spotify_client_secret
CLOUDINARY_CLOUD_NAME=your_production_cloudinary_name
```

### **Deployment Platforms**
- **Vercel** - Serverless deployment
- **Railway** - Full-stack deployment
- **Heroku** - Container deployment
- **DigitalOcean** - VPS deployment

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## 📝 API Documentation

For detailed API documentation, visit:
- **Swagger UI** - `/api/docs` (when implemented)
- **Postman Collection** - Available in `/docs` folder

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### **Development Guidelines**
- Follow TypeScript best practices
- Write tests for new features
- Update documentation
- Follow conventional commit messages
- Ensure all tests pass

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Spotify** - For providing the amazing Web API
- **MongoDB** - For the flexible database solution
- **Express.js** - For the robust web framework
- **Socket.io** - For real-time communication
- **Cloudinary** - For image management

## 📞 Support

If you encounter any issues or have questions:

- **GitHub Issues** - [Create an issue](https://github.com/mohammadaminrez/songbuddy-backend/issues)
- **Documentation** - Check this README and code comments
- **Community** - Join our discussions

## 🔗 Related Projects

- **Frontend** - [SongBuddy Flutter App](https://github.com/mohammadaminrez/songbuddy)
- **Mobile** - Coming soon...

---

**Made with ❤️ for music lovers everywhere**

*Built with Node.js, Express, TypeScript, and MongoDB*
