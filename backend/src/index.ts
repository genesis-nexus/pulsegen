import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import passport from 'passport';
import path from 'path';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';
import { rateLimiter } from './middleware/rateLimiter';
import routes from './routes';
import { prisma } from './config/database';
import { cache, CacheFactory } from './lib/cache';
import logger from './utils/logger';
import { configurePassport } from './config/passport';

// Load environment variables
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim()),
  },
}));

// Initialize passport
app.use(passport.initialize());

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Rate limiting
app.use(rateLimiter);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    cache: {
      type: CacheFactory.getCacheType(),
      connected: cache.isConnected(),
    },
  });
});

// API Routes
app.use('/api', routes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Graceful shutdown
const gracefulShutdown = async () => {
  logger.info('Shutting down gracefully...');

  try {
    await prisma.$disconnect();
    logger.info('Database connection closed');

    // Gracefully disconnect cache if it's Redis
    if (CacheFactory.getCacheType() === 'redis') {
      const { RedisCache } = await import('./lib/cache');
      if (cache instanceof RedisCache) {
        await cache.disconnect();
        logger.info('Redis cache disconnected');
      }
    }

    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start server
const startServer = async () => {
  try {
    // Test database connection
    await prisma.$connect();
    logger.info('Database connected successfully');

    // Check cache status (optional, won't fail startup)
    const cacheType = CacheFactory.getCacheType();
    const cacheConnected = cache.isConnected();
    logger.info(`Cache: ${cacheType} (${cacheConnected ? 'connected' : 'not connected'})`);

    if (!cacheConnected && cacheType !== 'memory') {
      logger.warn('Cache is not connected, falling back to in-memory caching');
    }

    // Configure passport strategies
    await configurePassport();
    logger.info('Passport configured successfully');

    app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
