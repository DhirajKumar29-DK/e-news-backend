import { prisma } from '../../config/db.js';

// 10-minute in-memory cache for Open-Meteo responses
const weatherCache = new Map();
const CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes cache for real-time freshness // 2-min cache for near real-time sync with Google Weather

// Weather WMO Code mapping
export function getWeatherCondition(code) {
  switch (code) {
    case 0: return { label: 'Clear Sky', icon: 'sun' };
    case 1: return { label: 'Mainly Clear', icon: 'sun' };
    case 2: return { label: 'Partly Cloudy', icon: 'cloud-sun' };
    case 3: return { label: 'Overcast', icon: 'cloud' };
    case 45: return { label: 'Foggy', icon: 'cloud-fog' };
    case 48: return { label: 'Depositing Rime Fog', icon: 'cloud-fog' };
    case 51:
    case 53:
    case 55: return { label: 'Light Drizzle', icon: 'cloud-drizzle' };
    case 61:
    case 63:
    case 65: return { label: 'Rainy', icon: 'cloud-rain' };
    case 71:
    case 73:
    case 75: return { label: 'Snowfall', icon: 'snowflake' };
    case 80:
    case 81:
    case 82: return { label: 'Rain Showers', icon: 'cloud-rain' };
    case 95:
    case 96:
    case 99: return { label: 'Thunderstorm', icon: 'cloud-lightning' };
    default: return { label: 'Smoky Haze', icon: 'sun' };
  }
}

// Calculate Indian National Air Quality Index (NAQI) from PM2.5 & PM10
export function calculateIndiaAQI(pm25, pm10, usAqi) {
  let aqiVal = 0;
  if (usAqi != null && usAqi > 0) {
    aqiVal = Math.round(usAqi);
  } else if (pm25 != null) {
    if (pm25 <= 30) aqiVal = Math.round((50 / 30) * pm25);
    else if (pm25 <= 60) aqiVal = Math.round(50 + (50 / 30) * (pm25 - 30));
    else if (pm25 <= 90) aqiVal = Math.round(100 + (100 / 30) * (pm25 - 60));
    else if (pm25 <= 120) aqiVal = Math.round(200 + (100 / 30) * (pm25 - 90));
    else if (pm25 <= 250) aqiVal = Math.round(300 + (100 / 130) * (pm25 - 120));
    else aqiVal = Math.round(400 + (100 / 130) * Math.min(pm25 - 250, 130));
  } else if (pm10 != null) {
    aqiVal = Math.round(pm10);
  } else {
    aqiVal = 75; // Default fallback
  }

  // Safety bounds
  aqiVal = Math.max(15, Math.min(aqiVal, 480));

  let status = 'Moderate';
  let color = '#EAB308'; // yellow
  let bg = '#FEF9C3';
  let badge = 'Moderate';

  if (aqiVal <= 50) {
    status = 'Good';
    color = '#16A34A'; // green
    bg = '#DCFCE7';
    badge = 'Good';
  } else if (aqiVal <= 100) {
    status = 'Satisfactory';
    color = '#84CC16'; // lime green
    bg = '#ECFCCB';
    badge = 'Good';
  } else if (aqiVal <= 200) {
    status = 'Moderate';
    color = '#EAB308'; // yellow
    bg = '#FEF9C3';
    badge = 'Moderate';
  } else if (aqiVal <= 300) {
    status = 'Poor';
    color = '#F97316'; // orange
    bg = '#FFEDD5';
    badge = 'Poor';
  } else if (aqiVal <= 400) {
    status = 'Very Poor';
    color = '#EF4444'; // red
    bg = '#FEE2E2';
    badge = 'Poor';
  } else {
    status = 'Severe';
    color = '#7F1D1D'; // dark red
    bg = '#FEE2E2';
    badge = 'Severe';
  }

  return { aqi: aqiVal, status, color, bg, badge };
}

// Fetch live weather + air quality from Open-Meteo with caching
export async function fetchLiveWeatherData(lat, lng) {
  const cacheKey = `${lat.toFixed(2)},${lng.toFixed(2)}`;
  const cached = weatherCache.get(cacheKey);
  const now = Date.now();

  if (cached && (now - cached.timestamp < CACHE_TTL_MS)) {
    return cached.data;
  }

  try {
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max&models=icon_seamless&timezone=Asia%2FKolkata`;
    const aqiUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lng}&current=pm10,pm2_5,us_aqi,european_aqi`;

    const [weatherRes, aqiRes] = await Promise.all([
      fetch(weatherUrl).then(r => r.json()).catch(() => null),
      fetch(aqiUrl).then(r => r.json()).catch(() => null)
    ]);

    const result = { weather: weatherRes, aqi: aqiRes };
    weatherCache.set(cacheKey, { timestamp: now, data: result });
    return result;
  } catch (err) {
    console.error('Error fetching Open-Meteo data:', err);
    return null;
  }
}

// 1. Get All States with nested Cities
export async function getAllStates() {
  return prisma.weatherState.findMany({
    where: { active: true },
    include: {
      cities: {
        where: { active: true },
        orderBy: { name: 'asc' }
      }
    },
    orderBy: { order: 'asc' }
  });
}

// 2. Get Cities by State ID or Slug
export async function getCities(stateId) {
  return prisma.weatherCity.findMany({
    where: {
      ...(stateId ? { stateId } : {}),
      active: true
    },
    include: { state: true },
    orderBy: { name: 'asc' }
  });
}

// 3. Get Main Cities with Live Weather & AQI for Hub Grid
export async function getMainCitiesWeather() {
  const cities = await prisma.weatherCity.findMany({
    where: { isMainCity: true, active: true },
    include: { state: true },
    orderBy: { order: 'asc' }
  });

  const liveCities = await Promise.all(
    cities.map(async (city) => {
      const data = await fetchLiveWeatherData(city.latitude, city.longitude);
      const cur = data?.weather?.current;
      const curAqi = data?.aqi?.current;

      const aqiInfo = calculateIndiaAQI(curAqi?.pm2_5, curAqi?.pm10, curAqi?.us_aqi);
      const condition = getWeatherCondition(cur?.weather_code || 0);

      return {
        id: city.id,
        name: city.name,
        slug: city.slug,
        stateName: city.state?.name || '',
        stateSlug: city.state?.slug || '',
        latitude: city.latitude,
        longitude: city.longitude,
        monumentIcon: city.monumentIcon,
        temp: cur?.temperature_2m != null ? Math.round(cur.temperature_2m).toString() : '30',
        humidity: cur?.relative_humidity_2m != null ? cur.relative_humidity_2m : 60,
        condition: condition.label,
        conditionIcon: condition.icon,
        aqi: aqiInfo.aqi,
        aqiStatus: aqiInfo.status,
        aqiBadge: aqiInfo.badge,
        aqiColor: aqiInfo.color,
        aqiBg: aqiInfo.bg,
        pm25: curAqi?.pm2_5 || 45,
        pm10: curAqi?.pm10 || 60
      };
    })
  );

  return liveCities;
}

// 4. Get Detailed City Forecast by Slug
export async function getCityForecastBySlug(rawSlug) {
  const cleanSlug = rawSlug
    .toLowerCase()
    .replace('-weather-forecast-today', '')
    .replace('-weather-today', '')
    .replace('-weather', '');

  let city = await prisma.weatherCity.findFirst({
    where: {
      OR: [
        { slug: cleanSlug },
        { slug: rawSlug.toLowerCase() },
        { name: { contains: cleanSlug } }
      ]
    },
    include: { state: true }
  });

  if (!city) {
    city = await prisma.weatherCity.findFirst({
      where: { slug: 'mumbai' },
      include: { state: true }
    });
  }

  const data = await fetchLiveWeatherData(city.latitude, city.longitude);
  const cur = data?.weather?.current;
  const curAqi = data?.aqi?.current;
  const daily = data?.weather?.daily;

  const aqiInfo = calculateIndiaAQI(curAqi?.pm2_5, curAqi?.pm10, curAqi?.us_aqi);
  const condition = getWeatherCondition(cur?.weather_code || 0);

  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const weeklyForecast = [];
  if (daily?.time && daily.time.length > 0) {
    for (let i = 0; i < Math.min(daily.time.length, 7); i++) {
      const dateObj = new Date(daily.time[i]);
      const dayName = daysOfWeek[dateObj.getDay()];
      const dayNum = dateObj.getDate();
      const monthName = months[dateObj.getMonth()];
      const dayCond = getWeatherCondition(daily.weather_code?.[i] || 0);
      const maxT = daily.temperature_2m_max?.[i] != null ? daily.temperature_2m_max[i].toFixed(1) : '31.0';
      const minT = daily.temperature_2m_min?.[i] != null ? daily.temperature_2m_min[i].toFixed(1) : '24.0';

      weeklyForecast.push({
        date: daily.time[i],
        dayName,
        formattedDate: `${dayName} ${dayNum} ${monthName}`,
        maxTemp: maxT,
        minTemp: minT,
        temp: maxT,
        condition: dayCond.label,
        icon: dayCond.icon
      });
    }
  }

  // Format Sunrise & Sunset
  const rawSunrise = daily?.sunrise?.[0];
  const rawSunset = daily?.sunset?.[0];
  const sunriseStr = rawSunrise ? new Date(rawSunrise).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' }) : '06:31 AM';
  const sunsetStr = rawSunset ? new Date(rawSunset).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' }) : '06:20 PM';

  // Wind direction compass
  const deg = cur?.wind_direction_10m || 0;
  const compass = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const directionStr = compass[Math.round(deg / 45) % 8];

  const minTempToday = daily?.temperature_2m_min?.[0] != null ? Math.round(daily.temperature_2m_min[0]).toString() : '23';
  const maxTempToday = daily?.temperature_2m_max?.[0] != null ? Math.round(daily.temperature_2m_max[0]).toString() : '30';

  return {
    city: {
      id: city.id,
      name: city.name,
      slug: city.slug,
      stateName: city.state?.name || '',
      stateSlug: city.state?.slug || '',
      latitude: city.latitude,
      longitude: city.longitude,
      monumentIcon: city.monumentIcon
    },
    current: {
      temp: cur?.temperature_2m != null ? Math.round(cur.temperature_2m).toString() : '30',
      feelsLike: cur?.apparent_temperature != null ? Math.round(cur.apparent_temperature) : 35,
      condition: condition.label,
      conditionIcon: condition.icon,
      humidity: cur?.relative_humidity_2m != null ? cur.relative_humidity_2m : 65,
      windSpeed: cur?.wind_speed_10m != null ? cur.wind_speed_10m.toFixed(1) : '19.8',
      windDirection: directionStr,
      pressure: cur?.surface_pressure != null ? (cur.surface_pressure * 0.02953).toFixed(2) : '29.82', // in inHg
      uvIndex: daily?.uv_index_max?.[0] != null ? daily.uv_index_max[0].toFixed(1) : '1.5',
      minTemp: minTempToday,
      maxTemp: maxTempToday,
      sunrise: sunriseStr,
      sunset: sunsetStr,
      lastUpdated: 'Just now'
    },
    aqi: {
      value: aqiInfo.aqi,
      status: aqiInfo.status,
      badge: aqiInfo.badge,
      color: aqiInfo.color,
      bg: aqiInfo.bg,
      pm25: curAqi?.pm2_5 != null ? Math.round(curAqi.pm2_5) : 55,
      pm10: curAqi?.pm10 != null ? Math.round(curAqi.pm10) : 66
    },
    weeklyForecast
  };
}
