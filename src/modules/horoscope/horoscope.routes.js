import { Router } from 'express';
import * as horoscopeController from './horoscope.controller.js';

const router = Router();

// 1. Get single sign horoscope (?sign=taurus&period=DAILY)
router.get('/', horoscopeController.getHoroscope);

// 2. Get all 12 signs for a period (?period=DAILY)
router.get('/all', horoscopeController.getAllHoroscopes);

// 3. Upsert Horoscope (Admin)
router.post('/', horoscopeController.updateHoroscope);
router.put('/', horoscopeController.updateHoroscope);

// 4. Seed initial records
router.post('/seed', horoscopeController.seedHoroscopes);

export default router;
