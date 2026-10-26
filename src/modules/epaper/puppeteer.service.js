import { PDFDocument } from 'pdf-lib';
import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const layoutClientPath = path.join(__dirname, 'layout.client.js');
const layoutClientJs = fs.readFileSync(layoutClientPath, 'utf8');


let vartiqLogoBase64 = '';
try {
  const logoPath = path.join(process.cwd(), 'public', 'vartiq-logo.png');
  if (fs.existsSync(logoPath)) {
    vartiqLogoBase64 = `data:image/png;base64,${fs.readFileSync(logoPath).toString('base64')}`;
  } else {
    const feLogoPath = path.join(process.cwd(), '..', 'e-news', 'public', 'vartiq-logo.png');
    if (fs.existsSync(feLogoPath)) {
      vartiqLogoBase64 = `data:image/png;base64,${fs.readFileSync(feLogoPath).toString('base64')}`;
    }
  }
} catch (e) {
  console.warn('Could not load vartiq-logo.png as base64:', e.message);
}

function formatHindiDateline(dateStr) {
  if (!dateStr) return 'गुरुवार • 22 अक्टूबर 2026';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const days = ['रविवार', 'सोमवार', 'मंगलवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार'];
  const months = ['जनवरी', 'फरवरी', 'मार्च', 'अप्रैल', 'मई', 'जून', 'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर'];

  const dayName = days[d.getDay()];
  const dateNum = d.getDate();
  const monthName = months[d.getMonth()];
  const year = d.getFullYear();

  return `${dayName} • ${dateNum} ${monthName} ${year}`;
}

export function buildPageFragment(opts, pageObj, pIdx) {
  const { editionTitle, editionCity, editionState, publishDate } = opts;
  const formattedDate = formatHindiDateline(publishDate);
  const cleanCity = (editionCity && !editionCity.includes('?')) ? editionCity : 'पटना';
  const pageNum = pageObj.pageNumber || (pIdx + 1);
  const isPage1 = Number(pageNum) === 1;

  const rawSlots = pageObj.slots || [];
  const rawSlotsJson = JSON.stringify(rawSlots).replace(/</g, '\\u003c');

  const headerCfg = pageObj.headerConfig || {};
  const isCustomMode = headerCfg.mode === 'custom' || headerCfg.headerType === 'section';
  const isDefaultMode = headerCfg.mode === 'default' || headerCfg.headerType === 'masthead';
  const isMasthead = isCustomMode ? false : (isDefaultMode ? true : isPage1);

  let headerHtml = '';

  if (isMasthead) {
    // 1:1 Exact Match with Website Page 1 Grand Broadsheet Masthead
    const mastheadH = Number(headerCfg.height) && Number(headerCfg.height) >= 120 ? Number(headerCfg.height) : 168;
    const mastheadMargin = Number(headerCfg.bottomMargin) && Number(headerCfg.bottomMargin) >= 8 ? Number(headerCfg.bottomMargin) : 20;
    const themeColor = headerCfg.titleColorMain || headerCfg.titleColor || '#c51c24';
    const cityText = headerCfg.cityText || cleanCity;

    headerHtml = `
      <div class="masthead-wrapper" style="width: calc(100% + 80px); margin-left: -40px; margin-right: -40px; margin-bottom: ${mastheadMargin}px; box-sizing: border-box;">
        <div style="display: flex; align-items: center; justify-content: space-between; background-color: #ffffff; width: 100%; height: ${mastheadH}px; padding: 0 16px; box-sizing: border-box;">
          <!-- Left Column: DIGITAL & TEMP + BRAND LOGO + LOCATION & DATE -->
          <div style="width: 290px; height: 100%; flex-shrink: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 0 12px; box-sizing: border-box;">
            <div style="font-family: 'Inter', 'Mukta', 'Noto Sans Devanagari', sans-serif; font-size: 11px; font-weight: 700; color: #334155; letter-spacing: 0.5px; display: flex; align-items: center; justify-content: center; gap: 6px; white-space: nowrap; margin-bottom: 4px;">
              <span>डिजिटल संस्करण</span>
              <span>•</span>
              <span>तापमान 31°C</span>
            </div>
            ${vartiqLogoBase64 ? `<img src="${vartiqLogoBase64}" alt="वार्तिक" style="height: 80px; max-width: 235px; object-fit: contain;" />` : ''}
            <div style="font-family: 'Inter', 'Mukta', 'Noto Sans Devanagari', sans-serif; font-size: 11.5px; font-weight: 700; color: #1e293b; letter-spacing: 0.5px; margin-top: 6px; display: flex; align-items: center; justify-content: center; gap: 6px; white-space: nowrap;">
              <span style="color: #b31e21; font-weight: 900;">अपना ${cityText}</span>
              <span>•</span>
              <span>${formattedDate}</span>
            </div>
          </div>

          <!-- Center Column: GRAND "वार्तिक" + TAGLINE & RED SWOOSH -->
          <div style="flex: 1; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 0 16px; box-sizing: border-box;">
            <div style="display: flex; align-items: center; justify-content: center; gap: 16px; width: 100%;">
              <div style="height: 3px; width: 96px; border-radius: 9999px; background-color: ${themeColor};"></div>
              <h1 style="font-family: 'Mukta', 'Hind', 'Noto Sans Devanagari', sans-serif; font-weight: 800; line-height: 1.15; letter-spacing: -0.01em; font-size: 88px; color: ${themeColor}; margin: 0; padding: 4px 0 0 0;">
                वार्तिक
              </h1>
              <div style="height: 3px; width: 96px; border-radius: 9999px; background-color: ${themeColor};"></div>
            </div>
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; margin-top: -4px;">
              <div style="font-family: 'Mukta', 'Hind', 'Noto Sans Devanagari', sans-serif; font-size: 16px; font-weight: 900; color: #0f172a; letter-spacing: 1px;">
                खबर समझो, दुनिया समझो।
              </div>
              <svg width="240" height="8" viewBox="0 0 240 8" style="margin-top: 2px;">
                <defs>
                  <linearGradient id="headerSwooshGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stop-color="#e51d27" />
                    <stop offset="50%" stop-color="#b80d15" />
                    <stop offset="100%" stop-color="#e51d27" />
                  </linearGradient>
                </defs>
                <path d="M 4,1.5 Q 120,7.5 236,1.5 Q 120,4.5 4,1.5 Z" fill="url(#headerSwooshGrad)" />
              </svg>
            </div>
          </div>

          <!-- Right Column -->
          <div style="width: 290px; height: 100%; flex-shrink: 0;"></div>
        </div>

        <!-- DOUBLE BORDER RULE (Exact 1:1 with Website) -->
        <div style="width: 100%; height: 4px; border-top: 1px solid #0f172a; border-bottom: 3.5px solid #0f172a; background-color: #ffffff;"></div>
      </div>
    `;
  } else {
    // 1:1 Exact Match with Website Page 2+ Section Header
    const sectionH = Number(headerCfg.height) && Number(headerCfg.height) >= 40 ? Number(headerCfg.height) : 56;
    const sectionMargin = Number(headerCfg.bottomMargin) && Number(headerCfg.bottomMargin) >= 8 ? Number(headerCfg.bottomMargin) : 18;
    const cityText = headerCfg.cityText || cleanCity;
    const pageBadge = headerCfg.pageBadgeText || String(pageNum).padStart(2, '0');
    const pageBadgeBg = headerCfg.pageBadgeBg || '#1e293b';
    const pageBadgeColor = headerCfg.pageBadgeColor || '#ffffff';

    let centerTitleHtml = '';
    if (headerCfg.twoToneTitle && headerCfg.titlePrefix) {
      const pColor = headerCfg.titleColorPrefix || '#475569';
      const mColor = headerCfg.titleColorMain || '#c51c24';
      centerTitleHtml = `
        <span style="color: ${pColor}; font-size: ${headerCfg.titleFontSize || 38}px; font-weight: 900; font-family: 'Mukta', 'Noto Serif Devanagari', 'Poppins', 'Inter', sans-serif; line-height: 1;">${headerCfg.titlePrefix}</span>
        <span style="color: ${mColor}; font-size: ${headerCfg.titleFontSize || 38}px; font-weight: 900; font-family: 'Mukta', 'Noto Serif Devanagari', 'Poppins', 'Inter', sans-serif; line-height: 1;">${headerCfg.titleMain || cityText}</span>
      `;
    } else if (headerCfg.title) {
      const tColor = headerCfg.titleColor || headerCfg.titleColorMain || '#0f172a';
      centerTitleHtml = `
        <span style="color: ${tColor}; font-size: ${headerCfg.titleFontSize || 38}px; font-weight: 900; font-family: 'Mukta', 'Noto Serif Devanagari', 'Poppins', 'Inter', sans-serif; line-height: 1;">${headerCfg.title}</span>
      `;
    } else {
      centerTitleHtml = `
        <span style="color: #475569; font-size: 38px; font-weight: 900; font-family: 'Mukta', 'Noto Serif Devanagari', 'Poppins', 'Inter', sans-serif; line-height: 1;">अपना</span>
        <span style="color: #c51c24; font-size: 38px; font-weight: 900; font-family: 'Mukta', 'Noto Serif Devanagari', 'Poppins', 'Inter', sans-serif; line-height: 1;">${cityText}</span>
      `;
    }

    headerHtml = `
      <div class="section-header-wrapper" style="width: calc(100% + 80px); margin-left: -40px; margin-right: -40px; margin-bottom: ${sectionMargin}px; box-sizing: border-box;">
        <div style="display: flex; align-items: center; justify-content: space-between; width: 100%; height: ${sectionH}px; padding: 0 16px; box-sizing: border-box; background-color: #ffffff;">
          <div style="width: 280px; flex-shrink: 0; display: flex; align-items: center; gap: 12px;">
            ${vartiqLogoBase64 ? `<img src="${vartiqLogoBase64}" alt="वार्तिक" style="height: 34px; max-width: 130px; object-fit: contain;" />` : ''}
            <div style="border-left: 1px solid #cbd5e1; padding-left: 10px; font-family: 'Inter', sans-serif;">
              <div style="font-size: 10px; font-weight: 700; color: #64748b; letter-spacing: 0.5px;">www.vartiq.com</div>
            </div>
          </div>
          <div style="flex: 1; display: flex; align-items: baseline; justify-content: center; gap: 10px; text-align: center; padding: 0 16px; white-space: nowrap;">
            ${centerTitleHtml}
          </div>
          <div style="width: 280px; flex-shrink: 0; display: flex; align-items: center; justify-content: flex-end; gap: 12px;">
            <div style="text-align: right; font-family: 'Inter', 'Mukta', sans-serif; line-height: 1.2;">
              <div style="font-size: 12px; font-weight: 900; color: #0f172a; letter-spacing: 0.5px;">${cityText}</div>
              <div style="font-size: 10.5px; font-weight: 700; color: #475569;">${formattedDate}</div>
            </div>
            <!-- Dynamic Page Badge -->
            <div style="background-color: ${pageBadgeBg}; color: ${pageBadgeColor}; min-width: 42px; padding: 4px 10px; border-radius: 2px; font-family: 'Inter', sans-serif; font-weight: 900; font-size: 15px; letter-spacing: 1px; text-align: center; box-shadow: 0 1px 2px rgba(0,0,0,0.1); border: 1px solid rgba(0,0,0,0.1);">
              ${pageBadge}
            </div>
          </div>
        </div>
        <!-- SOLID RED BORDER LINE -->
        <div style="width: 100%; height: 2.5px; background-color: #c51c24;"></div>
      </div>
    `;
  }


  const cmykClusterHtml = `
    <div style="display: flex; align-items: center; gap: 6px; flex-shrink: 0; user-select: none;">
      <span style="width: 32px; height: 12px; border-radius: 9999px; background: #9ca3af; display: inline-block; opacity: 0.9;"></span>
      <span style="width: 14px; height: 14px; border-radius: 9999px; background: #00aef0; display: inline-block;"></span>
      <span style="width: 14px; height: 14px; border-radius: 9999px; background: #bfeeff; display: inline-block;"></span>
      <span style="width: 14px; height: 14px; border-radius: 9999px; background: #ec008c; display: inline-block;"></span>
      <span style="width: 14px; height: 14px; border-radius: 9999px; background: #fcd5eb; display: inline-block;"></span>
      <span style="width: 14px; height: 14px; border-radius: 9999px; background: #fff100; display: inline-block;"></span>
      <span style="width: 14px; height: 14px; border-radius: 9999px; background: #fffce0; display: inline-block;"></span>
      <span style="width: 14px; height: 14px; border-radius: 9999px; background: #000000; display: inline-block;"></span>
      <span style="width: 14px; height: 14px; border-radius: 9999px; background: #4b5563; display: inline-block;"></span>
      <span style="width: 14px; height: 14px; border-radius: 9999px; background: #d1d5db; display: inline-block;"></span>
      <span style="width: 32px; height: 12px; border-radius: 9999px; background: #9ca3af; display: inline-block; opacity: 0.9;"></span>
      <div style="display: grid; grid-template-columns: repeat(2, 6px); gap: 2px; width: 14px; height: 14px; padding: 2px; align-items: center; justify-content: center; flex-shrink: 0; box-sizing: border-box;">
        <span style="width: 6px; height: 6px; border-radius: 9999px; background: #fff100; display: inline-block;"></span>
        <span style="width: 6px; height: 6px; border-radius: 9999px; background: #00aef0; display: inline-block;"></span>
        <span style="width: 6px; height: 6px; border-radius: 9999px; background: #ec008c; display: inline-block;"></span>
        <span style="width: 6px; height: 6px; border-radius: 9999px; background: #000000; display: inline-block;"></span>
      </div>
      <div style="position: relative; width: 14px; height: 14px; border-radius: 9999px; border: 1px solid rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-sizing: border-box;">
        <div style="position: absolute; width: 100%; height: 0.75px; background: #000000;"></div>
        <div style="position: absolute; height: 100%; width: 0.75px; background: #000000;"></div>
      </div>
    </div>
`;

  const footerHtml = `
    <div class="broadsheet-footer" style="position: absolute; bottom: 0; left: 0; right: 0; width: 100%; z-index: 20; pointer-events: none; background: #ffffff;">
      <!-- TOP SOLID THIN RULE -->
      <div style="width: 100%; height: 1.5px; background-color: #0f172a;"></div>
      <!-- PURE CMYK COLOR REGISTRATION CONTROL STRIP -->
      <div style="width: 100%; height: 28px; padding: 0 24px; display: flex; align-items: center; justify-content: space-between; background: #ffffff; box-sizing: border-box; overflow: hidden;">
        ${cmykClusterHtml}
        ${cmykClusterHtml}
        ${cmykClusterHtml}
        ${cmykClusterHtml}
      </div>
    </div>
  `;

  const pageHtml = `
    <div class="broadsheet-page" id="page-${pageNum}">
      ${headerHtml}
      <div id="slots-layer-${pageNum}" class="slots-layer"></div>
      ${footerHtml}
      <script>
        window.PAGE_${pageNum}_SLOTS = ${rawSlotsJson};
      </script>
    </div>
  `;

  return { pageHtml };
}

export function wrapFullDocument(pagesHtml, title = 'Broadsheet E-Paper') {
  return `<!DOCTYPE html>
<html lang="hi">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Hind:wght@700&family=Mukta:wght@400;500;600;700;800;900&family=Noto+Sans+Devanagari:wght@400;600;700;800;900&family=Noto+Serif+Devanagari:wght@400;600;700;900&family=Poppins:wght@700;800;900&family=Rozha+One&family=Inter:wght@400;500;600;700;800;900&family=Merriweather:wght@400;700;900&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    html, body { margin: 0; padding: 0; background: #ffffff; font-family: 'Noto Serif Devanagari', 'Merriweather', serif; -webkit-font-smoothing: antialiased; }
    .broadsheet-page {
      width: 1344px;
      height: 2112px;
      max-height: 2112px;
      position: relative;
      background: #ffffff;
      padding: 8px 40px 40px 40px;
      box-sizing: border-box;
      overflow: hidden;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
      page-break-after: always;
      break-after: page;
    }
    .broadsheet-page:last-of-type,
    .broadsheet-page:last-child {
      page-break-after: avoid !important;
      break-after: avoid !important;
    }
    .broadsheet-story-text {
      font-family: 'Noto Serif Devanagari', 'Merriweather', serif;
      overflow: hidden;
      box-sizing: border-box;
      padding-right: 2px;
      padding-bottom: 0px;
      word-break: break-word;
      text-align: justify;
      text-justify: inter-word;
      white-space: pre-line !important;
      column-fill: auto !important;
      -webkit-column-fill: auto !important;
    }
    .broadsheet-story-text mark {
      background-color: #fef08a;
      padding: 1px 3px;
      border-radius: 2px;
      font-weight: 700;
    }
    .broadsheet-story-text p {
      margin-top: 0 !important;
      margin-bottom: var(--story-line-h, 1lh) !important;
      line-height: inherit !important;
    }
    .broadsheet-story-text p:last-child { margin-bottom: 0 !important; }
    @page { size: 1344px 2112px; margin: 0; }
  </style>
  <script>
${fs.readFileSync(layoutClientPath, "utf8")}
  </script>
</head>
<body>${pagesHtml}</body>
</html>`;
}

export function getChromeExecutablePath() {
  if (process.env.PUPPETEER_EXECUTABLE_PATH && fs.existsSync(process.env.PUPPETEER_EXECUTABLE_PATH)) {
    return process.env.PUPPETEER_EXECUTABLE_PATH;
  }
  if (process.env.CHROME_BIN && fs.existsSync(process.env.CHROME_BIN)) {
    return process.env.CHROME_BIN;
  }
  if (process.env.CHROME_PATH && fs.existsSync(process.env.CHROME_PATH)) {
    return process.env.CHROME_PATH;
  }

  const linuxPaths = [
    '/usr/bin/google-chrome-stable',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/snap/bin/chromium',
    '/opt/google/chrome/chrome',
    '/opt/google/chrome/google-chrome'
  ];

  const windowsPaths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    path.join(process.env.LOCALAPPDATA || '', 'Google', 'Chrome', 'Application', 'chrome.exe'),
    path.join(process.env.PROGRAMFILES || '', 'Google', 'Chrome', 'Application', 'chrome.exe'),
    path.join(process.env['PROGRAMFILES(X86)'] || '', 'Google', 'Chrome', 'Application', 'chrome.exe')
  ];

  const candidatePaths = process.platform === 'win32' ? windowsPaths : linuxPaths;

  for (const candidate of candidatePaths) {
    if (candidate && fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return undefined;
}

export async function launchBrowser() {
  const executablePath = getChromeExecutablePath();
  const launchOptions = {
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--font-render-hinting=medium',
      '--no-first-run',
      '--no-zygote',
      '--hide-scrollbars'
    ]
  };

  if (executablePath) {
    launchOptions.executablePath = executablePath;
  }

  return await puppeteer.launch(launchOptions);
}

async function waitForPageAssets(page) {
  try {
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    page.on('pageerror', err => console.warn('[Puppeteer PageError]:', err.message));

    // 1. Font readiness with safe timeout guard
    await page.evaluate(async () => {
      try {
        if (document.fonts && document.fonts.ready) {
          await Promise.race([
            document.fonts.ready,
            new Promise(res => setTimeout(res, 2500))
          ]);
        }
      } catch (fErr) {}
    });

    // 2. Explicitly trigger layout
    await page.evaluate(() => {
      try {
        if (typeof window.runEpaperLayout === 'function') {
          window.runEpaperLayout();
        }
      } catch (layoutErr) {
        console.error('runEpaperLayout invocation error:', layoutErr);
      }
    });

    // 3. Wait for slots layer to be populated or document ready
    await page.waitForFunction(() => {
      const layers = document.querySelectorAll('.slots-layer');
      if (!layers.length) return true;
      return Array.from(layers).some(layer => layer.children.length > 0) || document.readyState === 'complete';
    }, { timeout: 4000 }).catch(() => {});

    // 4. Safe image load waiting with timeout
    await page.evaluate(async () => {
      const images = Array.from(document.querySelectorAll('img'));
      await Promise.all(
        images.map(img => {
          if (img.complete && img.naturalWidth > 0) return Promise.resolve();
          return new Promise(resolve => {
            img.addEventListener('load', resolve, { once: true });
            img.addEventListener('error', resolve, { once: true });
            setTimeout(resolve, 4000);
          });
        })
      );
    });

    // Emulate screen media to guarantee exact layout and styling
    await page.emulateMediaType('screen');
  } catch (e) {
    console.warn('waitForPageAssets note:', e.message);
  }
}

export async function generateIssuePdf(opts) {
  const browser = await launchBrowser();

  try {
    const pdfDir = path.join(process.cwd(), 'public', 'uploads', 'pdfs');
    const pageImgDir = path.join(process.cwd(), 'public', 'uploads', 'epaper', 'pages');

    if (!fs.existsSync(pdfDir)) fs.mkdirSync(pdfDir, { recursive: true });
    if (!fs.existsSync(pageImgDir)) fs.mkdirSync(pageImgDir, { recursive: true });

    const editionSlug = opts.editionSlug || 'patna-main';
    const publishDate = opts.publishDate || 'today';
    const pages = opts.pages || [];
    const totalPages = Math.max(1, pages.length);

    const mergedPdf = await PDFDocument.create();
    const pageImageUrls = [];

    const pagesToRender = (pages && pages.length > 0) ? pages : [{ pageNumber: 1, slots: [] }];

    for (let pIdx = 0; pIdx < pagesToRender.length; pIdx++) {
      const pageObj = pagesToRender[pIdx];
      const pageNum = pageObj.pageNumber || (pIdx + 1);
      const { pageHtml } = buildPageFragment(opts, pageObj, pIdx);
      const singlePageHtml = wrapFullDocument(pageHtml, `${editionSlug} - Page ${pageNum}`);

      const page = await browser.newPage();
      try {
        await page.setViewport({ width: 1344, height: 2112, deviceScaleFactor: 2 });
        await page.setContent(singlePageHtml, { waitUntil: 'domcontentloaded' });
        await waitForPageAssets(page);

        // 1. Generate page thumbnail webp
        const pageImgFilename = `${editionSlug}-${publishDate}-page-${pageNum}.webp`;
        const pageImgPath = path.join(pageImgDir, pageImgFilename);
        await page.screenshot({
          path: pageImgPath,
          type: 'webp',
          quality: 90
        });

        pageImageUrls.push({
          pageNumber: pageNum,
          pageImage: `/uploads/epaper/pages/${pageImgFilename}`
        });

        // 2. Generate exact 1:1 single-page PDF (Screen-mode emulation)
        await page.emulateMediaType('screen');
        const pagePdfBuffer = await page.pdf({
          width: '1344px',
          height: '2112px',
          printBackground: true,
          preferCSSPageSize: true,
          margin: { top: 0, right: 0, bottom: 0, left: 0 }
        });

        // Append to mergedPdf
        const singleDoc = await PDFDocument.load(pagePdfBuffer);
        const copiedPages = await mergedPdf.copyPages(singleDoc, [0]);
        mergedPdf.addPage(copiedPages[0]);
      } catch (pageErr) {
        console.warn(`Error generating page ${pageNum}:`, pageErr.message);
      } finally {
        await page.close();
      }
    }

    // Save final merged PDF
    const pdfFilename = `epaper-${editionSlug}-${publishDate}-${Date.now()}.pdf`;
    const pdfPath = path.join(pdfDir, pdfFilename);
    const mergedPdfBytes = await mergedPdf.save();
    fs.writeFileSync(pdfPath, mergedPdfBytes);

    const latestPdfFilename = `epaper-${editionSlug}-${publishDate}.pdf`;
    const latestPdfPath = path.join(pdfDir, latestPdfFilename);
    fs.copyFileSync(pdfPath, latestPdfPath);

    return {
      pdfUrl: `/uploads/pdfs/${pdfFilename}`,
      publicUrl: `/uploads/pdfs/${pdfFilename}`,
      latestPdfUrl: `/uploads/pdfs/${latestPdfFilename}`,
      pageImages: pageImageUrls
    };
  } finally {
    await browser.close();
  }
}
