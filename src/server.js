import app from './app.js';
import { env } from './config/env.js';
import { connectDB } from './config/db.js';

const startServer = async () => {
  // Connect to Database
  await connectDB();

  const server = app.listen(env.PORT, () => {
    console.log(`🚀 Server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
    console.log(`🔗 Health Check: http://localhost:${env.PORT}/api/v1/health`);
    console.log(`📖 API Docs:     http://localhost:${env.PORT}/api-docs`);
  });

  // Unhandled Rejection & Uncaught Exception handlers
  process.on('unhandledRejection', (err) => {
    console.error('🔥 UNHANDLED REJECTION! Shutting down...', err);
    server.close(() => process.exit(1));
  });

  process.on('uncaughtException', (err) => {
    console.error('🔥 UNCAUGHT EXCEPTION! Shutting down...', err);
    process.exit(1);
  });
};

startServer();

