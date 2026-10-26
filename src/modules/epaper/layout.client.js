
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

function decodeHtmlEntities(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');
}

function sliceHtmlTokens(html) {
  if (!html) return [];
  const tagRegex = /(<[^>]+>|[^\s<]+|\s+)/g;
  return html.match(tagRegex) || [];
}

function buildHtmlFromTokens(tokens, startIdx, endIdx) {
  if (!tokens || tokens.length === 0 || startIdx >= tokens.length || startIdx >= endIdx) return '';
  const rawChunk = tokens.slice(startIdx, endIdx).join('');
  const openStack = [];
  for (let i = 0; i < startIdx; i++) {
    const t = tokens[i];
    if (t.startsWith('</')) {
      const tagName = t.slice(2, -1).toLowerCase().split(' ')[0];
      for (let j = openStack.length - 1; j >= 0; j--) {
        if (openStack[j].tag === tagName) {
          openStack.splice(j, 1);
          break;
        }
      }
    } else if (t.startsWith('<') && !t.endsWith('/>') && !t.startsWith('<!')) {
      const match = t.match(/<([a-zA-Z0-9]+)/);
      if (match) {
        const tagName = match[1].toLowerCase();
        if (!['br', 'img', 'hr', 'input'].includes(tagName)) {
          openStack.push({ tag: tagName, full: t });
        }
      }
    }
  }
  const prefix = openStack.map(item => item.full).join('');
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = prefix + rawChunk;
  return tempDiv.innerHTML;
}

let measureDiv = null;
function getMeasureDiv() {
  if (!measureDiv) {
    measureDiv = document.createElement('div');
    measureDiv.id = '__epaper_measure_div__';
    measureDiv.style.position = 'fixed';
    measureDiv.style.left = '-99999px';
    measureDiv.style.top = '-99999px';
    measureDiv.style.visibility = 'hidden';
    document.body.appendChild(measureDiv);
  }
  return measureDiv;
}

function findBestTokenFit(tokens, startTokenIdx, width, height, cols, fontSize, colGap) {
  if (startTokenIdx >= tokens.length) return tokens.length;
  const lineH = getSummaryLineHeight(fontSize);
  if (height < lineH) return startTokenIdx;

  const div = getMeasureDiv();
  const targetW = Math.max(50, width);
  const targetH = height;

  div.style.width = targetW + 'px';
  if (cols > 1) {
    div.style.height = targetH + 'px';
    div.style.maxHeight = targetH + 'px';
    div.style.columnCount = cols;
    div.style.columnGap = (colGap || 14) + 'px';
    div.style.columnFill = 'auto';
    div.style.webkitColumnFill = 'auto';
  } else {
    div.style.height = 'auto';
    div.style.maxHeight = 'none';
    div.style.columnCount = 'unset';
    div.style.columnGap = 'unset';
    div.style.columnFill = 'unset';
    div.style.webkitColumnFill = 'unset';
  }
  div.style.fontSize = (fontSize || 14) + 'px';
  div.style.fontFamily = "'Noto Serif Devanagari', 'Merriweather', serif";
  div.style.lineHeight = lineH + 'px';
  div.style.setProperty('--story-line-h', lineH + 'px');
  div.className = 'broadsheet-story-text whitespace-pre-line';
  div.style.textAlign = 'justify';
  div.style.textJustify = 'inter-word';
  div.style.wordBreak = 'break-word';
  div.style.overflow = 'hidden';
  div.style.boxSizing = 'border-box';
  div.style.padding = '0';
  div.style.paddingRight = '2px';
  div.style.paddingBottom = '0';
  div.style.margin = '0';
  div.style.whiteSpace = 'pre-line';

  const fullHtml = buildHtmlFromTokens(tokens, startTokenIdx, tokens.length);
  div.innerHTML = fullHtml;
  // +2px rounding tolerance allows lines that finish exactly at boundary to be included
  const fitsAll = cols === 1
    ? (div.scrollHeight <= targetH + 2)
    : (div.scrollWidth <= targetW && div.scrollHeight <= targetH + 2);

  if (fitsAll) return tokens.length;

  let low = startTokenIdx + 1;
  let high = tokens.length;
  let bestFit = startTokenIdx;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    div.innerHTML = buildHtmlFromTokens(tokens, startTokenIdx, mid);
    const fits = cols === 1
      ? (div.scrollHeight <= targetH + 2)
      : (div.scrollWidth <= targetW && div.scrollHeight <= targetH + 2);
    if (fits) {
      bestFit = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }
  return bestFit;
}

function renderSlot(rawS, targetContainer) {
  // 100% Robust Normalization matching Website Reader (EPaperModal)
  const width = rawS.width !== undefined && rawS.width !== null ? Number(rawS.width) : 400;
  const height = rawS.height !== undefined && rawS.height !== null ? Number(rawS.height) : 250;
  const x = rawS.x !== undefined && rawS.x !== null ? Number(rawS.x) : 0;
  const y = rawS.y !== undefined && rawS.y !== null ? Number(rawS.y) : 0;
  const colsCount = Number(rawS.columnsCount ?? rawS.columnCount ?? rawS.columns_count ?? rawS.colsCount ?? 1);
  const colGap = Number(rawS.columnGap ?? rawS.column_gap ?? 14);
  const showDivider = Boolean(rawS.showColumnDivider ?? rawS.show_column_divider ?? rawS.showColumnDividers ?? false);
  const imgW = Number(rawS.imageWidth ?? rawS.image_width ?? 180);
  const imgH = Number(rawS.imageHeight ?? rawS.image_height ?? 140);
  const imgPxX = rawS.imgPxX !== undefined ? Number(rawS.imgPxX) : (rawS.img_px_x !== undefined ? Number(rawS.img_px_x) : undefined);
  const normAlign = (rawS.imageAlignment || rawS.imageAlign || 'Left').toLowerCase();
  const isLeft = normAlign === 'left';
  const isRight = normAlign === 'right';
  const cardContentW = Math.max(100, width - 16);
  const summaryFont = Number(rawS.summaryFontSize ?? rawS.bodyFontSize ?? rawS.summary_font_size ?? rawS.body_font_size ?? 14);
  const lineH = getSummaryLineHeight(summaryFont);
  const vertAlign = rawS.imageVertAlign || rawS.image_vert_align || 'top';
  const imageWrapMode = rawS.imageWrapMode || rawS.image_wrap_mode || 'auto';
  const isFullCardPhoto = imgW >= cardContentW - 30 || imageWrapMode === 'top-span';

  const slotEl = document.createElement('div');
  slotEl.style.position = 'absolute';
  slotEl.style.left = x + 'px';
  slotEl.style.top = y + 'px';
  slotEl.style.width = width + 'px';
  slotEl.style.height = height + 'px';
  slotEl.style.boxSizing = 'border-box';
  slotEl.style.padding = '8px 8px 4px 8px';
  slotEl.style.overflow = 'hidden';
  slotEl.style.display = 'flex';
  slotEl.style.flexDirection = 'column';

  if (rawS.isAd || rawS.type === 'ad') {
    slotEl.style.border = '2px dashed #d97706';
    slotEl.style.backgroundColor = '#fffbeb';
    slotEl.style.borderRadius = '8px';
    slotEl.innerHTML = `
      <div>
        <span style="display:inline-block;background:#d97706;color:#ffffff;font-size:9px;font-weight:900;padding:2px 6px;border-radius:4px;text-transform:uppercase;margin-bottom:6px;">SPONSORED AD</span>
        <h3 style="font-family:'Noto Serif Devanagari','Merriweather',serif;font-size:${rawS.headlineFontSize || 22}px;font-weight:800;color:${rawS.headlineColor || '#020617'};margin:0 0 4px 0;line-height:1.25;">${rawS.headline || ''}</h3>
        ${rawS.subHeadline ? `<p style="font-family:'Mukta','Inter',sans-serif;font-size:${rawS.subHeadlineFontSize || 13}px;font-weight:700;color:${rawS.subHeadlineColor || '#b91c1c'};margin:0 0 6px 0;line-height:1.3;">${rawS.subHeadline}</p>` : ''}
        <div class="broadsheet-story-text" style="font-size:${summaryFont}px;line-height:${lineH}px;color:${rawS.summaryColor || '#1e293b'};text-align:justify;overflow:hidden;">${rawS.contentText || rawS.summary || ''}</div>
      </div>
    `;
    targetContainer.appendChild(slotEl);
    return;
  }

  // Header content
  const headerEl = document.createElement('div');
  headerEl.style.marginBottom = '4px';
  headerEl.style.flexShrink = '0';

  const tagText = (rawS.categoryTag || rawS.categoryBadge || '').trim();
  if (tagText) {
    const tagWrapper = document.createElement('div');
    tagWrapper.style.marginBottom = '3px';
    tagWrapper.style.display = 'flex';
    tagWrapper.style.alignItems = 'center';

    const tagSpan = document.createElement('span');
    tagSpan.style.display = 'inline-flex';
    tagSpan.style.alignItems = 'center';
    tagSpan.style.backgroundColor = '#dc2626';
    tagSpan.style.color = '#ffffff';
    tagSpan.style.fontSize = '9.5px';
    tagSpan.style.fontWeight = '700';
    tagSpan.style.padding = '2px 6px';
    tagSpan.style.borderRadius = '3px';
    tagSpan.style.textTransform = 'uppercase';
    tagSpan.style.fontFamily = "'Inter', 'Mukta', 'Noto Sans Devanagari', sans-serif";
    tagSpan.style.lineHeight = '1';
    tagSpan.style.letterSpacing = '0.5px';
    tagSpan.textContent = tagText;

    tagWrapper.appendChild(tagSpan);
    headerEl.appendChild(tagWrapper);
  }

  const hl = document.createElement('h2');
  hl.style.fontFamily = "'Noto Serif Devanagari', 'Merriweather', serif";
  hl.style.fontSize = (rawS.headlineFontSize || 22) + 'px';
  hl.style.fontWeight = '900';
  hl.style.color = rawS.headlineColor || '#020617';
  hl.style.lineHeight = '1.25';
  hl.style.margin = '0 0 2px 0';
  hl.style.wordBreak = 'break-word';
  hl.innerHTML = rawS.headline || '';
  headerEl.appendChild(hl);

  if (rawS.subHeadline) {
    const sub = document.createElement('p');
    sub.style.fontFamily = "'Mukta', 'Inter', sans-serif";
    sub.style.fontSize = (rawS.subHeadlineFontSize || 13) + 'px';
    sub.style.fontWeight = '700';
    sub.style.color = rawS.subHeadlineColor || '#b91c1c';
    sub.style.lineHeight = '1.25';
    sub.style.margin = '2px 0';
    sub.style.textAlign = 'justify';
    sub.style.wordBreak = 'break-word';
    sub.innerHTML = rawS.subHeadline;
    headerEl.appendChild(sub);
  }
  slotEl.appendChild(headerEl);

  const bodyEl = document.createElement('div');
  bodyEl.style.flex = '1';
  bodyEl.style.minHeight = '0';
  bodyEl.style.width = '100%';
  bodyEl.style.overflow = 'hidden';
  slotEl.appendChild(bodyEl);

  targetContainer.appendChild(slotEl);

  const headerH = headerEl.offsetHeight;
  const availableStoryH = Math.max(20, height - (8 + headerH + 4 + 4));
  const hasImage = Boolean(rawS.imageUrl);
  const photoTotalH = hasImage ? (imgH + 2) : 0;
  const rawUnderH = availableStoryH - photoTotalH;
  const minRequiredH = lineH * 2; // Need at least 2 full readable lines (~38-44px)
  const underPhotoH = rawUnderH >= minRequiredH ? rawUnderH : 0;

  let comp = rawS.computedSections;
  if (!comp && rawS.subStories) {
    try {
      comp = typeof rawS.subStories === 'string' ? JSON.parse(rawS.subStories) : rawS.subStories;
    } catch (_) {}
  }
  const hasPrecomputed = Boolean(comp && typeof comp === 'object' && (comp.text1 !== undefined || comp.textNoImg !== undefined || comp.text2 !== undefined || comp.text3 !== undefined));

  const summaryText = decodeHtmlEntities(rawS.summary || rawS.contentText || '');
  const tokens = sliceHtmlTokens(summaryText);

  if (!hasImage) {
    const textNoImg = (hasPrecomputed && comp.text1 !== undefined)
      ? comp.text1
      : buildHtmlFromTokens(tokens, 0, findBestTokenFit(tokens, 0, cardContentW, availableStoryH, colsCount, summaryFont, colGap));
    const dividerRule = showDivider && colsCount > 1 ? 'column-rule: 1px solid #cbd5e1;' : '';
    bodyEl.innerHTML = `<div class="broadsheet-story-text" style="--story-line-h: ${lineH}px; font-size: ${summaryFont}px; line-height: ${lineH}px; color: ${rawS.summaryColor || '#1e293b'}; column-count: ${colsCount > 1 ? colsCount : 'unset'}; column-gap: ${colGap}px; column-fill: auto; -webkit-column-fill: auto; height: 100%; overflow: hidden; padding-bottom: 0px; padding-right: 2px; text-align: justify; text-justify: inter-word; white-space: pre-line; word-break: break-word; ${dividerRule}">${textNoImg}</div>`;
  } else if (colsCount === 1 || isFullCardPhoto) {
    const isTopSpanPhoto = imageWrapMode === 'top-span' || (rawS.imageWidth && rawS.imageWidth >= cardContentW - 30);
    const currentImgW = isTopSpanPhoto ? cardContentW : Math.min(imgW || 180, cardContentW);
    const maxPxX = Math.max(0, cardContentW - currentImgW);

    let photoPxX = 0;
    if (isTopSpanPhoto) {
      photoPxX = 0;
    } else if (imgPxX !== undefined) {
      photoPxX = Math.max(0, Math.min(maxPxX, imgPxX));
    } else {
      if (isLeft) photoPxX = 0;
      else if (isRight) photoPxX = maxPxX;
      else photoPxX = Math.round(maxPxX / 2);
    }

    const singleColPhoto = document.createElement('div');
    singleColPhoto.style.width = '100%';
    singleColPhoto.style.marginBottom = '2px';
    singleColPhoto.style.flexShrink = '0';
    singleColPhoto.innerHTML = `<div style="width: ${isTopSpanPhoto ? '100%' : currentImgW + 'px'}; height: ${imgH}px; margin-left: ${isTopSpanPhoto ? '0px' : photoPxX + 'px'}; overflow: hidden; border-radius: 4px; border: 1px solid #cbd5e1; background: #f8fafc;"><img src="${rawS.imageUrl}" style="width: 100%; height: 100%; object-fit: cover; display: block;" /></div>`;

    const textEl = document.createElement('div');
    textEl.className = 'broadsheet-story-text';
    textEl.style.fontSize = summaryFont + 'px';
    textEl.style.lineHeight = lineH + 'px';
    textEl.style.setProperty('--story-line-h', lineH + 'px');
    textEl.style.color = rawS.summaryColor || '#1e293b';
    textEl.style.flex = '1';
    textEl.style.minHeight = '0';
    textEl.style.overflow = 'hidden';
    textEl.style.paddingBottom = '0px';
    textEl.style.paddingRight = '2px';
    textEl.style.textAlign = 'justify';
    textEl.style.textJustify = 'inter-word';
    textEl.style.whiteSpace = 'pre-line';
    textEl.style.wordBreak = 'break-word';
    if (colsCount > 1) {
      textEl.style.columnCount = colsCount;
      textEl.style.columnGap = colGap + 'px';
      textEl.style.columnFill = 'auto';
      textEl.style.webkitColumnFill = 'auto';
      if (showDivider) textEl.style.columnRule = '1px solid #cbd5e1';
    }

    const fullText = (hasPrecomputed && comp.text1 !== undefined)
      ? comp.text1
      : buildHtmlFromTokens(tokens, 0, findBestTokenFit(tokens, 0, cardContentW, underPhotoH, colsCount, summaryFont, colGap));
    textEl.innerHTML = fullText;

    const flexCol = document.createElement('div');
    flexCol.style.display = 'flex';
    flexCol.style.flexDirection = 'column';
    flexCol.style.height = '100%';
    flexCol.style.width = '100%';

    if (vertAlign === 'bottom') {
      flexCol.appendChild(textEl);
      flexCol.appendChild(singleColPhoto);
    } else {
      flexCol.appendChild(singleColPhoto);
      flexCol.appendChild(textEl);
    }
    bodyEl.appendChild(flexCol);
  } else {
    // Multi-column with Exact Photo Column Spanning (100% 1:1 with Website Reader)
    const singleColW = Math.max(60, Math.floor((cardContentW - (colGap * (colsCount - 1))) / colsCount));
    const colStep = singleColW + colGap;
    const spanCols = Math.min(colsCount - 1, Math.max(1, Math.round((imgW + (colGap * 0.5)) / colStep)));
    const maxStartCol = Math.max(0, colsCount - spanCols);

    let startCol = 0;
    if (imgPxX !== undefined && maxStartCol >= 1) {
      startCol = Math.max(0, Math.min(maxStartCol, Math.round(imgPxX / colStep)));
    } else if (isLeft) {
      startCol = 0;
    } else if (isRight) {
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

    const displayImgW = Math.max(30, Math.min(imgW || photoSectionW, photoSectionW));
    const localMaxPxX = Math.max(0, photoSectionW - displayImgW);
    let localPhotoPxX = 0;
    if (imgPxX !== undefined) {
      const sectionStartX = leftCols > 0 ? (leftCols * singleColW) + (leftCols * colGap) : 0;
      localPhotoPxX = Math.max(0, Math.min(localMaxPxX, imgPxX - sectionStartX));
    } else if (isLeft) {
      localPhotoPxX = 0;
    } else if (isRight) {
      localPhotoPxX = localMaxPxX;
    } else {
      localPhotoPxX = Math.round(localMaxPxX / 2);
    }

    let text1 = '';
    let text2 = '';
    let text2b = '';
    let text3 = '';

    if (hasPrecomputed && comp.text1 !== undefined) {
      text1 = comp.text1 || '';
      // Only show text2 under photo if there is sufficient vertical space
      text2 = (underPhotoH >= minRequiredH || comp.underPhotoH >= minRequiredH) ? (comp.text2 || '') : '';
      text2b = comp.text2b || '';
      text3 = comp.text3 || '';
    } else {
      let curTokenIdx = 0;

      if (leftCols > 0) {
        if (photoCols > 0 || rightCols > 0) {
          const fit1 = findBestTokenFit(tokens, curTokenIdx, leftSectionW, availableStoryH, leftCols, summaryFont, colGap);
          text1 = buildHtmlFromTokens(tokens, curTokenIdx, fit1);
          curTokenIdx = fit1;
        } else {
          text1 = buildHtmlFromTokens(tokens, curTokenIdx, tokens.length);
          curTokenIdx = tokens.length;
        }
      }

      if (vertAlign === 'middle') {
        const midTopH = Math.max(0, Math.floor(underPhotoH / 2));
        const midBottomH = Math.max(0, Math.ceil(underPhotoH / 2));

        if (curTokenIdx < tokens.length && midTopH >= minRequiredH) {
          const fit2a = findBestTokenFit(tokens, curTokenIdx, photoSectionW, midTopH, photoCols, summaryFont, colGap);
          text2 = buildHtmlFromTokens(tokens, curTokenIdx, fit2a);
          curTokenIdx = fit2a;
        }

        if (curTokenIdx < tokens.length && midBottomH >= minRequiredH) {
          const fit2b = findBestTokenFit(tokens, curTokenIdx, photoSectionW, midBottomH, photoCols, summaryFont, colGap);
          text2b = buildHtmlFromTokens(tokens, curTokenIdx, fit2b);
          curTokenIdx = fit2b;
        }
      } else {
        // top or bottom - Only fit text under photo if there is room for at least 2 full readable lines!
        if (underPhotoH >= minRequiredH && curTokenIdx < tokens.length) {
          const fit2 = findBestTokenFit(tokens, curTokenIdx, photoSectionW, underPhotoH, photoCols, summaryFont, colGap);
          text2 = buildHtmlFromTokens(tokens, curTokenIdx, fit2);
          curTokenIdx = fit2;
        }
      }

      if (rightCols > 0 && curTokenIdx < tokens.length) {
        const fit3 = findBestTokenFit(tokens, curTokenIdx, rightSectionW, availableStoryH, rightCols, summaryFont, colGap);
        text3 = buildHtmlFromTokens(tokens, curTokenIdx, fit3);
        curTokenIdx = fit3;
      }
    }

    const photoBlockHtml = `
      <div style="width: 100%; margin-bottom: 2px; flex-shrink: 0;">
        <div style="width: ${imgW < photoSectionW ? displayImgW + 'px' : '100%'}; height: ${imgH}px; margin-left: ${imgW < photoSectionW ? localPhotoPxX + 'px' : '0px'}; overflow: hidden; border-radius: 4px; border: 1px solid #cbd5e1; background: #f8fafc;">
          <img src="${rawS.imageUrl}" style="width: 100%; height: 100%; object-fit: cover; display: block;" />
        </div>
      </div>
    `;

    const flexRow = document.createElement('div');
    flexRow.style.display = 'flex';
    flexRow.style.gap = colGap + 'px';
    flexRow.style.width = '100%';
    flexRow.style.height = '100%';
    flexRow.style.alignItems = 'flex-start';
    flexRow.style.overflow = 'hidden';

    if (leftCols > 0) {
      const leftColEl = document.createElement('div');
      leftColEl.style.width = leftSectionW + 'px';
      leftColEl.style.height = '100%';
      leftColEl.style.flexShrink = '0';
      leftColEl.style.overflow = 'hidden';
      const dividerRule = showDivider && leftCols > 1 ? 'column-rule: 1px solid #cbd5e1;' : '';
      leftColEl.innerHTML = `<div class="broadsheet-story-text" style="--story-line-h: ${lineH}px; font-size: ${summaryFont}px; line-height: ${lineH}px; color: ${rawS.summaryColor || '#1e293b'}; column-count: ${leftCols > 1 ? leftCols : 'unset'}; column-gap: ${colGap}px; column-fill: auto; -webkit-column-fill: auto; height: 100%; overflow: hidden; padding-bottom: 0px; padding-right: 2px; text-align: justify; text-justify: inter-word; white-space: pre-line; word-break: break-word; ${dividerRule}">${text1}</div>`;
      flexRow.appendChild(leftColEl);

      if (showDivider) {
        const divEl = document.createElement('div');
        divEl.style.alignSelf = 'stretch';
        divEl.style.width = '1px';
        divEl.style.minWidth = '1px';
        divEl.style.backgroundColor = '#cbd5e1';
        divEl.style.borderLeft = '1px solid #cbd5e1';
        divEl.style.flexShrink = '0';
        flexRow.appendChild(divEl);
      }
    }

    const photoSectionEl = document.createElement('div');
    photoSectionEl.style.width = photoSectionW + 'px';
    photoSectionEl.style.height = '100%';
    photoSectionEl.style.flexShrink = '0';
    photoSectionEl.style.display = 'flex';
    photoSectionEl.style.flexDirection = 'column';
    photoSectionEl.style.overflow = 'hidden';

    const photoDividerRule = showDivider && photoCols > 1 ? 'column-rule: 1px solid #cbd5e1;' : '';
    const text2Html = text2 ? `<div class="broadsheet-story-text" style="--story-line-h: ${lineH}px; font-size: ${summaryFont}px; line-height: ${lineH}px; color: ${rawS.summaryColor || '#1e293b'}; column-count: ${photoCols > 1 ? photoCols : 'unset'}; column-gap: ${colGap}px; column-fill: auto; -webkit-column-fill: auto; flex: 1; height: 100%; overflow: hidden; padding-bottom: 0px; padding-right: 2px; text-align: justify; text-justify: inter-word; white-space: pre-line; word-break: break-word; ${photoDividerRule}">${text2}</div>` : '';
    const text2bHtml = text2b ? `<div class="broadsheet-story-text" style="--story-line-h: ${lineH}px; font-size: ${summaryFont}px; line-height: ${lineH}px; color: ${rawS.summaryColor || '#1e293b'}; column-count: ${photoCols > 1 ? photoCols : 'unset'}; column-gap: ${colGap}px; column-fill: auto; -webkit-column-fill: auto; flex: 1; height: 100%; overflow: hidden; padding-bottom: 0px; padding-right: 2px; text-align: justify; text-justify: inter-word; white-space: pre-line; word-break: break-word; ${photoDividerRule}">${text2b}</div>` : '';

    if (vertAlign === 'bottom') {
      photoSectionEl.innerHTML = text2Html + photoBlockHtml;
    } else if (vertAlign === 'middle') {
      photoSectionEl.innerHTML = text2Html + photoBlockHtml + text2bHtml;
    } else {
      photoSectionEl.innerHTML = photoBlockHtml + text2Html;
    }
    flexRow.appendChild(photoSectionEl);

    if (rightCols > 0) {
      if (showDivider) {
        const divEl = document.createElement('div');
        divEl.style.alignSelf = 'stretch';
        divEl.style.width = '1px';
        divEl.style.minWidth = '1px';
        divEl.style.backgroundColor = '#cbd5e1';
        divEl.style.borderLeft = '1px solid #cbd5e1';
        divEl.style.flexShrink = '0';
        flexRow.appendChild(divEl);
      }

      const rightColEl = document.createElement('div');
      rightColEl.style.width = rightSectionW + 'px';
      rightColEl.style.height = '100%';
      rightColEl.style.flexShrink = '0';
      rightColEl.style.flex = '1';
      rightColEl.style.overflow = 'hidden';
      const rightDividerRule = showDivider && rightCols > 1 ? 'column-rule: 1px solid #cbd5e1;' : '';
      rightColEl.innerHTML = `<div class="broadsheet-story-text" style="--story-line-h: ${lineH}px; font-size: ${summaryFont}px; line-height: ${lineH}px; color: ${rawS.summaryColor || '#1e293b'}; column-count: ${rightCols > 1 ? rightCols : 'unset'}; column-gap: ${colGap}px; column-fill: auto; -webkit-column-fill: auto; height: 100%; flex: 1; overflow: hidden; padding-bottom: 0px; padding-right: 2px; text-align: justify; text-justify: inter-word; white-space: pre-line; word-break: break-word; ${rightDividerRule}">${text3}</div>`;
      flexRow.appendChild(rightColEl);
    }

    bodyEl.appendChild(flexRow);
  }
}

window.runEpaperLayout = function() {
  const pageEls = document.querySelectorAll('.broadsheet-page');
  pageEls.forEach(pageEl => {
    try {
      const pNum = pageEl.id ? pageEl.id.replace(/^page-/, '') : null;
      if (pNum) {
        const slotsVar = window['PAGE_' + pNum + '_SLOTS'];
        const target = document.getElementById('slots-layer-' + pNum);
        if (slotsVar && target) {
          target.innerHTML = '';
          slotsVar.forEach((s, sIdx) => {
            try {
              renderSlot(s, target);
            } catch (slotErr) {
              console.error('Error rendering slot ' + sIdx + ' on page ' + pNum + ':', slotErr);
            }
          });
        }
      }
    } catch (pageErr) {
      console.error('Error in runEpaperLayout for page:', pageErr);
    }
  });
};

document.addEventListener('DOMContentLoaded', function() {
  window.runEpaperLayout();
});
if (document.readyState === 'interactive' || document.readyState === 'complete') {
  window.runEpaperLayout();
}
