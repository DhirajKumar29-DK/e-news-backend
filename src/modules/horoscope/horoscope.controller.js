import * as horoscopeService from './horoscope.service.js';

export async function getHoroscope(req, res) {
  try {
    const sign = req.query.sign || 'taurus';
    const period = req.query.period || 'DAILY';
    const data = await horoscopeService.getHoroscope(sign, period);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function getAllHoroscopes(req, res) {
  try {
    const period = req.query.period || 'DAILY';
    const data = await horoscopeService.getAllHoroscopes(period);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function updateHoroscope(req, res) {
  try {
    const data = await horoscopeService.upsertHoroscope(req.body);
    res.json({ success: true, message: 'Horoscope updated successfully', data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function seedHoroscopes(req, res) {
  try {
    const count = await horoscopeService.seedHoroscopes();
    res.json({ success: true, message: `Successfully seeded ${count} horoscope records` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}
