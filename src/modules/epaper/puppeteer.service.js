import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';

function formatHindiDateline(dateStr) {
  if (!dateStr) return 'पटना • 24 अक्टूबर 2026';
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

function sliceHtmlTokens(html) {
  if (!html) return [];
  const tagRegex = /(<[^>]+>|[^<>\s]+|\s+)/g;
  return html.match(tagRegex) || [];
}

function buildPageFragment(opts, pageObj, pIdx) {
  const { editionName, editionTitle, editionCity, editionState, publishDate } = opts;
  const formattedDate = formatHindiDateline(publishDate);
  const cityStr = editionCity || 'पटना';
  const mainTitle = editionTitle || (editionName ? (editionName.includes('पटना') ? editionName : `अपना ${editionName.replace(/edition/i, '').replace(/\(.*\)/g, '').trim()}`) : 'अपना पटना');
  const stateStr = editionState || 'बिहार मुख्य संस्करण';
  const pageNum = pageObj.pageNumber || (pIdx + 1);

  const slots = pageObj.slots || [];
  const slotTokensList = [];

  const slotsHtml = slots.map((slot, sIdx) => {
    const x = slot.x ?? 16;
    const y = slot.y ?? 115;
    const w = slot.width ?? 400;
    const h = slot.height ?? 250;
    const sId = slot.id || `p${pIdx}-s${sIdx}`;

    if (slot.isAd) {
      return `
        <div style="position: absolute; left: ${x}px; top: ${y}px; width: ${w}px; height: ${h}px; border: 2px dashed #d97706; padding: 12px; box-sizing: border-box; background: #fffbeb; border-radius: 8px; overflow: hidden; display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <span style="display: inline-block; background: #d97706; color: #ffffff; font-size: 9px; font-weight: 900; padding: 2px 6px; border-radius: 4px; text-transform: uppercase; margin-bottom: 6px;">SPONSORED AD</span>
            <h3 style="font-family: 'Noto Serif Devanagari', 'Merriweather', serif; font-size: ${slot.headlineFontSize || 22}px; font-weight: 800; color: ${slot.headlineColor || '#1e3a8a'}; margin: 0 0 4px 0; line-height: 1.25;">${slot.headline || ''}</h3>
            <p style="font-family: 'Mukta', 'Inter', sans-serif; font-size: ${slot.subHeadlineFontSize || 16}px; font-weight: 700; color: ${slot.subHeadlineColor || '#b91c1c'}; margin: 0 0 6px 0; line-height: 1.3;">${slot.subHeadline || ''}</p>
            <div class="broadsheet-story-text" style="font-family: 'Noto Serif Devanagari', 'Merriweather', serif; font-size: ${slot.summaryFontSize || slot.bodyFontSize || 10.5}px; color: ${slot.summaryColor || slot.bodyTextColor || '#334155'}; line-height: 1.35; text-align: justify;">${slot.contentText || slot.summary || ''}</div>
          </div>
        </div>
      `;
    }

    // Category Tag / Badge (Matches Canvas 100%)
    const tagStr = (slot.categoryBadge || slot.categoryTag || '').trim();
    const tagHtml = tagStr
      ? `<div style="margin-bottom: 4px; display: flex; align-items: center;"><span style="display: inline-block; background-color: #dc2626; color: #ffffff; font-size: 9.5px; font-weight: 700; padding: 2px 6px; text-transform: uppercase; border-radius: 3px; font-family: 'Inter', sans-serif; letter-spacing: 0.5px; line-height: 1;">${tagStr}</span></div>`
      : '';

    // Headline & Subheadline
    const headlineHtml = slot.headline
      ? `<h2 style="font-family: 'Noto Serif Devanagari', 'Merriweather', serif; font-size: ${slot.headlineFontSize || 24}px; color: ${slot.headlineColor || '#020617'}; line-height: 1.25; font-weight: 900; margin: 0 0 2px 0; word-break: break-word;">${slot.headline}</h2>`
      : '';

    const subHeadlineHtml = slot.subHeadline
      ? `<h4 style="font-family: 'Mukta', 'Inter', sans-serif; font-size: ${slot.subHeadlineFontSize || 13}px; color: ${slot.subHeadlineColor || '#b91c1c'}; line-height: 1.28; font-weight: 700; margin: 0 0 4px 0; text-align: justify; word-break: break-word;">${slot.subHeadline}</h4>`
      : '';

    const cardContentW = Math.max(100, w - 24);
    const colsCount = Number(slot.columnsCount || 1);
    const colGap = Number(slot.columnGap || 14);
    const showDivider = Boolean(slot.showColumnDivider);
    const summaryFontSize = Number(slot.summaryFontSize || slot.bodyFontSize || 10.5);
    const summaryColor = slot.summaryColor || slot.bodyTextColor || '#1e293b';

    const hasImage = Boolean(slot.imageUrl);
    const imgW = Number(slot.imageWidth || 180);
    const imgH = Number(slot.imageHeight || 140);

    const normAlign = (slot.imageAlignment || slot.imageAlign || 'Center').toLowerCase();
    const isLeft = normAlign === 'left';
    const isRight = normAlign === 'right';
    const vertAlign = slot.imageVertAlign || 'top';

    const isFullWidthPhoto = imgW >= cardContentW - 30;

    let bodyContentHtml = '';
    const comp = slot.computedSections;

    if (!hasImage) {
      bodyContentHtml = `
        <div class="broadsheet-story-text" style="column-count: ${colsCount > 1 ? colsCount : 'auto'}; column-gap: ${colGap}px; column-rule: ${showDivider ? '1px solid #cbd5e1' : 'none'}; column-fill: auto; height: 100%; max-height: 100%; overflow: hidden; font-family: 'Noto Serif Devanagari', 'Merriweather', serif; font-size: ${summaryFontSize}px; color: ${summaryColor}; line-height: 1.35; text-align: justify; text-justify: inter-word; word-break: break-word;">
          ${slot.summary || slot.contentText || ''}
        </div>
      `;
    } else if (colsCount === 1 || isFullWidthPhoto || comp?.isFullWidth) {
      let justifyAlign = 'center';
      if (isLeft) justifyAlign = 'flex-start';
      else if (isRight) justifyAlign = 'flex-end';

      const photoDiv = `
        <div style="width: 100%; display: flex; justify-content: ${justifyAlign}; margin-bottom: 6px; flex-shrink: 0;">
          <div style="width: ${Math.min(imgW, cardContentW)}px; height: ${imgH}px; overflow: hidden; border-radius: 6px; border: 2px solid #cbd5e1; background: #0f172a;">
            <img src="${slot.imageUrl}" style="width: 100%; height: 100%; object-fit: cover; display: block;" />
          </div>
        </div>
      `;

      const textDiv = `
        <div class="broadsheet-story-text" style="column-count: ${colsCount > 1 ? colsCount : 'auto'}; column-gap: ${colGap}px; column-rule: ${showDivider ? '1px solid #cbd5e1' : 'none'}; column-fill: auto; flex: 1; height: calc(100% - ${imgH + 8}px); max-height: calc(100% - ${imgH + 8}px); overflow: hidden; font-family: 'Noto Serif Devanagari', 'Merriweather', serif; font-size: ${summaryFontSize}px; color: ${summaryColor}; line-height: 1.35; text-align: justify; text-justify: inter-word; word-break: break-word;">
          ${comp?.text1 || slot.summary || slot.contentText || ''}
        </div>
      `;

      bodyContentHtml = vertAlign === 'bottom'
        ? `<div style="display: flex; flex-direction: column; height: 100%; overflow: hidden;">${textDiv}${photoDiv}</div>`
        : `<div style="display: flex; flex-direction: column; height: 100%; overflow: hidden;">${photoDiv}${textDiv}</div>`;
    } else {
      // MULTI-COLUMN BROADSHEET ENGINE
      const singleColW = comp?.singleColW || Math.max(60, Math.floor((cardContentW - (colGap * (colsCount - 1))) / colsCount));
      const colStep = singleColW + colGap;
      const spanCols = comp?.photoCols || Math.min(colsCount - 1, Math.max(1, Math.round((imgW + (colGap * 0.5)) / colStep)));
      const maxStartCol = Math.max(0, colsCount - spanCols);

      let startCol = comp?.startCol ?? 0;
      if (comp?.startCol === undefined) {
        if (isLeft) startCol = 0;
        else if (isRight) startCol = maxStartCol;
        else if (slot.imgPxX !== undefined && slot.imgPxX > 0 && maxStartCol > 1) {
          startCol = Math.max(0, Math.min(maxStartCol, Math.round(slot.imgPxX / colStep)));
        } else {
          startCol = Math.floor(maxStartCol / 2);
        }
      }

      const leftCols = comp?.leftCols ?? startCol;
      const photoCols = comp?.photoCols ?? spanCols;
      const rightCols = comp?.rightCols ?? (colsCount - (startCol + spanCols));

      const leftSectionW = comp?.leftSectionW ?? (leftCols > 0 ? (leftCols * singleColW) + ((leftCols - 1) * colGap) : 0);
      const photoSectionW = comp?.photoSectionW ?? ((photoCols * singleColW) + ((photoCols - 1) * colGap));
      const rightSectionW = comp?.rightSectionW ?? (rightCols > 0 ? (rightCols * singleColW) + ((rightCols - 1) * colGap) : 0);

      const photoDiv = `
        <div style="width: 100%; height: ${imgH}px; overflow: hidden; border-radius: 6px; border: 2px solid #cbd5e1; background: #0f172a; margin-bottom: 8px; flex-shrink: 0;">
          <img src="${slot.imageUrl}" style="width: 100%; height: 100%; object-fit: cover; display: block;" />
        </div>
      `;

      if (comp && comp.text1 !== undefined) {
        // EXACT CANVAS PRE-COMPUTED FIT
        bodyContentHtml = `
          <div
            style="display: flex; gap: ${colGap}px; width: 100%; height: 100%; overflow: hidden; align-items: flex-start;"
          >
            ${leftCols > 0 ? `
              <div class="broadsheet-story-text" style="width: ${leftSectionW}px; height: 100%; column-count: ${leftCols > 1 ? leftCols : 'auto'}; column-gap: ${colGap}px; column-rule: ${showDivider ? '1px solid #cbd5e1' : 'none'}; column-fill: auto; overflow: hidden; font-family: 'Noto Serif Devanagari', 'Merriweather', serif; font-size: ${summaryFontSize}px; color: ${summaryColor}; line-height: 1.35; text-align: justify; text-justify: inter-word; flex-shrink: 0;">
                ${comp.text1 || ''}
              </div>
              ${showDivider ? '<div style="width: 1px; min-width: 1px; align-self: stretch; background-color: #cbd5e1; border-left: 1px solid #cbd5e1; flex-shrink: 0;"></div>' : ''}
            ` : ''}

            <div style="width: ${photoSectionW}px; height: 100%; display: flex; flex-direction: column; overflow: hidden; flex-shrink: 0;">
              ${vertAlign === 'bottom' ? `
                <div class="broadsheet-story-text" style="height: ${comp.underPhotoH}px; max-height: ${comp.underPhotoH}px; column-count: ${photoCols > 1 ? photoCols : 'auto'}; column-gap: ${colGap}px; column-rule: ${showDivider ? '1px solid #cbd5e1' : 'none'}; column-fill: auto; overflow: hidden; font-family: 'Noto Serif Devanagari', 'Merriweather', serif; font-size: ${summaryFontSize}px; color: ${summaryColor}; line-height: 1.35; text-align: justify; text-justify: inter-word; margin-bottom: 6px;">
                  ${comp.text2 || ''}
                </div>
                ${photoDiv}
              ` : vertAlign === 'middle' ? `
                <div class="broadsheet-story-text" style="height: calc(50% - ${Math.floor(imgH / 2) + 6}px); column-count: ${photoCols > 1 ? photoCols : 'auto'}; column-gap: ${colGap}px; column-rule: ${showDivider ? '1px solid #cbd5e1' : 'none'}; column-fill: auto; overflow: hidden; font-family: 'Noto Serif Devanagari', 'Merriweather', serif; font-size: ${summaryFontSize}px; color: ${summaryColor}; line-height: 1.35; text-align: justify; text-justify: inter-word; margin-bottom: 6px;">
                  ${comp.text2 || ''}
                </div>
                ${photoDiv}
                <div class="broadsheet-story-text" style="height: calc(50% - ${Math.ceil(imgH / 2) + 6}px); column-count: ${photoCols > 1 ? photoCols : 'auto'}; column-gap: ${colGap}px; column-rule: ${showDivider ? '1px solid #cbd5e1' : 'none'}; column-fill: auto; overflow: hidden; font-family: 'Noto Serif Devanagari', 'Merriweather', serif; font-size: ${summaryFontSize}px; color: ${summaryColor}; line-height: 1.35; text-align: justify; text-justify: inter-word; margin-top: 6px;">
                  ${comp.text2b || ''}
                </div>
              ` : `
                ${photoDiv}
                <div class="broadsheet-story-text" style="flex: 1; height: calc(100% - ${imgH + 6}px); column-count: ${photoCols > 1 ? photoCols : 'auto'}; column-gap: ${colGap}px; column-rule: ${showDivider ? '1px solid #cbd5e1' : 'none'}; column-fill: auto; overflow: hidden; font-family: 'Noto Serif Devanagari', 'Merriweather', serif; font-size: ${summaryFontSize}px; color: ${summaryColor}; line-height: 1.35; text-align: justify; text-justify: inter-word;">
                  ${comp.text2 || ''}
                </div>
              `}
            </div>

            ${rightCols > 0 ? `
              ${showDivider ? '<div style="width: 1px; min-width: 1px; align-self: stretch; background-color: #cbd5e1; border-left: 1px solid #cbd5e1; flex-shrink: 0;"></div>' : ''}
              <div class="broadsheet-story-text" style="width: ${rightSectionW}px; height: 100%; column-count: ${rightCols > 1 ? rightCols : 'auto'}; column-gap: ${colGap}px; column-rule: ${showDivider ? '1px solid #cbd5e1' : 'none'}; column-fill: auto; overflow: hidden; font-family: 'Noto Serif Devanagari', 'Merriweather', serif; font-size: ${summaryFontSize}px; color: ${summaryColor}; line-height: 1.35; text-align: justify; text-justify: inter-word; flex-shrink: 0;">
                ${comp.text3 || ''}
              </div>
            ` : ''}
          </div>
        `;
      } else {
        // Fallback dynamic measurement
        slotTokensList.push({
          id: sId,
          tokens: sliceHtmlTokens(slot.summary || slot.contentText || ''),
          leftCols,
          photoCols,
          rightCols,
          leftW: leftSectionW,
          photoW: photoSectionW,
          rightW: rightSectionW,
          fontSize: summaryFontSize,
          vertAlign,
          imgH
        });

        bodyContentHtml = `
          <div
            class="broadsheet-slot-engine"
            data-slot-id="${sId}"
            data-left-cols="${leftCols}"
            data-photo-cols="${photoCols}"
            data-right-cols="${rightCols}"
            data-left-w="${leftSectionW}"
            data-photo-w="${photoSectionW}"
            data-right-w="${rightSectionW}"
            data-gap="${colGap}"
            data-font-size="${summaryFontSize}"
            data-color="${summaryColor}"
            data-divider="${showDivider ? '1' : '0'}"
            data-valign="${vertAlign}"
            data-imgh="${imgH}"
            style="display: flex; gap: ${colGap}px; width: 100%; height: 100%; overflow: hidden; align-items: flex-start;"
          >
            ${leftCols > 0 ? `
              <div id="slot-left-${sId}" class="broadsheet-story-text" style="width: ${leftSectionW}px; height: 100%; column-count: ${leftCols > 1 ? leftCols : 'auto'}; column-gap: ${colGap}px; column-rule: ${showDivider ? '1px solid #cbd5e1' : 'none'}; column-fill: auto; overflow: hidden; font-family: 'Noto Serif Devanagari', 'Merriweather', serif; font-size: ${summaryFontSize}px; color: ${summaryColor}; line-height: 1.35; text-align: justify; text-justify: inter-word; flex-shrink: 0;"></div>
              ${showDivider ? '<div style="width: 1px; min-width: 1px; align-self: stretch; background-color: #cbd5e1; border-left: 1px solid #cbd5e1; flex-shrink: 0;"></div>' : ''}
            ` : ''}

            <div style="width: ${photoSectionW}px; height: 100%; display: flex; flex-direction: column; overflow: hidden; flex-shrink: 0;">
              ${vertAlign === 'bottom' ? `
                <div id="slot-photo-${sId}" class="broadsheet-story-text" style="flex: 1; height: calc(100% - ${imgH + 6}px); column-count: ${photoCols > 1 ? photoCols : 'auto'}; column-gap: ${colGap}px; column-rule: ${showDivider ? '1px solid #cbd5e1' : 'none'}; column-fill: auto; overflow: hidden; font-family: 'Noto Serif Devanagari', 'Merriweather', serif; font-size: ${summaryFontSize}px; color: ${summaryColor}; line-height: 1.35; text-align: justify; text-justify: inter-word; margin-bottom: 6px;"></div>
                ${photoDiv}
              ` : vertAlign === 'middle' ? `
                <div id="slot-photo-top-${sId}" class="broadsheet-story-text" style="height: calc(50% - ${Math.floor(imgH / 2) + 6}px); column-count: ${photoCols > 1 ? photoCols : 'auto'}; column-gap: ${colGap}px; column-rule: ${showDivider ? '1px solid #cbd5e1' : 'none'}; column-fill: auto; overflow: hidden; font-family: 'Noto Serif Devanagari', 'Merriweather', serif; font-size: ${summaryFontSize}px; color: ${summaryColor}; line-height: 1.35; text-align: justify; text-justify: inter-word; margin-bottom: 6px;"></div>
                ${photoDiv}
                <div id="slot-photo-bot-${sId}" class="broadsheet-story-text" style="height: calc(50% - ${Math.ceil(imgH / 2) + 6}px); column-count: ${photoCols > 1 ? photoCols : 'auto'}; column-gap: ${colGap}px; column-rule: ${showDivider ? '1px solid #cbd5e1' : 'none'}; column-fill: auto; overflow: hidden; font-family: 'Noto Serif Devanagari', 'Merriweather', serif; font-size: ${summaryFontSize}px; color: ${summaryColor}; line-height: 1.35; text-align: justify; text-justify: inter-word; margin-top: 6px;"></div>
              ` : `
                ${photoDiv}
                <div id="slot-photo-${sId}" class="broadsheet-story-text" style="flex: 1; height: calc(100% - ${imgH + 6}px); column-count: ${photoCols > 1 ? photoCols : 'auto'}; column-gap: ${colGap}px; column-rule: ${showDivider ? '1px solid #cbd5e1' : 'none'}; column-fill: auto; overflow: hidden; font-family: 'Noto Serif Devanagari', 'Merriweather', serif; font-size: ${summaryFontSize}px; color: ${summaryColor}; line-height: 1.35; text-align: justify; text-justify: inter-word;"></div>
              `}
            </div>

            ${rightCols > 0 ? `
              ${showDivider ? '<div style="width: 1px; min-width: 1px; align-self: stretch; background-color: #cbd5e1; border-left: 1px solid #cbd5e1; flex-shrink: 0;"></div>' : ''}
              <div id="slot-right-${sId}" class="broadsheet-story-text" style="width: ${rightSectionW}px; height: 100%; column-count: ${rightCols > 1 ? rightCols : 'auto'}; column-gap: ${colGap}px; column-rule: ${showDivider ? '1px solid #cbd5e1' : 'none'}; column-fill: auto; overflow: hidden; font-family: 'Noto Serif Devanagari', 'Merriweather', serif; font-size: ${summaryFontSize}px; color: ${summaryColor}; line-height: 1.35; text-align: justify; text-justify: inter-word; flex-shrink: 0;"></div>
            ` : ''}
          </div>
        `;
      }
    }

    return `
      <div
        id="slot-container-${sId}"
        style="position: absolute; left: ${x}px; top: ${y}px; width: ${w}px; height: ${h}px; border: none; padding: 8px; box-sizing: border-box; background: #fffdf7; overflow: hidden; display: flex; flex-direction: column;"
      >
        <div style="margin-bottom: 4px; flex-shrink: 0;">
          ${tagHtml}
          ${headlineHtml}
          ${subHeadlineHtml}
        </div>
        <div style="flex: 1; min-height: 0; overflow: hidden; width: 100%;">
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
        <div style="font-style: italic; color: #475569; font-family: 'Noto Serif Devanagari', 'Merriweather', serif;">डिजिटल संस्करण • e-paper</div>
        <div>पेज 0${pageNum}</div>
      </div>

      <!-- BIG RED BROADSHEET MASTHEAD -->
      <header style="text-align: center; border-bottom: 4px double #0f172a; padding-bottom: 4px; margin-bottom: 0px;">
        <h1 style="font-family: 'Noto Serif Devanagari', 'Merriweather', serif; font-size: 56px; font-weight: 900; color: #b91c1c; margin: 0; letter-spacing: -1px; text-transform: uppercase; line-height: 0.95;">
          ${mainTitle}
        </h1>
        <div style="display: flex; justify-content: center; align-items: center; gap: 8px; font-size: 10px; font-weight: 800; text-transform: uppercase; color: #334155; margin-top: 2px; font-family: 'Mukta', 'Inter', sans-serif; line-height: 1.1;">
          <span style="background: #fbbf24; color: #020617; padding: 1px 6px; border-radius: 4px; font-weight: 900;">Free-Form Canvas</span>
          <span>•</span>
          <span>${stateStr}</span>
          <span>•</span>
          <span>${editionName}</span>
        </div>
      </header>

      <!-- SLOTS POSITIONED AT EXACT X & Y INSIDE BROADSHEET PAGE -->
      ${slotsHtml}

      <!-- FOOTER -->
      <footer style="position: absolute; bottom: 12px; left: 40px; right: 40px; display: flex; justify-content: space-between; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 6px; font-family: 'Mukta', 'Inter', sans-serif;">
        <div>डिजिटल ई-पेपर संस्करण • ${cityStr} • ${stateStr} • सर्वाधिकार सुरक्षित</div>
        <div>पेज 0${pageNum}</div>
      </footer>
    </div>
  `;

  return { pageHtml, slotTokensList };
}

function wrapFullDocument(pagesHtml, allSlotsList, title = 'Broadsheet E-Paper') {
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
    .broadsheet-story-text, .broadsheet-story-text * {
      font-family: 'Noto Serif Devanagari', 'Merriweather', serif !important;
      line-height: 1.35 !important;
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

  <script>
    (function() {
      try {
        var rawSlotsData = ${JSON.stringify(allSlotsList || [])};

        function buildHtml(allTokens, start, end) {
          if (!allTokens || start >= end || start >= allTokens.length) return '';
          var html = '';
          for (var i = start; i < end && i < allTokens.length; i++) {
            html += allTokens[i];
          }
          return html;
        }

        function measureFit(tokens, startIdx, targetW, targetH, cols, fSize) {
          if (startIdx >= tokens.length) return tokens.length;
          var testDiv = document.createElement('div');
          testDiv.style.position = 'fixed';
          testDiv.style.left = '-9999px';
          testDiv.style.top = '-9999px';
          testDiv.style.visibility = 'hidden';
          testDiv.style.width = targetW + 'px';
          testDiv.style.height = targetH + 'px';
          testDiv.style.maxHeight = targetH + 'px';
          testDiv.style.overflow = 'hidden';
          testDiv.style.fontFamily = "'Noto Serif Devanagari', 'Merriweather', serif";
          testDiv.style.fontSize = fSize + 'px';
          testDiv.style.lineHeight = '1.35';
          testDiv.style.textAlign = 'justify';
          testDiv.style.textJustify = 'inter-word';
          testDiv.style.wordBreak = 'break-word';
          testDiv.style.padding = '0';
          testDiv.style.margin = '0';
          testDiv.style.boxSizing = 'border-box';
          if (cols > 1) {
            testDiv.style.columnCount = cols;
            testDiv.style.columnGap = '14px';
            testDiv.style.columnFill = 'auto';
          }
          document.body.appendChild(testDiv);

          var low = startIdx;
          var high = tokens.length;
          var best = startIdx;

          while (low <= high) {
            var mid = Math.floor((low + high) / 2);
            testDiv.innerHTML = buildHtml(tokens, startIdx, mid);
            var fits = cols === 1
              ? (testDiv.scrollHeight <= targetH + 2)
              : (testDiv.scrollWidth <= targetW + 2 && testDiv.scrollHeight <= targetH + 2);
            if (fits) {
              best = mid;
              low = mid + 1;
            } else {
              high = mid - 1;
            }
          }
          document.body.removeChild(testDiv);
          return Math.max(startIdx + 1, best);
        }

        var engines = document.querySelectorAll('.broadsheet-slot-engine');
        engines.forEach(function(engine) {
          var sId = engine.getAttribute('data-slot-id');
          var slotInfo = rawSlotsData.find(function(s) { return String(s.id) === String(sId); });
          if (!slotInfo || !slotInfo.tokens || slotInfo.tokens.length === 0) return;

          var tokens = slotInfo.tokens;
          var leftCols = parseInt(engine.getAttribute('data-left-cols') || '0', 10);
          var photoCols = parseInt(engine.getAttribute('data-photo-cols') || '1', 10);
          var rightCols = parseInt(engine.getAttribute('data-right-cols') || '0', 10);
          var leftW = parseFloat(engine.getAttribute('data-left-w') || '0');
          var photoW = parseFloat(engine.getAttribute('data-photo-w') || '0');
          var rightW = parseFloat(engine.getAttribute('data-right-w') || '0');
          var fSize = parseFloat(engine.getAttribute('data-font-size') || '10.5');
          var vAlign = engine.getAttribute('data-valign') || 'top';
          var imgH = parseFloat(engine.getAttribute('data-imgh') || '140');
          var totalH = engine.clientHeight || 250;

          var curIdx = 0;

          if (leftCols > 0) {
            var elLeft = document.getElementById('slot-left-' + sId);
            if (elLeft) {
              var fit1 = measureFit(tokens, curIdx, leftW, totalH, leftCols, fSize);
              elLeft.innerHTML = buildHtml(tokens, curIdx, fit1);
              curIdx = fit1;
            }
          }

          var underH = Math.max(30, totalH - imgH - 8);
          if (vAlign === 'middle') {
            var halfH = Math.max(20, Math.floor(underH / 2));
            var elMidTop = document.getElementById('slot-photo-top-' + sId);
            if (elMidTop && curIdx < tokens.length) {
              var fitMid1 = measureFit(tokens, curIdx, photoW, halfH, photoCols, fSize);
              elMidTop.innerHTML = buildHtml(tokens, curIdx, fitMid1);
              curIdx = fitMid1;
            }
            var elMidBot = document.getElementById('slot-photo-bot-' + sId);
            if (elMidBot && curIdx < tokens.length) {
              var fitMid2 = measureFit(tokens, curIdx, photoW, halfH, photoCols, fSize);
              elMidBot.innerHTML = buildHtml(tokens, curIdx, fitMid2);
              curIdx = fitMid2;
            }
          } else {
            var elPhoto = document.getElementById('slot-photo-' + sId);
            if (elPhoto && curIdx < tokens.length) {
              var fit2 = measureFit(tokens, curIdx, photoW, underH, photoCols, fSize);
              elPhoto.innerHTML = buildHtml(tokens, curIdx, fit2);
              curIdx = fit2;
            }
          }

          if (rightCols > 0) {
            var elRight = document.getElementById('slot-right-' + sId);
            if (elRight && curIdx < tokens.length) {
              var fit3 = measureFit(tokens, curIdx, rightW, totalH, rightCols, fSize);
              elRight.innerHTML = buildHtml(tokens, curIdx, fit3);
            }
          }
        });
      } catch (e) {
        console.error('Puppeteer client script error:', e);
      }
    })();
  </script>
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
    let combinedSlotsList = [];

    // Render each page screenshot (WebP)
    for (let i = 0; i < pages.length; i++) {
      const pageObj = pages[i];
      const pageNum = pageObj.pageNumber || (i + 1);
      const { pageHtml, slotTokensList } = buildPageFragment(opts, pageObj, i);

      allPagesFragments.push(pageHtml);
      combinedSlotsList = combinedSlotsList.concat(slotTokensList);

      const singlePageDoc = wrapFullDocument(pageHtml, slotTokensList, `Page ${pageNum}`);

      const pageTab = await browser.newPage();
      await pageTab.setViewport({ width: 1344, height: 2112, deviceScaleFactor: 2 });
      await pageTab.setContent(singlePageDoc, { waitUntil: 'load', timeout: 30000 });

      // Wait for all webfonts to be 100% loaded before screenshotting!
      try {
        await pageTab.evaluateHandle('document.fonts.ready');
      } catch (_) {}

      await new Promise(r => setTimeout(r, 400));

      const pageImgName = `${editionSlug}-${publishDate}-page-${pageNum}.webp`;
      const pageImgPath = path.join(pageImgDir, pageImgName);

      await pageTab.screenshot({
        path: pageImgPath,
        type: 'webp',
        quality: 90,
        fullPage: true
      });

      const pageImgPublicUrl = `/uploads/epaper/pages/${pageImgName}`;
      pageImageUrls.push({ pageNumber: pageNum, pageImage: pageImgPublicUrl });
      await pageTab.close();
    }

    // Now render full compiled PDF
    const fullPdfPage = await browser.newPage();
    await fullPdfPage.setViewport({ width: 1344, height: 2112, deviceScaleFactor: 2 });

    const fullDoc = wrapFullDocument(allPagesFragments.join(''), combinedSlotsList, 'Broadsheet E-Paper PDF');

    await fullPdfPage.setContent(fullDoc, { waitUntil: 'load', timeout: 30000 });

    try {
      await fullPdfPage.evaluateHandle('document.fonts.ready');
    } catch (_) {}

    await new Promise(r => setTimeout(r, 500));

    const timestamp = Date.now();
    const pdfFileName = `epaper-${editionSlug}-${publishDate}-${timestamp}.pdf`;
    const pdfFilePath = path.join(pdfDir, pdfFileName);

    await fullPdfPage.pdf({
      path: pdfFilePath,
      width: '1344px',
      height: '2112px',
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' },
      timeout: 120000
    });

    await fullPdfPage.close();

    try {
      const canonicalPath = path.join(pdfDir, `epaper-${editionSlug}-${publishDate}.pdf`);
      fs.copyFileSync(pdfFilePath, canonicalPath);
    } catch (copyErr) {
      // Ignored if canonical file is locked
    }

    const publicUrl = `/uploads/pdfs/${pdfFileName}`;
    return { filePath: pdfFilePath, publicUrl, pageImages: pageImageUrls };
  } finally {
    await browser.close();
  }
}
