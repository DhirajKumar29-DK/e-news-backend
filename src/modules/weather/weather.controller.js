import * as weatherService from './weather.service.js';

export async function getStates(req, res) {
  try {
    const states = await weatherService.getAllStates();
    res.json({ success: true, data: states });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function getCities(req, res) {
  try {
    const { stateId } = req.query;
    const cities = await weatherService.getCities(stateId);
    res.json({ success: true, data: cities });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function getMainCities(req, res) {
  try {
    const mainCities = await weatherService.getMainCitiesWeather();
    res.json({ success: true, data: mainCities });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function getCityForecast(req, res) {
  try {
    const { slug } = req.params;
    const forecast = await weatherService.getCityForecastBySlug(slug);
    res.json({ success: true, data: forecast });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}
