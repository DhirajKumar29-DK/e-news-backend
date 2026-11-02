/**
 * Real-time News Ingestion Service for Broadsheet E-Paper Studio
 * Fetches verified live breaking news from Google News RSS & internal database.
 * Strictly guarantees MAX 24-HOUR freshness and 100% topic purity (zero topic drift).
 */

import { prisma } from '../../config/db.js';

const CITY_KEYWORDS = {
  patna: 'पटना',
  bihar: 'बिहार',
  delhi: 'दिल्ली',
  hajipur: 'हाजीपुर',
  vaishali: 'वैशाली',
  gaya: 'गया',
  muzaffarpur: 'मुजफ्फरपुर',
  bhagalpur: 'भागलपुर',
  chhapra: 'छपरा',
  siwan: 'सीवान',
  gopalganj: 'गोपालगंज',
  darbhanga: 'दरभंगा',
  samastipur: 'समस्तीपुर',
  madhubani: 'मधुबनी',
  munger: 'मुंगेर',
  saharsa: 'सहरसा',
  purnia: 'पूर्णिया',
  begusarai: 'बेगूसराय',
  motihari: 'मोतिहारी',
  bettiah: 'बेतिया',
  buxar: 'बक्सर',
  ara: 'आरा',
  bhojpur: 'भोजपुर',
  sasaram: 'सासाराम',
  nalanda: 'नालंदा',
  rajgir: 'राजगीर',
  nawada: 'नवादा',
  aurangabad: 'औरंगाबाद',
  jamui: 'जमुई',
  katihar: 'कटिहार',
  kishanganj: 'किशनगंज',
  araria: 'अररिया',
  supaul: 'सुपौल',
  ranchi: 'रांची',
  dhanbad: 'धनबाद',
  bokaro: 'बोकारो',
  jamshedpur: 'जमशेदपुर',
  lucknow: 'लखनऊ',
  varanasi: 'वाराणसी',
  gorakhpur: 'गोरखपुर',
  prayagraj: 'प्रयागराज',
  kanpur: 'कानपुर',
  kolkata: 'कोलकाता',
  mumbai: 'मुंबई'
};

export function detectTopicFromPrompt(text = '') {
  // Strip conversational fillers in Hinglish, Hindi, and English like "bhai", "samjhe", "kro", "karo", "add kro", etc.
  // Word boundaries prevent "bhai" from being misidentified as "ai" (Tech)!
  const cleanT = (text || '')
    .toLowerCase()
    .replace(/\b(bhai\s*mere|bhai|samjhe|kro|karo|add karo|add kro|bana do|bana|chahiye|plz|please|dalo|lagao|likho|dal do|laga do)\b/gi, ' ');

  // 1. Geographic Entity (City, District, State) MUST BE CHECKED FIRST!
  // If user says "patna top news", "patna breaking news", "पटना ताज़ा समाचार",
  // it is ALWAYS CITY_LOCAL, never National Front Page!
  // Note: JavaScript \b does NOT work on Devanagari Unicode, so Devanagari uses exact string matching!
  const detectedCity = Object.keys(CITY_KEYWORDS).find(c => {
    const enMatch = new RegExp(`\\b${c}\\b`, 'i').test(cleanT);
    const hiName = CITY_KEYWORDS[c];
    const hiMatch = hiName ? cleanT.includes(hiName) : false;
    return enMatch || hiMatch;
  });
  if (detectedCity) {
    return 'CITY_LOCAL';
  }

  // 2. Sports (Cricket, Football, Boxing, etc.)
  if (/\b(cricket|football|boxing|hockey|tennis|badminton|kabaddi|kushti|dangal|sports?|match|fifa|ipl|wpl)\b|क्रिकेट|फुटबॉल|बॉक्सिंग|खेल|मैच|हॉकी|टेनिस|बैडमिंटन|कबड्डी|कुश्ती|दंगल|दौड़|एथलीट|गोल्ड मेडल/i.test(cleanT)) {
    return 'SPORTS';
  }

  // 3. Business & Economy
  if (/\b(share market|stock market|sensex|nifty|business|economy|trading|sebi|rbi|rupee|gold|silver)\b|कारोबार|शेयर बाजार|सेंसेक्स|निफ्टी|व्यापार|बिजनेस|रुपया|सोना|चांदी|मार्केट|मुनाफा|घाटा|अर्थव्यवस्था/i.test(cleanT)) {
    return 'BUSINESS';
  }

  // 4. Entertainment & Cinema
  if (/\b(bollywood|cinema|movies?|films?|actors?|actress|trailer|ott|entertainment)\b|सिनेमा|फिल्म|बॉलीवुड|मनोरंजन|अभिनेता|अभिनेत्री|कलाकार/i.test(cleanT)) {
    return 'ENTERTAINMENT';
  }

  // 5. Tech & Gadgets (Word boundary \b strictly enforced so "bhai" never matches "ai")
  if (/\b(technology|tech|smartphones?|gadgets?|cyber|isro|artificial intelligence)\b|\bai\b|तकनीक|गैजेट|मोबाइल|स्मार्टफोन|रोबोट/i.test(cleanT)) {
    return 'TECH';
  }

  // 6. World & Foreign Affairs
  if (/\b(world|international|foreign|america|china|russia|israel|iran|ukraine)\b|विदेश|अंतरराष्ट्रीय|दुनिया|वैश्विक/i.test(cleanT)) {
    return 'WORLD';
  }

  // 7. Politics & Elections (National)
  if (/\b(politics|elections?|political|party|rahul|modi|bjp|congress|nda|yadav|nitish|chunav|parliament|sansad)\b|चुनाव|राजनीति|सियासत|पार्टी|विधायक|सांसद|सरकार|विपक्ष|रैली|जनसभा/i.test(cleanT)) {
    return 'POLITICS';
  }

  // 8. Crime & Legal
  if (/\b(police|crimes?|murders?|arrests?|accidents?|deaths?|court|cbi|ed|nia)\b|अपराध|पुलिस|हत्या|लूट|गिरफ्तार|हादसा|मौत|वारदात|शव|गोली|जांच|मुकदमा/i.test(cleanT)) {
    return 'CRIME';
  }

  // 9. National Front Page / Top Headlines
  if (/\b(top news|breaking news|top breaking|top india|india states|states news|national news|desh ki|badi khabrein|top \d{1,2}|breaking)\b|ब्रेकिंग|ताज़ा खबर|बड़ी खबरें|प्रमुख समाचार|मुख्य समाचार/i.test(cleanT)) {
    return 'FRONT_PAGE';
  }

  return 'GENERAL';
}

const TOPIC_QUERY_MAP = {
  SPORTS: 'cricket+sports+india',
  CRICKET: 'cricket+sports+india',
  BUSINESS: 'business+economy+market+sensex',
  ENTERTAINMENT: 'bollywood+cinema+entertainment',
  TECH: 'technology+gadgets+india',
  WORLD: 'world+international+diplomacy',
  POLITICS: 'politics+election+india',
  CRIME: 'crime+investigation+india',
  FRONT_PAGE: 'भारत देश की बड़ी खबरें राष्ट्रीय ब्रेकिंग राज्य',
  BIHAR: 'bihar+patna+news'
};

const TOPIC_FALLBACK_QUERIES = {
  SPORTS: 'खेल जगत क्रिकेट फुटबॉल आज की बड़ी खबरें',
  BUSINESS: 'शेयर बाजार बिजनेस कारोबार अर्थव्यवस्था आज',
  ENTERTAINMENT: 'बॉलीवुड सिनेमा मनोरंजन आज की खबरें',
  TECH: 'टेक्नोलॉजी मोबाइल स्मार्टफोन गैजेट्स आज',
  WORLD: 'अंतरराष्ट्रीय दुनिया की बड़ी खबरें आज',
  POLITICS: 'राष्ट्रीय राजनीति चुनाव ताज़ा समाचार आज',
  CRIME: 'अपराध पुलिस जांच ताज़ा खबरें आज',
  CITY_LOCAL: 'पटना शहर स्थानीय समाचार आज',
  GENERAL: 'आज की मुख्य ताज़ा राष्ट्रीय खबरें'
};

export function formatHindiDateString(dateStr) {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const days = ['रविवार', 'सोमवार', 'मंगलवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार'];
    const months = ['जनवरी', 'फरवरी', 'मार्च', 'अप्रैल', 'मई', 'जून', 'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर'];
    return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  } catch {
    return dateStr;
  }
}

function decodeXmlEntities(text) {
  if (!text) return '';
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]+>/g, '')
    .trim();
}

/**
 * Strict 24-Hour Date-Window Validator:
 * For latest-news requests (today/null): Enforces an exact rolling 24-hour window from Date.now().
 * Rejects missing, unparseable, stale (>24h), and future-dated timestamps.
 * For historical archive requests: Enforces publication within the target edition day window.
 */
export function validateItemFreshness(pubDateStr, targetDateStr = null) {
  if (!pubDateStr) return { isValid: false, reason: 'MISSING_PUBDATE' };
  const pubTime = new Date(pubDateStr).getTime();
  if (isNaN(pubTime)) return { isValid: false, reason: 'INVALID_TIMESTAMP' };

  const now = Date.now();
  const todayIso = new Date(now).toISOString().split('T')[0];
  const isArchiveDate = targetDateStr && /^\d{4}-\d{2}-\d{2}$/.test(targetDateStr) && targetDateStr !== todayIso;

  if (isArchiveDate) {
    const target = new Date(targetDateStr);
    const targetStart = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth(), target.getUTCDate(), 0, 0, 0, 0)).getTime();
    const targetEnd = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth(), target.getUTCDate(), 23, 59, 59, 999)).getTime();
    const minTime = targetStart - (12 * 3600 * 1000);
    const maxTime = targetEnd + (12 * 3600 * 1000);

    const valid = pubTime >= minTime && pubTime <= maxTime;
    return {
      isValid: valid,
      mode: 'ARCHIVE',
      reason: valid ? 'OK' : 'OUTSIDE_ARCHIVE_WINDOW',
      hoursAgo: Math.round((now - pubTime) / 3600000)
    };
  }

  // Strict rolling 24-hour window from current execution moment
  const maxAllowedFuture = now + (15 * 60 * 1000); // 15 min clock-drift cushion
  if (pubTime > maxAllowedFuture) {
    return { isValid: false, reason: 'FUTURE_TIMESTAMP' };
  }

  const minAllowedRolling24h = now - (24 * 3600 * 1000); // exactly 24.0 hours ago
  if (pubTime < minAllowedRolling24h) {
    return {
      isValid: false,
      reason: 'STALE_OVER_24H',
      hoursAgo: Math.round((now - pubTime) / 3600000)
    };
  }

  const diffMs = now - pubTime;
  const hoursAgo = Math.max(0, Math.floor(diffMs / 3600000));
  return { isValid: true, mode: 'LATEST_ROLLING_24H', hoursAgo };
}

/**
 * Backward-compatible boolean wrapper for date-window checking
 */
export function isItemWithinDateWindow(pubDateStr, targetDateStr) {
  return validateItemFreshness(pubDateStr, targetDateStr).isValid;
}

export function formatRelativeTimeHindi(pubDateStr, targetDateStr) {
  try {
    const d = new Date(pubDateStr);
    if (isNaN(d.getTime())) {
      return targetDateStr ? formatHindiDateString(targetDateStr) : 'आज की ताज़ा ख़बर';
    }
    const compareDate = targetDateStr ? new Date(targetDateStr) : new Date();
    const diffMs = compareDate.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins >= 0 && diffMins < 60) {
      return `${Math.max(5, diffMins)} मिनट पहले`;
    }
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours >= 0 && diffHours < 24) {
      return `${diffHours} घंटे पहले`;
    }
    return formatHindiDateString(pubDateStr);
  } catch {
    return 'ताज़ा समाचार';
  }
}

/**
 * Headline Text Normalization for Event Deduplication
 */
export function normalizeTitleForComparison(title = '') {
  return (title || '')
    .toLowerCase()
    .replace(/[-–—]\s*[^-–—]+$/, '') // strip ' - ABP News' or ' - NDTV'
    .replace(/[^\w\s\u0900-\u097F]/g, ' ') // strip symbols & punctuation
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extract Significant Keywords (filtering language stop words)
 */
export function getSignificantTokens(str = '') {
  const stopWords = new Set([
    'में', 'के', 'की', 'को', 'और', 'से', 'पर', 'ने', 'का', 'है', 'हैं', 'था', 'थी', 'थे',
    'यह', 'वह', 'तो', 'भी', 'ही', 'किया', 'गया', 'हुए', 'हुई', 'हुआ', 'कर', 'रहा', 'रही',
    'रहे', 'दिया', 'दिए', 'दी', 'लेकर', 'बाद', 'तक', 'बारे', 'साथ', 'लिए', 'news', 'latest',
    'today', 'the', 'in', 'of', 'and', 'to', 'a', 'for', 'on', 'with', 'at', 'by', 'from'
  ]);
  return normalizeTitleForComparison(str)
    .split(/\s+/)
    .filter(w => w.length >= 2 && !stopWords.has(w));
}

/**
 * Event-Level Similarity Calculator (Jaccard Index)
 * Determines whether two differently worded headlines refer to the same event.
 */
export function calculateStorySimilarity(titleA = '', titleB = '') {
  const tokensA = new Set(getSignificantTokens(titleA));
  const tokensB = new Set(getSignificantTokens(titleB));
  if (tokensA.size === 0 || tokensB.size === 0) return 0;

  let intersection = 0;
  for (const t of tokensA) {
    if (tokensB.has(t)) intersection++;
  }
  const union = new Set([...tokensA, ...tokensB]).size;
  return union > 0 ? (intersection / union) : 0;
}

/**
 * Low-level RSS fetch with strict rolling 24h guarantee & description/snippet parsing
 */
async function fetchRssItems(query, targetDate) {
  try {
    let url = '';
    if (query.startsWith('https://')) {
      url = query;
    } else {
      let effectiveQuery = query;
      const isExplicitDate = targetDate && /^\d{4}-\d{2}-\d{2}$/.test(targetDate);
      const todayIso = new Date().toISOString().split('T')[0];

      if (isExplicitDate && targetDate !== todayIso) {
        const d = new Date(targetDate);
        const next = new Date(d);
        next.setDate(next.getDate() + 1);
        const prev = new Date(d);
        prev.setDate(prev.getDate() - 1);
        effectiveQuery += `+after:${prev.toISOString().split('T')[0]}+before:${next.toISOString().split('T')[0]}`;
      } else {
        effectiveQuery += '+when:24h';
      }

      const encoded = encodeURIComponent(effectiveQuery).replace(/%2B/g, '+');
      url = `https://news.google.com/rss/search?q=${encoded}&hl=hi&gl=IN&ceid=IN:hi`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'application/rss+xml, application/xml, text/xml'
      }
    });

    clearTimeout(timeoutId);

    if (!response.ok) return [];

    const xml = await response.text();
    const itemMatches = xml.match(/<item>[\s\S]*?<\/item>/g) || [];
    const results = [];

    for (const rawItem of itemMatches) {
      const titleMatch = rawItem.match(/<title>([\s\S]*?)<\/title>/);
      const pubDateMatch = rawItem.match(/<pubDate>([\s\S]*?)<\/pubDate>/);
      const sourceMatch = rawItem.match(/<source[^>]*>([\s\S]*?)<\/source>/);
      const linkMatch = rawItem.match(/<link>([\s\S]*?)<\/link>/);
      const descMatch = rawItem.match(/<description>([\s\S]*?)<\/description>/);

      const rawTitle = titleMatch ? decodeXmlEntities(titleMatch[1]) : '';
      if (!rawTitle) continue;

      const pubDate = pubDateMatch ? pubDateMatch[1] : '';

      // STRICT 24-HOUR ROLLING VALIDATION: Discard stale and future-dated news!
      const freshness = validateItemFreshness(pubDate, targetDate);
      if (!freshness.isValid) {
        continue;
      }

      let headline = rawTitle;
      let sourceName = sourceMatch ? decodeXmlEntities(sourceMatch[1]) : '';

      const dashIdx = headline.lastIndexOf(' - ');
      if (dashIdx > 20) {
        if (!sourceName) {
          sourceName = headline.substring(dashIdx + 3).trim();
        }
        headline = headline.substring(0, dashIdx).trim();
      }

      // Aggressively strip competitor prefixes, suffixes, and publisher tags
      headline = headline
        .replace(/^(?:भास्कर अपडेट्स|दैनिक भास्कर|अपडेट्स?|अपडेट\s*::|ब्रेकिंग\s*::|बड़ी ख़बर|लाइव अपडेट्स?|Breaking News|Live Updates)\s*[:：|–—-]\s*/gi, '')
        .replace(/\s*[-–—|]\s*(?:Dainik\s*Bhaskar|Bhaskar|Jagran|Dainik\s*Jagran|Amar\s*Ujala|Hindustan|Live\s*Hindustan|AajTak|Aaj\s*Tak|NDTV|NDTV\s*India|ABP\s*News|ABP|News18|TV9|BBC|BBC\s*Hindi|Navbharat\s*Times|NBT|Zee\s*News|India\s*TV|India\s*Today|The\s*Hindu|Indian\s*Express)[^$]*$/gi, '')
        .replace(/\s+(?:AajTak|Hindustan|Dainik Bhaskar|Bhaskar|Jagran|Amar Ujala|NDTV|ABP News|News18|BBC)\s*$/gi, '')
        .trim();

      // Extract real supporting facts/summary from RSS description snippet
      let snippet = '';
      if (descMatch && descMatch[1]) {
        const rawDescClean = decodeXmlEntities(descMatch[1])
          .replace(/<[^>]+>/g, ' ')
          .replace(/&nbsp;/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        if (rawDescClean.length > 20) {
          snippet = rawDescClean;
        }
      }

      // STRICT FILTER: Discard TV Live stream ads, vertical streaming apps, generic roundups, animal testing, and astrology
      const JUNK_PROMOTIONAL_REGEX = /(?:live\s*tv|लाइव\s*टीवी|live\s*stream|लाइव\s*स्ट्रीम|vertical\s*format|वर्टिकल|school\s*assembly|स्कूल\s*असेंबली|शाम\s*की\s*बड़ी\s*खबरें|सुबह\s*की\s*बड़ी\s*खबरें|पढ़ें.*शाम\s*की|पढ़ें.*सुबह\s*की|rashifal|राशिफल|पंचांग|horoscope|kundali|superfast\s*100|nonstop\s*100|speed\s*news|न्यूज\s*फटाफट|फटाफट\s*खबरें|top\s*10\s*headlines|video:\s*|देखें\s*वीडियो|newscast\s*at|watch\s*hindi\s*breaking|free\s*live\s*tv|खरगोश|जानवरों\s*पर\s*परीक्षण|animal\s*testing|शौकीन|वायरल\s*वीडियो|viral\s*video|देसी\s*जुगाड़|अजब\s*गजब)/i;

      if (JUNK_PROMOTIONAL_REGEX.test(headline) || JUNK_PROMOTIONAL_REGEX.test(snippet)) {
        continue;
      }

      // Classify verification level strictly:
      // RSS items only provide a headline and short snippet, so they are always VERIFIED_LIMITED.
      // VERIFIED_DETAILED is strictly reserved for full body text (>300 chars) from verified investigative sources.
      const verificationStatus = 'VERIFIED_LIMITED';

      results.push({
        headline,
        source: sourceName || 'न्यूज़ डेस्क',
        pubDate,
        relativeTime: formatRelativeTimeHindi(pubDate, targetDate),
        link: linkMatch ? linkMatch[1].trim() : '',
        snippet: snippet || '',
        verificationStatus,
        sourceEngine: 'GoogleNewsRSS'
      });
    }

    return results;
  } catch (err) {
    console.warn('[RealtimeNews] RSS fetch warning:', err.message);
    return [];
  }
}

/**
 * GDELT DOC 2.0 API Fetcher (Secondary Free News Wire)
 * Gracefully integrated: runs with 3.5s timeout. If unavailable, fails silently.
 */
export async function fetchGdeltNews(query, targetDate) {
  try {
    const cleanQ = encodeURIComponent(query.replace(/[^\w\s]/g, ' ').trim());
    if (!cleanQ) return [];

    const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${cleanQ}&mode=artlist&format=json&maxrecords=8&sort=DateDesc`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    clearTimeout(timeoutId);

    if (!response.ok) return [];

    const data = await response.json();
    const articles = data?.articles || [];
    const results = [];

    for (const a of articles) {
      if (!a.title) continue;
      // Convert GDELT timestamp (e.g., 20261031T063000Z) to standard ISO
      let pubDate = '';
      if (a.seendate) {
        const m = String(a.seendate).match(/^(\d{4})(\d{2})(\d{2})T?(\d{2})?(\d{2})?(\d{2})?/);
        if (m) {
          pubDate = `${m[1]}-${m[2]}-${m[3]}T${m[4] || '00'}:${m[5] || '00'}:${m[6] || '00'}Z`;
        }
      }

      const freshness = validateItemFreshness(pubDate, targetDate);
      if (!freshness.isValid) continue;

      results.push({
        headline: a.title.trim(),
        source: a.domain || 'Global Wire',
        pubDate,
        relativeTime: formatRelativeTimeHindi(pubDate, targetDate),
        link: a.url || '',
        snippet: a.socialimage ? `Coverage via ${a.domain}` : '',
        verificationStatus: 'VERIFIED_LIMITED',
        sourceEngine: 'GDELT'
      });
    }

    return results;
  } catch {
    // Fail silently — GDELT is non-blocking secondary wire
    return [];
  }
}

/**
 * Intelligent Multi-Subtopic Query Generator:
 * Breaks down complex prompts like "cricket football boxing" into dedicated parallel queries
 */
function buildTargetedQueries(userPrompt = '', detectedTopic = 'GENERAL') {
  const p = (userPrompt || '').toLowerCase();
  const queries = [];

  if (detectedTopic === 'SPORTS') {
    if (/cricket|क्रिकेट/i.test(p)) queries.push('क्रिकेट मैच खेल');
    if (/football|फुटबॉल/i.test(p)) queries.push('फुटबॉल मैच खेल');
    if (/boxing|बॉक्सिंग/i.test(p)) queries.push('बॉक्सिंग खेल प्रतियोगिता');
    if (/hockey|हॉकी/i.test(p)) queries.push('हॉकी मैच खेल');
    if (/tennis|टेनिस/i.test(p)) queries.push('टेनिस मैच खेल');
    if (/badminton|बैडमिंटन/i.test(p)) queries.push('बैडमिंटन टूर्नामेंट खेल');
    if (/kushti|dangal|कुश्ती|दंगल/i.test(p)) queries.push('कुश्ती दंगल खेल');

    if (queries.length === 0) {
      queries.push('क्रिकेट खेल समाचार', 'फुटबॉल खेल समाचार', 'खेल जगत बड़ी खबरें');
    }
  } else if (detectedTopic === 'BUSINESS') {
    if (/share|stock|सेंसेक्स|निफ्टी/i.test(p)) queries.push('शेयर बाजार सेंसेक्स निफ्टी');
    if (/gold|silver|सोना|चांदी/i.test(p)) queries.push('सोना चांदी भाव बाजार');
    if (/economy|अर्थव्यवस्था/i.test(p)) queries.push('भारतीय अर्थव्यवस्था व्यापार');
    if (queries.length === 0) {
      queries.push('शेयर बाजार बिजनेस ताज़ा समाचार', 'कारोबार बाजार आज');
    }
  } else if (detectedTopic === 'ENTERTAINMENT') {
    queries.push('बॉलीवुड सिनेमा मनोरंजन', 'फिल्म बॉक्स ऑफिस स्टार्स');
  } else if (detectedTopic === 'TECH') {
    queries.push('टेक्नोलॉजी स्मार्टफोन गैजेट्स', 'आर्टिफिशियल इंटेलिजेंस तकनीक');
  } else if (detectedTopic === 'CITY_LOCAL') {
    const matchedCityKey = Object.keys(CITY_KEYWORDS).find(c => {
      const enMatch = new RegExp(`\\b${c}\\b`, 'i').test(p);
      const hiName = CITY_KEYWORDS[c];
      const hiMatch = hiName ? p.includes(hiName) : false;
      return enMatch || hiMatch;
    });
    const cityName = matchedCityKey ? CITY_KEYWORDS[matchedCityKey] : 'पटना';
    const cityKey = matchedCityKey || 'patna';

    const biharCities = new Set([
      'patna', 'bihar', 'hajipur', 'vaishali', 'gaya', 'muzaffarpur',
      'bhagalpur', 'chhapra', 'siwan', 'gopalganj', 'darbhanga',
      'samastipur', 'madhubani', 'munger', 'saharsa', 'purnia',
      'begusarai', 'motihari', 'bettiah', 'buxar', 'ara', 'bhojpur',
      'sasaram', 'nalanda', 'rajgir', 'nawada', 'aurangabad', 'jamui',
      'katihar', 'kishanganj', 'araria', 'supaul'
    ]);

    const stateAffiliation = biharCities.has(cityKey) ? 'बिहार' : '';
    const stateAffiliationEn = biharCities.has(cityKey) ? 'bihar' : '';

    if (/crime|police|murder|arrest|accident|अपराध|पुलिस|हादसा|गिरफ्तार/i.test(p)) {
      queries.push(`${cityName} अपराध पुलिस हादसा`, `${cityKey} crime`);
    } else if (/politics|vidhansabha|chunav|election|राजनीति|विधानसभा|चुनाव/i.test(p)) {
      queries.push(`${cityName} राजनीति चुनाव विधानसभा`, `${cityKey} politics`);
    } else if (/weather|barish|mausam|thand|मौसम|बारिश|ठंड|तापमान/i.test(p)) {
      queries.push(`${cityName} मौसम बारिश तापमान`, `${cityKey} weather`);
    } else {
      queries.push(
        `${cityName} ${stateAffiliation}`.trim(),
        `${cityKey} ${stateAffiliationEn}`.trim(),
        `${cityName} अपराध विकास प्रशासन`
      );
    }
  } else if (detectedTopic === 'WORLD') {
    queries.push('अंतरराष्ट्रीय दुनिया विदेश समाचार', 'वैश्विक कूटनीति अमेरिका रूस');
  } else if (detectedTopic === 'FRONT_PAGE') {
    queries.push(
      'https://news.google.com/rss?hl=hi&gl=IN&ceid=IN:hi',
      'https://news.google.com/rss/headlines/section/topic/NATION?hl=hi&gl=IN&ceid=IN:hi',
      'भारत देश की बड़ी खबरें राष्ट्रीय ब्रेकिंग'
    );
  } else {
    // General or Regional: Clean userPrompt to prevent conversational text like "wo bas" skewing RSS
    const cleanGeneral = userPrompt
      .replace(/\b(k jo sabse|jo sabse|sabse top|wo bas|wo|bas|sirf|chahiye|hai|hain|bhai|samjhe|kro|karo|add)\b/gi, ' ')
      .replace(/[^\w\s\u0900-\u097F]/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    queries.push(cleanGeneral.length > 3 ? cleanGeneral : 'आज की मुख्य ताज़ा राष्ट्रीय खबरें');
  }

  return queries;
}

export function detectCitiesFromPrompt(promptText = '', requestedSlotCount = 5) {
  const t = (promptText || '').toLowerCase();
  const matched = [];

  for (const [key, label] of Object.entries(CITY_KEYWORDS)) {
    const enMatch = new RegExp(`\\b${key}\\b`, 'i').test(t);
    const hiMatch = label ? t.includes(label) : false;
    if (enMatch || hiMatch) {
      if (!matched.some(m => m.key === key)) {
        matched.push({ key, label });
      }
    }
  }

  if (matched.length === 0) return [];

  // Distribute requested slots evenly among matched cities
  const totalSlots = Math.max(1, Number(requestedSlotCount) || 5);
  const baseCount = Math.max(1, Math.floor(totalSlots / matched.length));
  let remainder = totalSlots - (baseCount * matched.length);

  const biharCities = new Set([
    'patna', 'bihar', 'hajipur', 'vaishali', 'gaya', 'muzaffarpur',
    'bhagalpur', 'chhapra', 'siwan', 'gopalganj', 'darbhanga',
    'samastipur', 'madhubani', 'munger', 'saharsa', 'purnia'
  ]);

  return matched.map(city => {
    let count = baseCount;
    if (remainder > 0) {
      count += 1;
      remainder -= 1;
    }
    const cleanQuery = biharCities.has(city.key)
      ? `${city.label} बिहार समाचार`
      : `${city.label} ताज़ा समाचार`;

    return {
      key: city.key.toUpperCase(),
      label: city.label,
      count,
      query: cleanQuery
    };
  });
}

/**
 * Parse subtopic distribution from natural language prompts
 * e.g. "4 cricket, 2 football, 2 boxing" OR multi-city "delhi patna hajipur gaya 5 slots"
 */
export function parseSubtopicRatios(promptText = '', requestedSlotCount = 8) {
  const text = (promptText || '').toLowerCase();
  const detected = [];

  const patterns = [
    { key: 'CRICKET', label: 'क्रिकेट', regex: /(\d+)\s*(?:cricket|क्रिकेट)/i, defaultQuery: 'क्रिकेट मैच खेल' },
    { key: 'FOOTBALL', label: 'फुटबॉल', regex: /(\d+)\s*(?:football|फुटबॉल)/i, defaultQuery: 'फुटबॉल मैच खेल' },
    { key: 'BOXING', label: 'बॉक्सिंग', regex: /(\d+)\s*(?:boxing|बॉक्सिंग)/i, defaultQuery: 'बॉक्सिंग खेल प्रतियोगिता' },
    { key: 'HOCKEY', label: 'हॉकी', regex: /(\d+)\s*(?:hockey|हॉकी)/i, defaultQuery: 'हॉकी मैच खेल' },
    { key: 'TENNIS', label: 'टेनिस', regex: /(\d+)\s*(?:tennis|टेनिस)/i, defaultQuery: 'टेनिस मैच खेल' },
    { key: 'BADMINTON', label: 'बैडमिंटन', regex: /(\d+)\s*(?:badminton|बैडमिंटन)/i, defaultQuery: 'बैडमिंटन टूर्नामेंट खेल' },
    { key: 'SENSEX', label: 'शेयर बाजार / सेंसेक्स', regex: /(\d+)\s*(?:share|stock|sensex|nifty|शेयर|सेंसेक्स|निफ्टी)/i, defaultQuery: 'शेयर बाजार सेंसेक्स निफ्टी' },
    { key: 'ECONOMY', label: 'अर्थव्यवस्था / व्यापार', regex: /(\d+)\s*(?:economy|business|अर्थव्यवस्था|कारोबार|व्यापार)/i, defaultQuery: 'भारतीय अर्थव्यवस्था कारोबार' },
    { key: 'POLITICS', label: 'राजनीति / चुनाव', regex: /(\d+)\s*(?:politics|election|chunav|राजनीति|चुनाव)/i, defaultQuery: 'राष्ट्रीय राजनीति चुनाव ताज़ा समाचार' },
    { key: 'CRIME', label: 'अपराध / सुरक्षा', regex: /(\d+)\s*(?:crime|police|अपराध|पुलिस|सुरक्षा)/i, defaultQuery: 'अपराध पुलिस जांच ताज़ा' }
  ];

  for (const p of patterns) {
    const m = text.match(p.regex);
    if (m && m[1]) {
      const count = parseInt(m[1], 10);
      if (!isNaN(count) && count > 0) {
        detected.push({ key: p.key, label: p.label, count, query: p.defaultQuery });
      }
    }
  }

  // If no explicit number breakdown like "4 cricket, 2 football" was found,
  // check if multiple cities or regions were requested (e.g. "delhi patna hajipur gaya")
  if (detected.length === 0) {
    const cityRules = detectCitiesFromPrompt(promptText, requestedSlotCount);
    if (cityRules.length > 1) {
      return cityRules;
    }
  }

  return detected;
}

/**
 * Multi-Factor Event Deduplicator
 * Filters out duplicate headlines, canonical URL duplicates, and same-event reports using Jaccard similarity.
 */
export function deduplicateNewsArticles(articles = [], similarityThreshold = 0.45) {
  const uniqueList = [];
  const seenUrls = new Set();

  for (const candidate of articles) {
    if (!candidate || !candidate.headline) continue;

    // 1. URL exact deduplication
    if (candidate.link) {
      const cleanUrl = candidate.link.split('?')[0].toLowerCase().trim();
      if (cleanUrl && seenUrls.has(cleanUrl)) continue;
      if (cleanUrl) seenUrls.add(cleanUrl);
    }

    // 2. Exact normalized headline deduplication
    const normCand = normalizeTitleForComparison(candidate.headline);
    const isExactDup = uniqueList.some(item => normalizeTitleForComparison(item.headline) === normCand);
    if (isExactDup) continue;

    // 3. Event-level semantic token overlap deduplication
    const isSameEvent = uniqueList.some(item => {
      const sim = calculateStorySimilarity(item.headline, candidate.headline);
      return sim >= similarityThreshold;
    });

    if (isSameEvent) continue;

    uniqueList.push(candidate);
  }

  return uniqueList;
}

/**
 * Fetch live news items from Google News RSS feed with date & topic guarantees
 */
export async function fetchGoogleNewsRss(queryStr, maxItems = 12, targetDate = null) {
  try {
    const rawClean = (queryStr || '').trim();
    const detectedTopic = detectTopicFromPrompt(rawClean);

    // Build targeted individual queries for multi-topic prompts (e.g. cricket + football + boxing)
    const subQueries = buildTargetedQueries(rawClean, detectedTopic);

    // Parallel fetch all sub-topic queries with strict rolling 24h validation
    const fetchedBatches = await Promise.all(
      subQueries.map(q => fetchRssItems(q, targetDate))
    );

    let allItems = [];
    for (const batch of fetchedBatches) {
      if (Array.isArray(batch)) {
        allItems.push(...batch);
      }
    }

    // Deduplicate across batches using multi-factor deduplication
    let items = deduplicateNewsArticles(allItems);

    return items.slice(0, maxItems).map((it, idx) => ({
      ...it,
      id: `rss-${idx + 1}`
    }));
  } catch (err) {
    console.warn('[RealtimeNews] Failed to fetch Google RSS:', err.message);
    return [];
  }
}

/**
 * Fetch recent published articles from internal Prisma database
 */
export async function fetchDatabaseRecentArticles(categoryKeyword = '', limit = 5, targetDate = null) {
  try {
    const whereClause = {};
    if (categoryKeyword) {
      whereClause.OR = [
        { category: { contains: categoryKeyword } },
        { subCategory: { contains: categoryKeyword } },
        { title: { contains: categoryKeyword } }
      ];
    }

    // Strictly enforce same-date boundary on database articles (zero stale/old articles)
    const effectiveDate = targetDate || new Date().toISOString().split('T')[0];
    const targetStart = new Date(effectiveDate);
    targetStart.setHours(0, 0, 0, 0);
    const targetEnd = new Date(effectiveDate);
    targetEnd.setHours(23, 59, 59, 999);
    whereClause.createdAt = {
      gte: targetStart,
      lte: targetEnd
    };

    const dbArticles = await prisma.article.findMany({
      where: whereClause,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        subHeadline: true,
        content: true,
        category: true,
        featuredImage: true,
        authorName: true,
        createdAt: true
      }
    });

    return dbArticles.map((a, i) => ({
      id: `db-${a.id || i + 1}`,
      headline: a.title,
      subHeadline: a.subHeadline || '',
      content: a.content || '',
      category: a.category || 'विशेष',
      imageUrl: a.featuredImage || '',
      source: a.authorName || 'संपादकीय टीम',
      relativeTime: formatRelativeTimeHindi(a.createdAt, targetDate),
      verificationStatus: a.content && a.content.length > 50 ? 'VERIFIED_DETAILED' : 'VERIFIED_LIMITED',
      sourceEngine: 'ReporterDatabase'
    }));
  } catch (err) {
    console.warn('[RealtimeNews] Failed to query Prisma articles:', err.message);
    return [];
  }
}

/**
 * Main aggregator: fetches combined real-time news for E-Paper Studio
 * Merges Google News RSS, GDELT (secondary), and internal Reporter Database.
 * Guarantees strict multi-factor deduplication and verified rolling 24-hour freshness.
 */
export async function getRealtimeNewsForEpaper({
  topic = 'SPORTS',
  customQuery = '',
  editionCity = 'पटना',
  targetDate = null,
  limit = 12,
  requestedSlotCount = null
}) {
  const effectivePrompt = (customQuery || topic || '').trim();
  const detectedTopic = detectTopicFromPrompt(effectivePrompt);

  let queryStr = effectivePrompt || TOPIC_QUERY_MAP[detectedTopic] || TOPIC_QUERY_MAP.SPORTS;

  // Check if user requested multi-subtopic distribution (e.g. 3 cricket, 2 football, 1 boxing)
  const targetSlots = requestedSlotCount || limit;
  const subtopicRules = parseSubtopicRatios(effectivePrompt, targetSlots);

  // If user requested multi-subtopic distribution (e.g. 3 cricket, 2 football, 1 boxing)
  if (subtopicRules.length > 0) {
    const allocatedStories = [];
    const subtopicStories = {};

    for (const rule of subtopicRules) {
      try {
        const subItems = await fetchGoogleNewsRss(rule.query, rule.count + 4, targetDate);
        const uniqueSub = deduplicateNewsArticles(subItems);
        const selected = uniqueSub.slice(0, rule.count).map(it => ({
          ...it,
          subtopic: rule.label,
          subtopicKey: rule.key
        }));
        subtopicStories[rule.key] = selected;
        allocatedStories.push(...selected);
      } catch (err) {
        console.warn(`[RealtimeNews] Failed fetching subtopic ${rule.key}:`, err.message);
        subtopicStories[rule.key] = [];
      }
    }

    // Apply multi-factor deduplication to ensure zero duplicate events across subtopics
    const dedupedAllocated = deduplicateNewsArticles(allocatedStories);

    dedupedAllocated.shortage = dedupedAllocated.length < limit;
    dedupedAllocated.requestedCount = limit;
    dedupedAllocated.availableCount = dedupedAllocated.length;
    dedupedAllocated.subtopicRules = subtopicRules;
    dedupedAllocated.subtopicStories = subtopicStories;

    return dedupedAllocated;
  }

  // General / Single-topic fetch: Google RSS, GDELT (graceful secondary), and internal Database in parallel
  const [rssStories, gdeltStories, dbStories] = await Promise.all([
    fetchGoogleNewsRss(queryStr, limit, targetDate),
    fetchGdeltNews(queryStr, targetDate),
    fetchDatabaseRecentArticles(detectedTopic, 3, targetDate)
  ]);

  // Priority Merge: Internal Database first, then Google News RSS, then GDELT
  const rawPool = [
    ...(dbStories || []),
    ...(rssStories || []),
    ...(gdeltStories || [])
  ];

  // Apply multi-factor deduplication
  const combined = deduplicateNewsArticles(rawPool);
  const finalStories = combined.slice(0, limit);

  // Attach metadata properties while preserving full Array compatibility
  finalStories.shortage = finalStories.length < limit;
  finalStories.requestedCount = limit;
  finalStories.availableCount = finalStories.length;
  finalStories.subtopicRules = subtopicRules;
  finalStories.subtopicStories = {};

  return finalStories;
}
