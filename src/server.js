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

    // Background YouTube Auto-Sync Worker (checks every 5 minutes silently)
    setTimeout(async () => {
      try {
        const { syncYouTubeVideos } = await import('./modules/video/youtubeSync.service.js');
        await syncYouTubeVideos();
      } catch (e) {
        console.warn('[YouTubeSync Worker] Initial check notice:', e.message);
      }
    }, 8000);

    setInterval(async () => {
      try {
        const { syncYouTubeVideos } = await import('./modules/video/youtubeSync.service.js');
        await syncYouTubeVideos();
      } catch (e) {
        console.warn('[YouTubeSync Worker] Periodic sync notice:', e.message);
      }
    }, 5 * 60 * 1000);
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
