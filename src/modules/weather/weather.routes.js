import { Router } from 'express';
import * as weatherController from './weather.controller.js';

const router = Router();

// 1. Get all states with nested cities (for Select State dropdown)
router.get('/states', weatherController.getStates);

// 2. Get cities by stateId (for Select City dropdown)
router.get('/cities', weatherController.getCities);

// 3. Get Main Cities grid with live weather + AQI
router.get('/main-cities', weatherController.getMainCities);

// 4. Get detailed city weather forecast & AQI by city slug
router.get('/forecast/:slug', weatherController.getCityForecast);

export default router;
