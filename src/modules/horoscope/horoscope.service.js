import { prisma } from '../../config/db.js';
import { DEFAULT_ZODIAC_DATA } from './horoscope.defaultData.js';

export async function getHoroscope(sign, period = 'DAILY') {
  const normSign = (sign || 'taurus').toLowerCase();
  const normPeriod = (period || 'DAILY').toUpperCase();

  try {
    const record = await prisma.horoscope.findUnique({
      where: {
        sign_period: {
          sign: normSign,
          period: normPeriod
        }
      }
    });

    if (record) {
      return record;
    }
  } catch (err) {
    console.error('Error fetching horoscope from DB, using fallback:', err.message);
  }

  // Fallback to default
  const defaultSign = DEFAULT_ZODIAC_DATA[normSign] || DEFAULT_ZODIAC_DATA.taurus;
  return {
    id: `default-${normSign}-${normPeriod}`,
    sign: defaultSign.sign,
    signName: defaultSign.signName,
    hindiName: defaultSign.hindiName,
    dateRange: defaultSign.dateRange,
    period: normPeriod,
    luckyColour: defaultSign.luckyColour,
    luckyGemstone: defaultSign.luckyGemstone,
    luckyDay: defaultSign.luckyDay,
    luckyNumber: defaultSign.luckyNumber,
    rulingPlanet: defaultSign.rulingPlanet,
    compatibleSign: defaultSign.compatibleSign,
    prediction: defaultSign.predictions[normPeriod] || defaultSign.predictions.DAILY,
    remedy: defaultSign.remedy,
    date: new Date().toISOString().split('T')[0]
  };
}

export async function getAllHoroscopes(period = 'DAILY') {
  const normPeriod = (period || 'DAILY').toUpperCase();
  const signs = Object.keys(DEFAULT_ZODIAC_DATA);
  const results = [];

  for (const s of signs) {
    const item = await getHoroscope(s, normPeriod);
    results.push(item);
  }
  return results;
}

export async function upsertHoroscope(data) {
  const normSign = (data.sign || 'taurus').toLowerCase();
  const normPeriod = (data.period || 'DAILY').toUpperCase();
  const defaultMeta = DEFAULT_ZODIAC_DATA[normSign] || DEFAULT_ZODIAC_DATA.taurus;

  const payload = {
    sign: normSign,
    signName: data.signName || defaultMeta.signName,
    hindiName: data.hindiName || defaultMeta.hindiName,
    dateRange: data.dateRange || defaultMeta.dateRange,
    period: normPeriod,
    luckyColour: data.luckyColour || defaultMeta.luckyColour,
    luckyGemstone: data.luckyGemstone || defaultMeta.luckyGemstone,
    luckyDay: data.luckyDay || defaultMeta.luckyDay,
    luckyNumber: data.luckyNumber || defaultMeta.luckyNumber,
    rulingPlanet: data.rulingPlanet || defaultMeta.rulingPlanet,
    compatibleSign: data.compatibleSign || defaultMeta.compatibleSign,
    prediction: data.prediction || defaultMeta.predictions[normPeriod] || defaultMeta.predictions.DAILY,
    remedy: data.remedy || defaultMeta.remedy,
    date: data.date || new Date().toISOString().split('T')[0]
  };

  const record = await prisma.horoscope.upsert({
    where: {
      sign_period: {
        sign: normSign,
        period: normPeriod
      }
    },
    update: payload,
    create: payload
  });

  return record;
}

export async function seedHoroscopes() {
  const signs = Object.keys(DEFAULT_ZODIAC_DATA);
  const periods = ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY', 'LOVE'];
  let count = 0;

  for (const s of signs) {
    const meta = DEFAULT_ZODIAC_DATA[s];
    for (const p of periods) {
      await prisma.horoscope.upsert({
        where: {
          sign_period: {
            sign: s,
            period: p
          }
        },
        update: {},
        create: {
          sign: s,
          signName: meta.signName,
          hindiName: meta.hindiName,
          dateRange: meta.dateRange,
          period: p,
          luckyColour: meta.luckyColour,
          luckyGemstone: meta.luckyGemstone,
          luckyDay: meta.luckyDay,
          luckyNumber: meta.luckyNumber,
          rulingPlanet: meta.rulingPlanet,
          compatibleSign: meta.compatibleSign,
          prediction: meta.predictions[p] || meta.predictions.DAILY,
          remedy: meta.remedy,
          date: new Date().toISOString().split('T')[0]
        }
      });
      count++;
    }
  }

  return count;
}
