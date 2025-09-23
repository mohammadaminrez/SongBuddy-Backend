import mongoose from 'mongoose';
import { logger } from '../utils/logger';

class DatabaseService {
  private static instance: DatabaseService;
  private isConnected = false;

  private constructor() {}

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  public async connect(): Promise<void> {
    if (this.isConnected) {
      logger.info('Database already connected');
      return;
    }

    try {
      const mongoUri = process.env.MONGODB_URI;
      
      if (!mongoUri) {
        throw new Error('MONGODB_URI environment variable is not defined');
      }

      await mongoose.connect(mongoUri, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        bufferCommands: false
      });

      this.isConnected = true;
      logger.info('Connected to MongoDB successfully');

      // Handle connection events
      mongoose.connection.on('error', (error) => {
        logger.error('MongoDB connection error:', error);
        this.isConnected = false;
      });

      mongoose.connection.on('disconnected', () => {
        logger.warn('MongoDB disconnected');
        this.isConnected = false;
      });

      mongoose.connection.on('reconnected', () => {
        logger.info('MongoDB reconnected');
        this.isConnected = true;
      });

      // Handle app termination
      process.on('SIGINT', async () => {
        await this.disconnect();
        process.exit(0);
      });

      process.on('SIGTERM', async () => {
        await this.disconnect();
        process.exit(0);
      });

    } catch (error) {
      logger.error('Failed to connect to MongoDB:', error);
      this.isConnected = false;
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      await mongoose.connection.close();
      this.isConnected = false;
      logger.info('Disconnected from MongoDB');
    } catch (error) {
      logger.error('Error disconnecting from MongoDB:', error);
      throw error;
    }
  }

  public getConnectionStatus(): boolean {
    return this.isConnected && mongoose.connection.readyState === 1;
  }

  public async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    message: string;
    details?: any;
  }> {
    try {
      if (!this.getConnectionStatus()) {
        return {
          status: 'unhealthy',
          message: 'Database connection is not established'
        };
      }

      // Ping the database
      if (mongoose.connection.db) {
        await mongoose.connection.db.admin().ping();
        
        const stats = await mongoose.connection.db.stats();
      
        return {
          status: 'healthy',
          message: 'Database connection is healthy',
          details: {
            collections: stats.collections,
            dataSize: stats.dataSize,
            indexSize: stats.indexSize,
            storageSize: stats.storageSize
          }
        };
      } else {
        return {
          status: 'unhealthy',
          message: 'Database connection is not available'
        };
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        message: 'Database health check failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  public async dropDatabase(): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Cannot drop database in production environment');
    }

    if (mongoose.connection.db) {
      await mongoose.connection.db.dropDatabase();
      logger.warn('Database dropped successfully');
    }
  }

  public async clearCollections(): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Cannot clear collections in production environment');
    }

    const collections = mongoose.connection.collections;
    
    for (const key in collections) {
      const collection = collections[key];
      if (collection) {
        await collection.deleteMany({});
      }
    }
    
    logger.warn('All collections cleared');
  }
}

export const databaseService = DatabaseService.getInstance();
export default databaseService;
