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
import { redis } from './config/redis';
import logger from './utils/logger';
import { configurePassport } from './config/passport';

// Load environment variables
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;

// Trust proxy setting - enable when behind a reverse proxy (Nginx, load balancer, etc.)
// This is required for rate limiting and getting correct client IPs
if (process.env.TRUST_PROXY === 'true' || process.env.TRUST_PROXY === '1') {
  app.set('trust proxy', 1);
  logger.info('Trust proxy enabled - running behind reverse proxy');
}

// Middleware
app.use(helmet());
// Build allowed origins list
const allowedOrigins = [
  process.env.CORS_ORIGIN || 'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3000',
  'http://127.0.0.1:3001',
  'http://127.0.0.1:3000',
].filter(Boolean);

// Log configured CORS origin for debugging
logger.info(`CORS configured with origin: ${process.env.CORS_ORIGIN || 'http://localhost:3000'}`);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests without Origin header)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // Log the mismatch for debugging
      logger.warn(`CORS blocked request from origin: ${origin}. Allowed origins: ${allowedOrigins.join(', ')}`);
      // Return false instead of throwing an error - this lets the browser handle CORS rejection properly
      callback(null, false);
    }
  },
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
    // Attempt to close Redis connection if available
    try {
      await redis.quit();
    } catch (error) {
      logger.warn('Redis connection already closed or unavailable');
    }
    logger.info('Database and Redis connections closed');
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

    // Test Redis connection (non-blocking)
    try {
      await redis.ping();
      logger.info('Redis connected successfully');
    } catch (error) {
      logger.warn('Redis not available, using in-memory cache fallback');
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
