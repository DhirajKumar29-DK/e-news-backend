import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';

function formatHindiDateline(dateStr) {
  if (!dateStr) return 'मंगलवार • 6 अक्टूबर 2026';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const days = ['रविवार', 'सोमवार', 'मंगलवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार'];
  const months = ['जनवरी', 'फ़रवरी', 'मार्च', 'अप्रैल', 'मई', 'जून', 'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर'];

  const dayName = days[d.getDay()];
  const dateNum = d.getDate();
  const monthName = months[d.getMonth()];
  const year = d.getFullYear();

  return `${dayName} • ${dateNum} ${monthName} ${year}`;
}

function getSummaryLineHeight(fontSize) {
  const f = Math.round(Number(fontSize) || 14);
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
  const tagRegex = /(<[^>]+>|[^<>\s]+|\s+)/g;
  return html.match(tagRegex) || [];
}

function normalizeSlot(slot, pIdx, sIdx) {
  const width = Number(slot.width ?? slot.w ?? 400);
  const height = Number(slot.height ?? slot.h ?? 250);
  const x = Number(slot.x ?? 16);
  const y = Number(slot.y ?? 115);
  const sId = slot.id || `p${pIdx}-s${sIdx}`;

  const colsCount = Number(
    slot.columnsCount ?? slot.columnCount ?? slot.columns_count ?? slot.colsCount ?? slot.content?.columnsCount ?? (width >= 550 ? 2 : 1)
  );
  const colGap = Number(slot.columnGap ?? slot.column_gap ?? slot.content?.columnGap ?? 14);
  
  // NEVER force dividers on multi-column slots; strictly respect canvas setting
  const showDivider = Boolean(
    slot.showColumnDivider ?? slot.show_column_divider ?? slot.content?.showColumnDivider ?? false
  );

  const headline = slot.headline || slot.content?.headline || '';
  const subHeadline = slot.subHeadline || slot.content?.subHeadline || '';
  const summary = slot.summary || slot.contentText || slot.content?.body || slot.content?.summary || '';
  const imageUrl = slot.imageUrl || slot.content?.imageUrl || '';
  const categoryBadge = (slot.categoryBadge || slot.categoryTag || slot.content?.categoryBadge || slot.content?.categoryTag || '').trim();

  const headlineFontSize = Number(
    slot.headlineFontSize ?? slot.headline_font_size ?? slot.content?.headlineFontSize ?? 22
  );
  const headlineColor = slot.headlineColor || slot.headline_color || slot.content?.headlineColor || '#020617';

  const subHeadlineFontSize = Number(
    slot.subHeadlineFontSize ?? slot.sub_headline_font_size ?? slot.content?.subHeadlineFontSize ?? 13
  );
  const subHeadlineColor = slot.subHeadlineColor || slot.sub_headline_color || slot.content?.subHeadlineColor || '#b91c1c';

  const summaryFontSize = Number(
    slot.summaryFontSize ?? slot.summary_font_size ?? slot.bodyFontSize ?? slot.body_font_size ?? slot.content?.summaryFontSize ?? slot.content?.bodyFontSize ?? 14
  );
  const summaryColor = slot.summaryColor || slot.summary_color || slot.bodyTextColor || slot.content?.summaryColor || '#1e293b';

  const cardContentW = Math.max(100, width - 24);
  const hasImage = Boolean(imageUrl);
  const imageWidth = Number(slot.imageWidth || slot.content?.imageWidth || (colsCount > 1 ? Math.floor(cardContentW / colsCount) : 180));
  const imageHeight = Number(slot.imageHeight || slot.content?.imageHeight || 140);

  const normAlign = (slot.imageAlignment || slot.imageAlign || slot.content?.imageAlignment || 'Left').toLowerCase();
  const vertAlign = slot.imageVertAlign || slot.image_vert_align || slot.content?.imageVertAlign || 'top';
  const imageWrapMode = slot.imageWrapMode || slot.image_wrap_mode || slot.content?.imageWrapMode || 'auto';
  const imgPxX = slot.imgPxX !== undefined ? Number(slot.imgPxX) : (slot.content?.imgPxX !== undefined ? Number(slot.content.imgPxX) : undefined);

  let compSec = slot.computedSections || slot.content?.computedSections;
  if (!compSec && slot.subStories && typeof slot.subStories === 'string' && slot.subStories.includes('text1')) {
    try {
      compSec = JSON.parse(slot.subStories);
    } catch {}
  }

  return {
    ...slot,
    id: sId,
    width,
    height,
    x,
    y,
    colsCount,
    colGap,
    showDivider,
    headline,
    subHeadline,
    summary,
    imageUrl,
    categoryBadge,
    headlineFontSize,
    headlineColor,
    subHeadlineFontSize,
    subHeadlineColor,
    summaryFontSize,
    summaryColor,
    cardContentW,
    hasImage,
    imageWidth,
    imageHeight,
    normAlign,
    vertAlign,
    imageWrapMode,
    imgPxX,
    computedSections: compSec
  };
}

function computeSectionsFallback(s) {
  const colsCount = s.colsCount;
  const colGap = s.colGap;
  const cardH = s.height;
  const cardContentW = s.cardContentW;
  const showDivider = s.showDivider;

  const hasBadge = Boolean(s.categoryBadge);
  const badgeH = hasBadge ? 18 : 0;
  const hlFont = s.headlineFontSize;
  const subFont = s.subHeadlineFontSize;
  const summaryFont = s.summaryFontSize;
  const lineH = getSummaryLineHeight(summaryFont);

  const hlCharsPerLine = Math.max(12, Math.floor(cardContentW / (hlFont * 0.52)));
  const hlLines = s.headline ? Math.max(1, Math.ceil(s.headline.length / hlCharsPerLine)) : 0;
  const hlH = hlLines * hlFont * 1.25;

  const subCharsPerLine = Math.max(18, Math.floor(cardContentW / (subFont * 0.52)));
  const subLines = s.subHeadline ? Math.max(1, Math.ceil(s.subHeadline.length / subCharsPerLine)) : 0;
  const subH = subLines * subFont * 1.25;

  const cardFraming = 16;
  const headerTotalH = Math.ceil(badgeH + hlH + subH + cardFraming);
  const rawStoryH = Math.max(lineH, cardH - headerTotalH);
  const fullStoryH = Math.max(lineH, Math.floor(rawStoryH / lineH) * lineH);

  const imgW = s.imageWidth;
  const imgH = s.imageHeight;
  const isFullCardPhoto = imgW >= cardContentW - 30 || s.imageWrapMode === 'top-span';

  const rawUnderPhotoH = Math.max(lineH, fullStoryH - imgH - 8);
  const underPhotoH = Math.max(lineH, Math.floor(rawUnderPhotoH / lineH) * lineH);

  if (colsCount === 1 || isFullCardPhoto) {
    return {
      isFullWidth: true,
      text1: s.summary || '',
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
      showDivider,
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
  } else if (s.normAlign === 'left') {
    startCol = 0;
  } else if (s.normAlign === 'right') {
    startCol = maxStartCol;
  } else {
    startCol = 0;
  }

  const leftCols = startCol;
  const photoCols = spanCols;
  const rightCols = colsCount - (startCol + spanCols);

  const leftSectionW = leftCols > 0 ? (leftCols * singleColW) + ((leftCols - 1) * colGap) : 0;
  const photoSectionW = (photoCols * singleColW) + ((photoCols - 1) * colGap);
  const rightSectionW = rightCols > 0 ? (rightCols * singleColW) + ((rightCols - 1) * colGap) : 0;

  const tokens = sliceHtmlTokens(s.summary || '');
  const charsPerColLine = Math.max(8, Math.floor(singleColW / (summaryFont * 0.58)));
  const linesUnderPhoto = Math.max(1, Math.floor(underPhotoH / lineH));
  const linesFullCol = Math.max(1, Math.floor(fullStoryH / lineH));

  const capLeft = leftCols * linesFullCol * charsPerColLine;
  const capPhoto = photoCols * linesUnderPhoto * charsPerColLine;

  let curChar = 0;
  let text1Tokens = [];
  let text2Tokens = [];
  let text3Tokens = [];

  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i];
    const isTag = tok.startsWith('<');
    const len = isTag ? 0 : tok.length;

    if (leftCols > 0 && curChar < capLeft) {
      text1Tokens.push(tok);
      curChar += len;
    } else if (curChar < capLeft + capPhoto) {
      text2Tokens.push(tok);
      curChar += len;
    } else {
      text3Tokens.push(tok);
      curChar += len;
    }
  }

  return {
    isFullWidth: false,
    text1: text1Tokens.join(''),
    text2: text2Tokens.join(''),
    text2b: '',
    text3: text3Tokens.join(''),
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
    showDivider,
    startCol
  };
}

export function buildPageFragment(opts, pageObj, pIdx) {
  const { editionName, editionTitle, editionCity, editionState, publishDate } = opts;
  const formattedDate = formatHindiDateline(publishDate);
  const cityStr = editionCity || 'पटना';
  const mainTitle = editionTitle || (editionName ? (editionName.includes('पटना') ? editionName : `दैनिक ${editionName.replace(/edition/i, '').replace(/\(.*\)/g, '').trim()}`) : 'दैनिक पटना (मुख्य)');
  const stateStr = editionState || 'बिहार मुख्य संस्करण • पटना (मुख्य)';
  const pageNum = pageObj.pageNumber || (pIdx + 1);

  const rawSlots = pageObj.slots || [];

  const slotsHtml = rawSlots.map((rawSlot, sIdx) => {
    const slot = normalizeSlot(rawSlot, pIdx, sIdx);
    const {
      x, y, width: w, height: h, id: sId,
      colsCount, colGap, showDivider,
      headline, subHeadline, summary, imageUrl, categoryBadge,
      headlineFontSize, headlineColor,
      subHeadlineFontSize, subHeadlineColor,
      summaryFontSize, summaryColor,
      cardContentW, hasImage, imageWidth: imgW, imageHeight: imgH,
      normAlign, vertAlign, imageWrapMode, imgPxX
    } = slot;

    // Strict boundary clearance: slot never touches the bottom footer bar (at y=2072px)
    const safeH = Math.min(h, Math.max(100, 2065 - y));
    const lineH = getSummaryLineHeight(summaryFontSize);

    if (slot.isAd) {
      return `
        <div style="position: absolute; left: ${x}px; top: ${y}px; width: ${w}px; height: ${safeH}px; border: 2px dashed #d97706; padding: 12px; box-sizing: border-box; background: #fffbeb; border-radius: 8px; overflow: hidden; display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <span style="display: inline-block; background: #d97706; color: #ffffff; font-size: 9px; font-weight: 900; padding: 2px 6px; border-radius: 4px; text-transform: uppercase; margin-bottom: 6px;">SPONSORED AD</span>
            <h3 style="font-family: 'Noto Serif Devanagari', 'Merriweather', serif; font-size: ${headlineFontSize}px; font-weight: 800; color: ${headlineColor}; margin: 0 0 4px 0; line-height: 1.25;">${headline}</h3>
            <p style="font-family: 'Mukta', 'Inter', sans-serif; font-size: ${subHeadlineFontSize}px; font-weight: 700; color: ${subHeadlineColor}; margin: 0 0 6px 0; line-height: 1.3;">${subHeadline}</p>
            <div class="broadsheet-story-text" style="font-family: 'Noto Serif Devanagari', 'Merriweather', serif; font-size: ${summaryFontSize}px; color: ${summaryColor}; line-height: ${lineH}px; text-align: justify; overflow: hidden; box-sizing: border-box; padding-right: 2px;">${summary}</div>
          </div>
        </div>
      `;
    }

    const tagHtml = categoryBadge
      ? `<div style="margin-bottom: 1px; display: flex; align-items: center;"><span style="display: inline-block; background-color: #dc2626; color: #ffffff; font-size: 9.5px; font-weight: 700; padding: 1px 6px; text-transform: uppercase; border-radius: 3px; font-family: 'Inter', sans-serif; letter-spacing: 0.5px; line-height: 1;">${categoryBadge}</span></div>`
      : '';

    const headlineHtml = headline
      ? `<h2 style="font-family: 'Noto Serif Devanagari', 'Merriweather', serif; font-size: ${headlineFontSize}px; color: ${headlineColor}; line-height: 1.25; font-weight: 900; margin: 0; word-break: break-word;">${headline}</h2>`
      : '';

    const subHeadlineHtml = subHeadline
      ? `<p style="font-family: 'Mukta', 'Inter', sans-serif; font-size: ${subHeadlineFontSize}px; color: ${subHeadlineColor}; line-height: 1.25; font-weight: 700; margin: 1px 0 0 0; text-align: justify; word-break: break-word;">${subHeadline}</p>`
      : '';

    const comp = (slot.computedSections && typeof slot.computedSections === 'object' && slot.computedSections.text1 !== undefined)
      ? slot.computedSections
      : computeSectionsFallback({ ...slot, height: safeH });

    // Baseline integer line snapping: prevents partial lines from being cut off horizontally
    const fullStoryH = Math.max(lineH, Math.floor((comp.fullStoryH || (safeH - 60)) / lineH) * lineH);
    const underPhotoH = Math.max(lineH, Math.floor((comp.underPhotoH || Math.max(lineH, fullStoryH - imgH - 8)) / lineH) * lineH);

    const tokens = sliceHtmlTokens(summary || '');
    const tokensJson = JSON.stringify(tokens).replace(/</g, '\\u003c');

    let bodyContentHtml = '';

    if (!hasImage) {
      bodyContentHtml = `
        <div class="broadsheet-story-text" style="column-count: ${colsCount > 1 ? colsCount : 'auto'}; column-gap: ${colGap}px; column-rule: ${showDivider ? '1px solid #cbd5e1' : 'none'}; column-fill: auto; width: 100%; flex: 1; min-height: 0; height: 100%; overflow: hidden; font-family: 'Noto Serif Devanagari', 'Merriweather', serif; font-size: ${summaryFontSize}px; color: ${summaryColor}; line-height: ${lineH}px; text-align: justify; text-justify: inter-word; word-break: break-word; white-space: pre-line; box-sizing: border-box; padding-right: 2px;">
          ${summary}
        </div>
      `;
    } else if (comp.isFullWidth || colsCount === 1) {
      const isTopSpanPhoto = imageWrapMode === 'top-span' || imgW >= cardContentW - 30;
      const currentImgW = isTopSpanPhoto ? cardContentW : Math.min(imgW, cardContentW);
      const maxPxX = Math.max(0, cardContentW - currentImgW);

      let photoPxX = 0;
      if (isTopSpanPhoto) {
        photoPxX = 0;
      } else if (imgPxX !== undefined) {
        photoPxX = Math.max(0, Math.min(maxPxX, imgPxX));
      } else if (normAlign === 'left') {
        photoPxX = 0;
      } else if (normAlign === 'right') {
        photoPxX = maxPxX;
      } else {
        photoPxX = 0;
      }

      const photoDiv = `
        <div style="width: 100%; margin-bottom: 4px; flex-shrink: 0;">
          <div style="width: ${isTopSpanPhoto ? '100%' : `${currentImgW}px`}; height: ${imgH}px; margin-left: ${photoPxX}px; overflow: hidden; border-radius: 6px; border: 2px solid #cbd5e1; background: #0f172a;">
            <img src="${imageUrl}" style="width: 100%; height: 100%; object-fit: cover; display: block;" />
          </div>
        </div>
      `;

      const textDiv = `
        <div class="broadsheet-story-text" style="column-count: ${colsCount > 1 ? colsCount : 'auto'}; column-gap: ${colGap}px; column-rule: ${showDivider ? '1px solid #cbd5e1' : 'none'}; column-fill: auto; width: 100%; flex: 1; min-height: 0; height: 100%; overflow: hidden; font-family: 'Noto Serif Devanagari', 'Merriweather', serif; font-size: ${summaryFontSize}px; color: ${summaryColor}; line-height: ${lineH}px; text-align: justify; text-justify: inter-word; word-break: break-word; white-space: pre-line; box-sizing: border-box; padding-right: 2px; flex-shrink: 0;">
          ${comp.text1 || summary}
        </div>
      `;

      bodyContentHtml = vertAlign === 'bottom'
        ? `<div style="display: flex; flex-direction: column; width: 100%; flex: 1; min-height: 0; height: 100%; overflow: hidden;">${textDiv}${photoDiv}</div>`
        : `<div style="display: flex; flex-direction: column; width: 100%; height: ${fullStoryH}px; max-height: ${fullStoryH}px; overflow: hidden;">${photoDiv}${textDiv}</div>`;
    } else {
      // 100% Broadsheet Multi-Column Engine matching Canvas exactly
      const leftCols = comp.leftCols;
      const photoCols = comp.photoCols;
      const rightCols = comp.rightCols;
      const leftSectionW = comp.leftSectionW;
      const photoSectionW = comp.photoSectionW;
      const rightSectionW = comp.rightSectionW;

      const displayImgW = Math.max(30, Math.min(imgW, photoSectionW));
      const localMaxPxX = Math.max(0, photoSectionW - displayImgW);
      let localPhotoPxX = 0;
      if (imgPxX !== undefined) {
        const sectionStartX = leftCols > 0 ? (leftCols * comp.singleColW) + (leftCols * colGap) : 0;
        localPhotoPxX = Math.max(0, Math.min(localMaxPxX, imgPxX - sectionStartX));
      } else if (normAlign === 'left') {
        localPhotoPxX = 0;
      } else if (normAlign === 'right') {
        localPhotoPxX = localMaxPxX;
      } else {
        localPhotoPxX = 0;
      }

      const photoDiv = `
        <div style="width: 100%; margin-bottom: 6px; flex-shrink: 0;">
          <div style="width: ${imgW < photoSectionW ? `${displayImgW}px` : '100%'}; height: ${imgH}px; margin-left: ${imgW < photoSectionW ? `${localPhotoPxX}px` : '0px'}; overflow: hidden; border-radius: 6px; border: 2px solid #cbd5e1; background: #0f172a;">
            <img src="${imageUrl}" style="width: 100%; height: 100%; object-fit: cover; display: block;" />
          </div>
        </div>
      `;

      const colStyleCommon = `font-family: 'Noto Serif Devanagari', 'Merriweather', serif; font-size: ${summaryFontSize}px; color: ${summaryColor}; line-height: ${lineH}px; text-align: justify; text-justify: inter-word; word-break: break-word; white-space: pre-line; box-sizing: border-box; padding-right: 2px;`;

      bodyContentHtml = `
        <div
          class="broadsheet-engine"
          data-slot-id="${sId}"
          data-left-cols="${leftCols}"
          data-photo-cols="${photoCols}"
          data-right-cols="${rightCols}"
          data-left-w="${leftSectionW}"
          data-photo-w="${photoSectionW}"
          data-right-w="${rightSectionW}"
          data-full-h="${fullStoryH}"
          data-under-h="${underPhotoH}"
          data-font-size="${summaryFontSize}"
          data-col-gap="${colGap}"
          data-valign="${vertAlign}"
          data-img-h="${imgH}"
          style="display: flex; gap: ${colGap}px; width: 100%; flex: 1; min-height: 0; height: 100%; overflow: hidden; align-items: stretch;"
        >
          ${leftCols > 0 ? `
            <div id="slot-col-left-${sId}" class="broadsheet-story-text" style="width: ${leftSectionW}px; flex: 1; min-height: 0; height: 100%; column-count: ${leftCols > 1 ? leftCols : 'auto'}; column-gap: ${colGap}px; column-rule: ${showDivider ? '1px solid #cbd5e1' : 'none'}; column-fill: auto; overflow: hidden; ${colStyleCommon} flex-shrink: 0;">${(comp.text1 || '').trim()}</div>
            ${showDivider ? '<div style="width: 1px; min-width: 1px; height: 100%; background-color: #cbd5e1; border-left: 1px solid #cbd5e1; flex-shrink: 0;"></div>' : ''}
          ` : ''}

          <div id="slot-sec-photo-${sId}" style="width: ${photoSectionW}px; flex: 1; min-height: 0; height: 100%; display: flex; flex-direction: column; overflow: hidden; flex-shrink: 0;">
            ${vertAlign === 'bottom' ? `
              <div id="slot-col-photo-${sId}" class="broadsheet-story-text" style="width: 100%; flex: 1; min-height: 0; column-count: ${photoCols > 1 ? photoCols : 'auto'}; column-gap: ${colGap}px; column-rule: ${showDivider ? '1px solid #cbd5e1' : 'none'}; column-fill: auto; overflow: hidden; ${colStyleCommon} margin-bottom: 6px; flex-shrink: 0;">${(comp.text2 || '').trim()}</div>
              ${photoDiv}
            ` : vertAlign === 'middle' ? `
              <div id="slot-col-photo-${sId}" class="broadsheet-story-text" style="width: 100%; height: ${Math.floor(underPhotoH / 2)}px; max-height: ${Math.floor(underPhotoH / 2)}px; column-count: ${photoCols > 1 ? photoCols : 'auto'}; column-gap: ${colGap}px; column-rule: ${showDivider ? '1px solid #cbd5e1' : 'none'}; column-fill: auto; overflow: hidden; ${colStyleCommon} margin-bottom: 6px; flex: none;">
                ${comp.text2 || ''}
              </div>
              ${photoDiv}
              <div id="slot-col-photo-b-${sId}" class="broadsheet-story-text" style="width: 100%; height: ${Math.ceil(underPhotoH / 2)}px; max-height: ${Math.ceil(underPhotoH / 2)}px; column-count: ${photoCols > 1 ? photoCols : 'auto'}; column-gap: ${colGap}px; column-rule: ${showDivider ? '1px solid #cbd5e1' : 'none'}; column-fill: auto; overflow: hidden; ${colStyleCommon} margin-top: 6px; flex: 1;">
                ${comp.text2b || ''}
              </div>
            ` : `
              ${photoDiv}<div id="slot-col-photo-${sId}" class="broadsheet-story-text" style="width: 100%; flex: 1; min-height: 0; column-count: ${photoCols > 1 ? photoCols : 'auto'}; column-gap: ${colGap}px; column-rule: ${showDivider ? '1px solid #cbd5e1' : 'none'}; column-fill: auto; overflow: hidden; ${colStyleCommon} flex-shrink: 0;">${(comp.text2 || '').trim()}</div>
            `}
          </div>

          ${rightCols > 0 ? `
            ${showDivider ? '<div style="width: 1px; min-width: 1px; height: 100%; background-color: #cbd5e1; border-left: 1px solid #cbd5e1; flex-shrink: 0;"></div>' : ''}
            <div id="slot-col-right-${sId}" class="broadsheet-story-text" style="width: ${rightSectionW}px; flex: 1; min-height: 0; height: 100%; column-count: ${rightCols > 1 ? rightCols : 'auto'}; column-gap: ${colGap}px; column-rule: ${showDivider ? '1px solid #cbd5e1' : 'none'}; column-fill: auto; overflow: hidden; ${colStyleCommon} flex-shrink: 0;">${(comp.text3 || '').trim()}</div>
          ` : ''}

          <script type="application/json" id="slot-tokens-data-${sId}">${tokensJson}</script>
        </div>
      `;
    }

    return `
      <div
        id="slot-container-${sId}"
        style="position: absolute; left: ${x}px; top: ${y}px; width: ${w}px; height: ${safeH}px; border: none; padding: 8px 8px 4px 8px; box-sizing: border-box; background: transparent; overflow: hidden; display: flex; flex-direction: column;"
      >
        <div id="slot-header-${sId}" style="margin-bottom: 2px; flex-shrink: 0;">
          ${tagHtml}
          ${headlineHtml}
          ${subHeadlineHtml}
        </div>
        <div id="slot-body-${sId}" style="flex: 1; min-height: 0; overflow: hidden; width: 100%;">
          ${bodyContentHtml}
        </div>
      </div>
    `;
  }).join('');

  const pageHtml = `
    <div class="broadsheet-page">
      <!-- TOP DATE LINE BAR -->
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1.5px solid #0f172a; padding-bottom: 2px; margin-bottom: 2px; font-size: 12px; font-weight: 700; color: #1e293b; font-family: 'Mukta', 'Inter', sans-serif; line-height: 1.15;">
        <div>${cityStr} • ${formattedDate}</div>
        <div style="font-style: italic; color: #475569; font-family: 'Noto Serif Devanagari', 'Merriweather', serif;">डिजिटल संस्करण • epaper</div>
        <div>पेज 0${pageNum}</div>
      </div>

      <!-- BIG RED BROADSHEET MASTHEAD -->
      <header style="text-align: center; border-bottom: 4px double #0f172a; padding-bottom: 4px; margin-bottom: 0px;">
        <h1 style="font-size: 68px; font-family: 'Noto Serif Devanagari', 'Merriweather', serif; font-weight: 900; color: #dc2626; margin: 0; line-height: 0.95; letter-spacing: -1px;">
          ${mainTitle}
        </h1>
        <div style="display: flex; justify-content: center; align-items: center; gap: 8px; margin-top: 4px;">
          <span style="display: inline-block; background-color: #f59e0b; color: #020617; font-size: 10px; font-weight: 900; padding: 1px 6px; border-radius: 3px; font-family: 'Inter', sans-serif; letter-spacing: 0.5px;">FREE-FORM CANVAS</span>
          <span style="font-size: 11px; font-weight: 700; color: #1e293b; font-family: 'Mukta', sans-serif;">• ${stateStr}</span>
        </div>
      </header>

      <!-- SLOTS DIRECT ON BROADSHEET CANVAS (EXACT 1:1 REPLICA OF ADMIN CANVAS & WEBSITE MODAL) -->
      ${slotsHtml}

      <!-- FOOTER -->
      <footer style="position: absolute; bottom: 12px; left: 40px; right: 40px; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #cbd5e1; padding-top: 4px; font-size: 10px; font-family: 'Mukta', 'Inter', sans-serif; color: #64748b;">
        <span>दैनिक समाचार पत्र • डिजिटल ई-संस्करण • ${stateStr}</span>
        <span>पेज 0${pageNum}</span>
      </footer>
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
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Merriweather:wght@400;700;900&family=Mukta:wght@400;500;600;700;800&family=Noto+Serif+Devanagari:wght@400;600;700;900&display=swap" rel="stylesheet">
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      margin: 0;
      padding: 0;
      background: #fffdf7;
      font-family: 'Noto Serif Devanagari', 'Merriweather', serif;
      -webkit-font-smoothing: antialiased;
    }
    p, span, div, h1, h2, h3, h4, h5, h6 {
      margin: 0;
      padding: 0;
    }
    mark {
      background-color: #fef08a !important;
      color: #0f172a !important;
      padding: 1px 4px !important;
      border-radius: 3px !important;
      font-weight: 700 !important;
      display: inline !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    b, strong {
      font-weight: 800 !important;
      color: #020617 !important;
    }
    .broadsheet-story-text {
      font-family: 'Noto Serif Devanagari', 'Merriweather', serif;
      overflow: hidden;
      box-sizing: border-box;
      padding-right: 2px;
      word-break: break-word;
      text-align: justify;
      text-justify: inter-word;
    }
    @page {
      size: 1344px 2112px;
      margin: 0;
    }
    .broadsheet-page {
      width: 1344px;
      height: 2112px;
      position: relative;
      background: #fffdf7;
      padding: 40px;
      box-sizing: border-box;
      overflow: hidden;
      page-break-after: always;
    }
    .broadsheet-page:last-child {
      page-break-after: avoid;
    }
  </style>
</head>
<body>
  ${pagesHtml}

</body>
</html>`;
}

export async function generateIssuePdf(opts) {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--font-render-hinting=medium',
      '--disable-gpu'
    ]
  });

  try {
    const pdfDir = path.join(process.cwd(), 'public', 'uploads', 'pdfs');
    const pageImgDir = path.join(process.cwd(), 'public', 'uploads', 'epaper', 'pages');

    if (!fs.existsSync(pdfDir)) fs.mkdirSync(pdfDir, { recursive: true });
    if (!fs.existsSync(pageImgDir)) fs.mkdirSync(pageImgDir, { recursive: true });

    const editionSlug = opts.editionSlug || 'patna-main';
    const publishDate = opts.publishDate || 'today';
    const pages = opts.pages || [];
    const pageImageUrls = [];

    const allPagesFragments = [];

    for (let pIdx = 0; pIdx < pages.length; pIdx++) {
      const pageObj = pages[pIdx];
      const pageNum = pageObj.pageNumber || (pIdx + 1);

      const { pageHtml } = buildPageFragment(opts, pageObj, pIdx);
      allPagesFragments.push(pageHtml);

      // Render individual single page for high-res screenshot (WebP)
      const singleDocHtml = wrapFullDocument(pageHtml, `Page ${pageNum} - ${editionSlug}`);
      const singlePage = await browser.newPage();
      await singlePage.setViewport({ width: 1344, height: 2112, deviceScaleFactor: 2 });
      await singlePage.setContent(singleDocHtml, { waitUntil: 'networkidle0' });

      // Ensure all web fonts are loaded
      await singlePage.evaluateHandle('document.fonts.ready');
      // Layout runs purely on exact pre-computed canvas sections

      const pageImgFilename = `${editionSlug}-${publishDate}-page-${pageNum}.webp`;
      const pageImgPath = path.join(pageImgDir, pageImgFilename);

      await singlePage.screenshot({
        path: pageImgPath,
        type: 'webp',
        quality: 98,
        clip: { x: 0, y: 0, width: 1344, height: 2112 }
      });

      await singlePage.close();

      pageImageUrls.push({
        pageNumber: pageNum,
        pageImage: `/uploads/epaper/pages/${pageImgFilename}`
      });
    }

    // Compile full multi-page PDF
    const fullDocHtml = wrapFullDocument(allPagesFragments.join('\n'), `${editionSlug} - ${publishDate}`);
    const fullPdfPage = await browser.newPage();
    await fullPdfPage.setViewport({ width: 1344, height: 2112, deviceScaleFactor: 2 });
    await fullPdfPage.setContent(fullDocHtml, { waitUntil: 'networkidle0' });
    await fullPdfPage.evaluateHandle('document.fonts.ready');
    // Layout runs purely on exact pre-computed canvas sections

    const pdfFilename = `epaper-${editionSlug}-${publishDate}-${Date.now()}.pdf`;
    const pdfPath = path.join(pdfDir, pdfFilename);

    await fullPdfPage.pdf({
      path: pdfPath,
      width: '1344px',
      height: '2112px',
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 }
    });

    // Also maintain a fixed latest copy for reliable downloading
    const latestPdfFilename = `epaper-${editionSlug}-${publishDate}.pdf`;
    const latestPdfPath = path.join(pdfDir, latestPdfFilename);
    fs.copyFileSync(pdfPath, latestPdfPath);

    await fullPdfPage.close();

    return {
      pdfUrl: `/uploads/pdfs/${pdfFilename}`,
      latestPdfUrl: `/uploads/pdfs/${latestPdfFilename}`,
      pageImages: pageImageUrls
    };
  } finally {
    await browser.close();
  }
}
