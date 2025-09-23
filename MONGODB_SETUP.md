# MongoDB Setup Guide

## Option 1: Local MongoDB Installation

### Download and Install
1. Go to: https://www.mongodb.com/try/download/community
2. Select: Windows, MSI package
3. Download and run the installer
4. **Important:** Check "Install MongoDB as a Service" during installation

### Verify Installation
After installation, restart your terminal and run:
```bash
mongod --version
```

### Start MongoDB Service
MongoDB should start automatically as a Windows service. If not:
```bash
net start MongoDB
```

## Option 2: MongoDB Atlas (Cloud Database)

### Create Free Account
1. Go to: https://www.mongodb.com/atlas
2. Sign up for a free account
3. Create a new cluster (free tier available)
4. Get your connection string

### Update .env File
Replace the MONGODB_URI in your .env file with your Atlas connection string:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/songbuddy
```

## Option 3: Docker (If you have Docker installed)

```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

## Testing Your Backend

After MongoDB is installed and running:

1. **Start your backend:**
   ```bash
   npm run dev
   ```

2. **Test the user endpoint:**
   ```bash
   # Test saving a user
   curl -X POST http://localhost:3000/api/users/save \
     -H "Content-Type: application/json" \
     -d '{"id":"test_user_123","displayName":"Test User","email":"test@example.com"}'
   ```

## Troubleshooting

### MongoDB Service Not Starting
```bash
# Check if MongoDB service is running
sc query MongoDB

# Start MongoDB service
net start MongoDB
```

### Connection Issues
- Make sure MongoDB is running on port 27017
- Check your .env file has the correct MONGODB_URI
- Ensure no firewall is blocking the connection
