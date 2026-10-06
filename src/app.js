import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { env } from './config/env.js';
import routes from './routes/index.js';
import { setupSwagger } from './docs/swagger.js';
import { errorHandler } from './middleware/error.middleware.js';
import { sendError } from './utils/response.js';

const app = express();

// Security & Utility Middlewares (Allow cross-origin iframe embedding)
app.use(
  helmet({
    crossOriginResourcePolicy: false,
    crossOriginEmbedderPolicy: false,
    frameguard: false,
    contentSecurityPolicy: false
  })
);

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

if (env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Serve Static Uploads (PDFs, Images) with CORS & iframe headers allowed
app.use('/uploads', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.removeHeader('X-Frame-Options');
  next();
}, express.static(path.join(process.cwd(), 'public', 'uploads')));

// Swagger Documentation UI
setupSwagger(app);

// Mount API Routes
app.use('/api/v1', routes);

// 404 Route Handler
app.use((req, res) => {
  return sendError(res, `Route ${req.originalUrl} not found`, null, 404);
});

// Global Centralized Error Middleware
app.use(errorHandler);

export default app;
