import puppeteer from "puppeteer";
import { PrismaClient } from "@prisma/client";
import { generateIssuePdfService } from "./src/modules/epaper/epaper.service.js";

const prisma = new PrismaClient();

async function run() {
  const issue = await prisma.paperIssue.findFirst({
    where: { publishDate: new Date('2026-10-16T00:00:00.000Z') },
    include: {
      pages: {
        include: {
          slots: true
        }
      }
    }
  });

  if (!issue) {
    console.log("Issue not found");
    return;
  }

  // Use Puppeteer to compute exact DOM token fit for every slot just like EPaperModal.tsx
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  await page.setViewport({ width: 1344, height: 2112, deviceScaleFactor: 2 });
  await page.setContent(`<!DOCTYPE html><html><head>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Merriweather:wght@400;700;900&family=Mukta:wght@400;500;600;700;800&family=Noto+Serif+Devanagari:wght@400;600;700;900&display=swap" rel="stylesheet">
  <style>body { font-family: 'Noto Serif Devanagari', 'Merriweather', serif; }</style>
  </head><body><div id="m" style="position:fixed;left:-9999px;top:-9999px;visibility:hidden;"></div></body></html>`);
  await page.evaluateHandle('document.fonts.ready');

  const enrichedPages = [];

  for (const pg of issue.pages) {
    const enrichedSlots = [];
    for (const rawSlot of pg.slots) {
      const comp = await page.evaluate((s) => {
        function getSummaryLineHeight(f) {
          f = Math.round(Number(f) || 14);
          if (f <= 12) return 17;
          if (f === 13) return 19;
          if (f === 14) return 21;
          if (f === 15) return 22;
          if (f === 16) return 24;
          if (f === 17) return 25;
          if (f === 18) return 26;
          return Math.round(f * 1.47);
        }
        function sliceHtmlTokens(html) {
          if (!html) return [];
          var tagRegex = /(<[^>]+>|[^\s<]+|\s+)/g;
          return html.match(tagRegex) || [];
        }
        function buildHtmlFromTokens(tokens, startIdx, endIdx) {
          if (!tokens || tokens.length === 0 || startIdx >= tokens.length || startIdx >= endIdx) return '';
          return tokens.slice(startIdx, endIdx).join('');
        }

        const div = document.getElementById('m');
        function findBestTokenFit(tokens, startTokenIdx, width, height, cols, fontSize, colGap) {
          if (startTokenIdx >= tokens.length) return tokens.length;
          const targetW = Math.max(50, width);
          const targetH = Math.max(20, height);
          const lineH = getSummaryLineHeight(fontSize);

          div.style.width = targetW + 'px';
          if (cols > 1) {
            div.style.height = targetH + 'px';
            div.style.maxHeight = targetH + 'px';
            div.style.columnCount = cols;
            div.style.columnGap = colGap + 'px';
            div.style.columnFill = 'auto';
          } else {
            div.style.height = 'auto';
            div.style.maxHeight = 'none';
            div.style.columnCount = 'unset';
            div.style.columnGap = 'unset';
            div.style.columnFill = 'unset';
          }
          div.style.fontSize = fontSize + 'px';
          div.style.fontFamily = "'Noto Serif Devanagari', 'Merriweather', serif";
          div.style.lineHeight = lineH + 'px';
          div.style.textAlign = 'justify';
          div.style.textJustify = 'inter-word';
          div.style.wordBreak = 'break-word';
          div.style.overflow = 'hidden';
          div.style.boxSizing = 'border-box';
          div.style.padding = '0';
          div.style.margin = '0';
          div.style.whiteSpace = 'pre-line';

          div.innerHTML = buildHtmlFromTokens(tokens, startTokenIdx, tokens.length);
          const fitsAll = cols === 1
            ? (div.scrollHeight <= targetH)
            : (div.scrollWidth <= targetW && div.scrollHeight <= targetH + 1);

          if (fitsAll) return tokens.length;

          let low = startTokenIdx + 1;
          let high = tokens.length;
          let bestFit = startTokenIdx;
          while (low <= high) {
            const mid = Math.floor((low + high) / 2);
            div.innerHTML = buildHtmlFromTokens(tokens, startTokenIdx, mid);
            const fits = cols === 1
              ? (div.scrollHeight <= targetH)
              : (div.scrollWidth <= targetW && div.scrollHeight <= targetH + 1);

            if (fits) {
              bestFit = mid;
              low = mid + 1;
            } else {
              high = mid - 1;
            }
          }
          return Math.max(startTokenIdx + 1, bestFit);
        }

        const cardContentW = Math.max(100, s.width - 24);
        const colGap = s.columnGap || 14;
        const colsCount = Number(s.columnsCount ?? s.columnCount ?? 1);
        const hlFont = s.headlineFontSize ? Number(s.headlineFontSize) : 22;
        const subFont = s.subHeadlineFontSize ? Number(s.subHeadlineFontSize) : 13;
        const summaryFont = Number(s.summaryFontSize ?? s.bodyFontSize ?? 14);
        const lineH = getSummaryLineHeight(summaryFont);

        div.style.width = cardContentW + 'px';
        div.style.height = 'auto';
        div.style.maxHeight = 'none';
        div.style.columnCount = 'unset';
        const hasBadge = Boolean((s.categoryBadge || s.categoryTag)?.trim());
        const badgeHtml = hasBadge ? `<div style="margin-bottom:2px"><span style="font-size:9.5px;padding:2px 6px">${(s.categoryBadge || s.categoryTag).trim()}</span></div>` : '';
        const hlHtml = `<h2 style="font-family:'Noto Serif Devanagari','Merriweather',serif;font-size:${hlFont}px;font-weight:900;line-height:1.25">${s.headline || ''}</h2>`;
        const subHtml = s.subHeadline ? `<p style="font-family:'Mukta','Inter',sans-serif;font-size:${subFont}px;font-weight:bold;line-height:1.25;margin:2px 0">${s.subHeadline}</p>` : '';
        div.innerHTML = `<div style="display:flex;flex-direction:column;gap:2px">${badgeHtml}${hlHtml}${subHtml}</div>`;
        const measuredH = div.offsetHeight;
        const cardFraming = 14;
        const headerTotalH = Math.ceil(measuredH + cardFraming);
        const rawStoryH = Math.max(lineH, s.height - headerTotalH);
        const fullStoryH = Math.max(lineH, Math.floor(rawStoryH / lineH) * lineH);

        const imgW = s.imageWidth || 180;
        const imgH = s.imageHeight || 140;
        const isFullCardPhoto = imgW >= cardContentW - 30 || s.imageWrapMode === 'top-span';
        const rawUnderPhotoH = Math.max(lineH, fullStoryH - imgH - 8);
        const underPhotoH = Math.max(lineH, Math.floor(rawUnderPhotoH / lineH) * lineH);

        const summaryText = s.summary || s.contentText || '';
        const tokens = sliceHtmlTokens(summaryText);

        if (colsCount === 1 || isFullCardPhoto || !s.imageUrl) {
          const targetH = isFullCardPhoto ? underPhotoH : fullStoryH;
          const fit1 = findBestTokenFit(tokens, 0, cardContentW, targetH, colsCount, summaryFont, colGap);
          return {
            isFullWidth: true,
            text1: buildHtmlFromTokens(tokens, 0, fit1),
            text2: '',
            text2b: '',
            text3: '',
            leftCols: 0,
            photoCols: colsCount,
            rightCols: 0,
            leftSectionW: 0,
            photoSectionW: cardContentW,
            rightSectionW: 0,
            underPhotoH,
            fullStoryH,
            colsCount,
            colGap,
            singleColW: cardContentW,
            showDivider: false,
            startCol: 0
          };
        }

        const singleColW = Math.max(60, Math.floor((cardContentW - (colGap * (colsCount - 1))) / colsCount));
        const colStep = singleColW + colGap;
        const spanCols = Math.min(colsCount - 1, Math.max(1, Math.round((imgW + (colGap * 0.5)) / colStep)));
        const maxStartCol = Math.max(0, colsCount - spanCols);
        let startCol = 0;
        if (s.imgPxX !== undefined && maxStartCol >= 1) {
          startCol = Math.max(0, Math.min(maxStartCol, Math.round(s.imgPxX / colStep)));
        } else if ((s.imageAlignment || s.imageAlign || '').toLowerCase() === 'right') {
          startCol = maxStartCol;
        }

        const leftCols = startCol;
        const photoCols = spanCols;
        const rightCols = colsCount - (startCol + spanCols);
        const leftSectionW = leftCols > 0 ? (leftCols * singleColW) + ((leftCols - 1) * colGap) : 0;
        const photoSectionW = (photoCols * singleColW) + ((photoCols - 1) * colGap);
        const rightSectionW = rightCols > 0 ? (rightCols * singleColW) + ((rightCols - 1) * colGap) : 0;

        let curIdx = 0;
        let text1 = '';
        let text2 = '';
        let text3 = '';

        if (leftCols > 0) {
          const fit1 = findBestTokenFit(tokens, curIdx, leftSectionW, fullStoryH, leftCols, summaryFont, colGap);
          text1 = buildHtmlFromTokens(tokens, curIdx, fit1);
          curIdx = fit1;
        }

        if (curIdx < tokens.length) {
          const fit2 = findBestTokenFit(tokens, curIdx, photoSectionW, underPhotoH, photoCols, summaryFont, colGap);
          text2 = buildHtmlFromTokens(tokens, curIdx, fit2);
          curIdx = fit2;
        }

        if (rightCols > 0 && curIdx < tokens.length) {
          const fit3 = findBestTokenFit(tokens, curIdx, rightSectionW, fullStoryH, rightCols, summaryFont, colGap);
          text3 = buildHtmlFromTokens(tokens, curIdx, fit3);
        }

        return {
          isFullWidth: false,
          text1,
          text2,
          text2b: '',
          text3,
          leftCols,
          photoCols,
          rightCols,
          leftSectionW,
          photoSectionW,
          rightSectionW,
          underPhotoH,
          fullStoryH,
          colsCount,
          colGap,
          singleColW,
          showDivider: Boolean(s.showColumnDivider || s.showColumnDividers),
          startCol
        };
      }, rawSlot);

      enrichedSlots.push({
        ...rawSlot,
        computedSections: comp
      });
    }

    enrichedPages.push({
      ...pg,
      slots: enrichedSlots
    });
  }

  await browser.close();

  // Print Dipke slot computed sections
  const dipkeSlot = enrichedPages[0].slots.find(s => s.headline && s.headline.includes("Abhijit Dipke"));
  if (dipkeSlot) {
    console.log("=== ENRICHED DIPKE SLOT COMPUTED SECTIONS ===");
    console.log("text1 END:\n", dipkeSlot.computedSections.text1.slice(-80));
    console.log("text2 START:\n", dipkeSlot.computedSections.text2.slice(0, 80));
    console.log("text2 END:\n", dipkeSlot.computedSections.text2.slice(-80));
    console.log("text3 START:\n", dipkeSlot.computedSections.text3.slice(0, 80));
    console.log("text3 END:\n", dipkeSlot.computedSections.text3.slice(-80));
  }

  console.log("Generating matching PDF via Puppeteer...");
  const res = await generateIssuePdfService({
    editionSlug: 'patna-main',
    publishDate: '2026-10-16',
    pages: enrichedPages
  });
  console.log("Result PDF URL:", res.pdfUrl);
}

run().catch(console.error).finally(() => prisma.$disconnect());
