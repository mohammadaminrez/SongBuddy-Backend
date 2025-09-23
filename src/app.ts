import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { logger } from './utils/logger';
import { databaseService } from './services/database';
import userRoutes from './routes/userRoutes';
import postRoutes from './routes/postRoutes';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000', 'http://localhost:8080'],
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'SongBuddy Backend is running!',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});


// Simple test endpoint for Flutter connection
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'Backend API is working!',
    data: {
      server: 'SongBuddy Backend',
      status: 'connected',
      timestamp: new Date().toISOString()
    }
  });
});

// Test POST endpoint for Flutter connection testing
app.post('/api/test-post', async (req, res) => {
  try {
    const { message, data } = req.body;
    const timestamp = new Date();
    
    logger.info('Test POST received:', { message, data, timestamp: timestamp.toISOString() });
    
    // Save to MongoDB for testing
    const testMessage = {
      message: message || 'No message provided',
      data: data || 'No data provided',
      timestamp: timestamp,
      source: 'Flutter App Test',
      ip: req.ip,
      userAgent: req.get('User-Agent') || 'Unknown'
    };
    
    // Import mongoose and save to a test collection
    const mongoose = require('mongoose');
    const TestMessage = mongoose.model('TestMessage', new mongoose.Schema({
      message: String,
      data: mongoose.Schema.Types.Mixed,
      timestamp: Date,
      source: String,
      ip: String,
      userAgent: String
    }, { timestamps: true }));
    
    const savedMessage = await TestMessage.create(testMessage);
    logger.info('Test message saved to MongoDB:', savedMessage._id);
    
    res.json({
      success: true,
      message: 'POST request received and saved to MongoDB!',
      receivedData: {
        message: message || 'No message provided',
        data: data || 'No data provided',
        timestamp: timestamp.toISOString()
      },
      serverResponse: {
        server: 'SongBuddy Backend',
        status: 'POST connection working',
        method: 'POST',
        savedToDB: true,
        documentId: savedMessage._id
      }
    });
  } catch (error) {
    logger.error('Test POST error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing POST request',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Debug: Log all incoming requests to see what's happening
app.use((req, res, next) => {
  logger.info(`Incoming request: ${req.method} ${req.path}`);
  next();
});

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.originalUrl
  });
});

// Start server
async function startServer() {
  try {
    // Connect to database
    await databaseService.connect();
    
    // Start HTTP server
    app.listen(PORT, () => {
      logger.info(`🚀 SongBuddy Backend running on port ${PORT}`);
      logger.info(`📊 Health check: http://localhost:${PORT}/health`);
      logger.info(`🧪 Test endpoint: http://localhost:${PORT}/api/test`);
      logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await databaseService.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await databaseService.disconnect();
  process.exit(0);
});

// Start the server
startServer();

export default app;
