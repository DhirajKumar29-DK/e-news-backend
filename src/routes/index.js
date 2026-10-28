import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes.js';
import editionRoutes from '../modules/edition/edition.routes.js';
import epaperRoutes from '../modules/epaper/epaper.routes.js';
import articleRoutes from '../modules/article/article.routes.js';
import videoRoutes from '../modules/video/video.routes.js';
import horoscopeRoutes from '../modules/horoscope/horoscope.routes.js';
import weatherRoutes from '../modules/weather/weather.routes.js';
import categoryRoutes from '../modules/category/category.routes.js';
import cricketRoutes from '../modules/cricket/cricket.routes.js';
import adRoutes from '../modules/ad/ad.routes.js';

const router = Router();

// Base Health Check
router.get('/health', (req, res) => {
  res.json({
    status: 'online',
    message: 'Backend server is running cleanly.'
  });
});

// Module Routes Mount Points
router.use('/auth', authRoutes);
router.use('/editions', editionRoutes);
router.use('/epaper', epaperRoutes);
router.use('/articles', articleRoutes);
router.use('/videos', videoRoutes);
router.use('/horoscope', horoscopeRoutes);
router.use('/weather', weatherRoutes);
router.use('/categories', categoryRoutes);
router.use('/cricket', cricketRoutes);
router.use('/ads', adRoutes);

export default router;
