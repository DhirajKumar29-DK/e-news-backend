import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes.js';
import editionRoutes from '../modules/edition/edition.routes.js';
import epaperRoutes from '../modules/epaper/epaper.routes.js';

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

export default router;
