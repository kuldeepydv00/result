import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './utils/db';
import { initWebPush } from './services/webPush';
import { startCronScheduler } from './cron/scheduler';
import apiRouter from './routes/api';
import { errorHandler } from './middlewares/errorMiddleware';
import logger from './utils/logger';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Standard Middlewares
app.use(cors({
  origin: '*', // We can restrict this in production if needed
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simple Request Logging Middleware
app.use((req, res, next) => {
  logger.debug(`${req.method} ${req.originalUrl}`);
  next();
});

// API Routes mounting
app.use('/api', apiRouter);

// Global Error Handler
app.use(errorHandler);

const startServer = async () => {
  try {
    // 1. Connect to MongoDB
    await connectDB();

    // 2. Initialize push notification settings
    await initWebPush();

    // 3. Start cron scheduler
    startCronScheduler();

    // 4. Listen on PORT
    app.listen(PORT, () => {
      logger.info(`Server is running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server: %o', error);
    process.exit(1);
  }
};

startServer();
