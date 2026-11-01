/**
 * Broadsheet Newspaper Layout Engine
 * Calculates pixel-perfect slot geometry (X, Y, Width, Height, Columns, Typography)
 * Designed for standard 14" x 22" (~35cm x 56cm) broadsheet: 1344px x 2112px.
 * Guarantees zero overlaps, uniform gutters, and professional editorial balance for ANY slot count (1 to 10).
 */

export const BROADSHEET_CONFIG = {
  CANVAS_WIDTH: 1344,
  CANVAS_HEIGHT: 2112,
  MARGIN_X: 16,
  GUTTER: 16,
  PAGE_1_TOP_OFFSET: 220, // Space for grand masthead
  PAGE_N_TOP_OFFSET: 130, // Space for sleek section header
  FOOTER_OFFSET: 60
};

export function get1SlotLayout(pageNumber = 1) {
  const isPage1 = Number(pageNumber) === 1;
  const topY = isPage1 ? BROADSHEET_CONFIG.PAGE_1_TOP_OFFSET : BROADSHEET_CONFIG.PAGE_N_TOP_OFFSET;
  const height = isPage1 ? 1780 : 1880;

  return [
    {
      slotIndex: 0,
      slotBadge: 'Slot 1: महा-संपादकीय विशेष (Full Page Feature)',
      categoryBadge: 'महा-कवरेज',
      x: 16,
      y: topY,
      width: 1312,
      height,
      columnsCount: 4,
      columnGap: 20,
      showColumnDivider: true,
      imageWrapMode: 'top-span',
      imageAlignment: 'Center Wrap',
      imageVertAlign: 'top',
      imageWidth: 620,
      imageHeight: 360,
      headlineFontSize: 34,
      subHeadlineFontSize: 18,
      summaryFontSize: 15,
      targetWordCount: 1200,
      editorialRole: 'FULL_PAGE_INVESTIGATIVE'
    }
  ];
}

export function get2SlotLayout(pageNumber = 1) {
  const isPage1 = Number(pageNumber) === 1;
  const topY = isPage1 ? BROADSHEET_CONFIG.PAGE_1_TOP_OFFSET : BROADSHEET_CONFIG.PAGE_N_TOP_OFFSET;
  const totalH = isPage1 ? 1780 : 1880;
  const halfH = Math.floor((totalH - BROADSHEET_CONFIG.GUTTER) / 2);

  const y1 = topY;
  const y2 = y1 + halfH + BROADSHEET_CONFIG.GUTTER;

  return [
    {
      slotIndex: 0,
      slotBadge: 'Slot 1: शीर्ष मुख्य विशेष (Top Lead Feature)',
      categoryBadge: 'लीड स्टोरी',
      x: 16,
      y: y1,
      width: 1312,
      height: halfH,
      columnsCount: 4,
      columnGap: 18,
      showColumnDivider: true,
      imageWrapMode: 'top-span',
      imageAlignment: 'Center Wrap',
      imageVertAlign: 'top',
      imageWidth: 500,
      imageHeight: 280,
      headlineFontSize: 30,
      subHeadlineFontSize: 17,
      summaryFontSize: 14.5,
      targetWordCount: 850,
      editorialRole: 'GRAND_LEAD_HALF'
    },
    {
      slotIndex: 1,
      slotBadge: 'Slot 2: प्रमुख इन-डेप्थ विश्लेषण (Bottom Anchor Spread)',
      categoryBadge: 'विशेष विश्लेषण',
      x: 16,
      y: y2,
      width: 1312,
      height: halfH,
      columnsCount: 4,
      columnGap: 18,
      showColumnDivider: true,
      imageWrapMode: 'top-span',
      imageAlignment: 'Center Wrap',
      imageVertAlign: 'top',
      imageWidth: 500,
      imageHeight: 280,
      headlineFontSize: 28,
      subHeadlineFontSize: 16,
      summaryFontSize: 14.5,
      targetWordCount: 850,
      editorialRole: 'GRAND_BOTTOM_HALF'
    }
  ];
}

export function get3SlotLayout(pageNumber = 1) {
  const isPage1 = Number(pageNumber) === 1;
  const topY = isPage1 ? BROADSHEET_CONFIG.PAGE_1_TOP_OFFSET : BROADSHEET_CONFIG.PAGE_N_TOP_OFFSET;
  const totalH = isPage1 ? 1780 : 1880;
  const tier1H = isPage1 ? 620 : 660;
  const tier2H = totalH - tier1H - BROADSHEET_CONFIG.GUTTER;

  const y1 = topY;
  const y2 = y1 + tier1H + BROADSHEET_CONFIG.GUTTER;

  return [
    {
      slotIndex: 0,
      slotBadge: 'Slot 1: सुपर मुख्य बैनर (Full Width Lead)',
      categoryBadge: 'लीड स्टोरी',
      x: 16,
      y: y1,
      width: 1312,
      height: tier1H,
      columnsCount: 4,
      columnGap: 18,
      showColumnDivider: true,
      imageWrapMode: 'top-span',
      imageAlignment: 'Center Wrap',
      imageVertAlign: 'top',
      imageWidth: 520,
      imageHeight: 280,
      headlineFontSize: 30,
      subHeadlineFontSize: 17,
      summaryFontSize: 14.5,
      targetWordCount: 650,
      editorialRole: 'HERO_BANNER'
    },
    {
      slotIndex: 1,
      slotBadge: 'Slot 2: बायाँ स्तंभ विशेष (Left Broadsheet Column)',
      categoryBadge: 'ग्राउंड रिपोर्ट',
      x: 16,
      y: y2,
      width: 648,
      height: tier2H,
      columnsCount: 2,
      columnGap: 16,
      showColumnDivider: true,
      imageWrapMode: 'auto',
      imageAlignment: 'Right',
      imageVertAlign: 'top',
      imageWidth: 260,
      imageHeight: 180,
      headlineFontSize: 24,
      subHeadlineFontSize: 15,
      summaryFontSize: 14,
      targetWordCount: 650,
      editorialRole: 'LEFT_PILLAR'
    },
    {
      slotIndex: 2,
      slotBadge: 'Slot 3: दायाँ स्तंभ विश्लेषण (Right Broadsheet Column)',
      categoryBadge: 'विशेष विश्लेषण',
      x: 680,
      y: y2,
      width: 648,
      height: tier2H,
      columnsCount: 2,
      columnGap: 16,
      showColumnDivider: true,
      imageWrapMode: 'auto',
      imageAlignment: 'Right',
      imageVertAlign: 'top',
      imageWidth: 260,
      imageHeight: 180,
      headlineFontSize: 24,
      subHeadlineFontSize: 15,
      summaryFontSize: 14,
      targetWordCount: 650,
      editorialRole: 'RIGHT_PILLAR'
    }
  ];
}

export function get4SlotLayout(pageNumber = 1) {
  const isPage1 = Number(pageNumber) === 1;
  const topY = isPage1 ? BROADSHEET_CONFIG.PAGE_1_TOP_OFFSET : BROADSHEET_CONFIG.PAGE_N_TOP_OFFSET;
  const totalH = isPage1 ? 1780 : 1880;
  const halfH = Math.floor((totalH - BROADSHEET_CONFIG.GUTTER) / 2);

  const y1 = topY;
  const y2 = y1 + halfH + BROADSHEET_CONFIG.GUTTER;

  return [
    {
      slotIndex: 0,
      slotBadge: 'Slot 1: ऊपरी बायाँ क्वाड्रंट',
      categoryBadge: 'लीड स्टोरी',
      x: 16,
      y: y1,
      width: 648,
      height: halfH,
      columnsCount: 2,
      columnGap: 16,
      showColumnDivider: true,
      imageWrapMode: 'auto',
      imageAlignment: 'Right',
      imageVertAlign: 'top',
      imageWidth: 260,
      imageHeight: 160,
      headlineFontSize: 24,
      subHeadlineFontSize: 15,
      summaryFontSize: 14,
      targetWordCount: 500,
      editorialRole: 'TOP_LEFT_QUAD'
    },
    {
      slotIndex: 1,
      slotBadge: 'Slot 2: ऊपरी दायाँ क्वाड्रंट',
      categoryBadge: 'विशेष रिपोर्ट',
      x: 680,
      y: y1,
      width: 648,
      height: halfH,
      columnsCount: 2,
      columnGap: 16,
      showColumnDivider: true,
      imageWrapMode: 'auto',
      imageAlignment: 'Right',
      imageVertAlign: 'top',
      imageWidth: 260,
      imageHeight: 160,
      headlineFontSize: 24,
      subHeadlineFontSize: 15,
      summaryFontSize: 14,
      targetWordCount: 500,
      editorialRole: 'TOP_RIGHT_QUAD'
    },
    {
      slotIndex: 2,
      slotBadge: 'Slot 3: निचला बायाँ क्वाड्रंट',
      categoryBadge: 'इन-डेप्थ',
      x: 16,
      y: y2,
      width: 648,
      height: halfH,
      columnsCount: 2,
      columnGap: 16,
      showColumnDivider: true,
      imageWrapMode: 'auto',
      imageAlignment: 'Left',
      imageVertAlign: 'top',
      imageWidth: 260,
      imageHeight: 160,
      headlineFontSize: 24,
      subHeadlineFontSize: 15,
      summaryFontSize: 14,
      targetWordCount: 500,
      editorialRole: 'BOTTOM_LEFT_QUAD'
    },
    {
      slotIndex: 3,
      slotBadge: 'Slot 4: निचला दायाँ क्वाड्रंट',
      categoryBadge: 'विशेष एंकर',
      x: 680,
      y: y2,
      width: 648,
      height: halfH,
      columnsCount: 2,
      columnGap: 16,
      showColumnDivider: true,
      imageWrapMode: 'auto',
      imageAlignment: 'Right',
      imageVertAlign: 'top',
      imageWidth: 260,
      imageHeight: 160,
      headlineFontSize: 24,
      subHeadlineFontSize: 15,
      summaryFontSize: 14,
      targetWordCount: 500,
      editorialRole: 'BOTTOM_RIGHT_QUAD'
    }
  ];
}

export function get5SlotLayout(pageNumber = 1) {
  const isPage1 = Number(pageNumber) === 1;
  const topY = isPage1 ? BROADSHEET_CONFIG.PAGE_1_TOP_OFFSET : BROADSHEET_CONFIG.PAGE_N_TOP_OFFSET;
  const tier1H = isPage1 ? 540 : 580;
  const remainingH = (isPage1 ? 1780 : 1880) - tier1H - (BROADSHEET_CONFIG.GUTTER * 2);
  const midH = Math.floor(remainingH / 2);

  const y1 = topY;
  const y2 = y1 + tier1H + BROADSHEET_CONFIG.GUTTER;
  const y3 = y2 + midH + BROADSHEET_CONFIG.GUTTER;

  return [
    {
      slotIndex: 0,
      slotBadge: 'Slot 1: मुख्य लीड बैनर',
      categoryBadge: 'लीड स्टोरी',
      x: 16,
      y: y1,
      width: 1312,
      height: tier1H,
      columnsCount: 4,
      columnGap: 16,
      showColumnDivider: true,
      imageWrapMode: 'top-span',
      imageAlignment: 'Center Wrap',
      imageVertAlign: 'top',
      imageWidth: 480,
      imageHeight: 250,
      headlineFontSize: 28,
      subHeadlineFontSize: 16,
      summaryFontSize: 14,
      targetWordCount: 550,
      editorialRole: 'LEAD_HERO'
    },
    {
      slotIndex: 1,
      slotBadge: 'Slot 2: मध्य बायाँ कवरेज',
      categoryBadge: 'ग्राउंड रिपोर्ट',
      x: 16,
      y: y2,
      width: 648,
      height: midH,
      columnsCount: 2,
      columnGap: 16,
      showColumnDivider: true,
      imageWrapMode: 'auto',
      imageAlignment: 'Left',
      imageVertAlign: 'top',
      imageWidth: 240,
      imageHeight: 150,
      headlineFontSize: 22,
      subHeadlineFontSize: 15,
      summaryFontSize: 14,
      targetWordCount: 400,
      editorialRole: 'MID_LEFT'
    },
    {
      slotIndex: 2,
      slotBadge: 'Slot 3: मध्य दायाँ विश्लेषण',
      categoryBadge: 'विशेष विश्लेषण',
      x: 680,
      y: y2,
      width: 648,
      height: midH,
      columnsCount: 2,
      columnGap: 16,
      showColumnDivider: true,
      imageWrapMode: 'auto',
      imageAlignment: 'Right',
      imageVertAlign: 'top',
      imageWidth: 240,
      imageHeight: 150,
      headlineFontSize: 22,
      subHeadlineFontSize: 15,
      summaryFontSize: 14,
      targetWordCount: 400,
      editorialRole: 'MID_RIGHT'
    },
    {
      slotIndex: 3,
      slotBadge: 'Slot 4: निचला बायाँ एंकर',
      categoryBadge: 'इन-डेप्थ',
      x: 16,
      y: y3,
      width: 648,
      height: midH,
      columnsCount: 2,
      columnGap: 16,
      showColumnDivider: true,
      imageWrapMode: 'auto',
      imageAlignment: 'Left',
      imageVertAlign: 'top',
      imageWidth: 240,
      imageHeight: 150,
      headlineFontSize: 22,
      subHeadlineFontSize: 15,
      summaryFontSize: 14,
      targetWordCount: 400,
      editorialRole: 'BOTTOM_LEFT'
    },
    {
      slotIndex: 4,
      slotBadge: 'Slot 5: निचला दायाँ एंकर',
      categoryBadge: 'विशेष एंकर',
      x: 680,
      y: y3,
      width: 648,
      height: midH,
      columnsCount: 2,
      columnGap: 16,
      showColumnDivider: true,
      imageWrapMode: 'auto',
      imageAlignment: 'Right',
      imageVertAlign: 'top',
      imageWidth: 240,
      imageHeight: 150,
      headlineFontSize: 22,
      subHeadlineFontSize: 15,
      summaryFontSize: 14,
      targetWordCount: 400,
      editorialRole: 'BOTTOM_RIGHT'
    }
  ];
}

export function get6SlotLayout(pageNumber = 1) {
  const isPage1 = Number(pageNumber) === 1;
  const topY = isPage1 ? BROADSHEET_CONFIG.PAGE_1_TOP_OFFSET : BROADSHEET_CONFIG.PAGE_N_TOP_OFFSET;

  const tier1H = isPage1 ? 550 : 590;
  const tier2H = isPage1 ? 620 : 660;
  const tier3H = isPage1 ? 620 : 660;

  const y1 = topY;
  const y2 = y1 + tier1H + BROADSHEET_CONFIG.GUTTER;
  const y3 = y2 + tier2H + BROADSHEET_CONFIG.GUTTER;

  return [
    {
      slotIndex: 0,
      slotBadge: 'Slot 1: मुख्य लीड (सुपर बैनर)',
      categoryBadge: 'लीड स्टोरी',
      x: 16,
      y: y1,
      width: 848,
      height: tier1H,
      columnsCount: 3,
      columnGap: 16,
      showColumnDivider: true,
      imageWrapMode: 'top-span',
      imageAlignment: 'Center Wrap',
      imageVertAlign: 'top',
      imageWidth: 460,
      imageHeight: 260,
      headlineFontSize: 28,
      subHeadlineFontSize: 16,
      summaryFontSize: 14,
      targetWordCount: 450,
      editorialRole: 'LEAD_HERO'
    },
    {
      slotIndex: 1,
      slotBadge: 'Slot 2: प्रमुख विश्लेषण (दायाँ कॉलम)',
      categoryBadge: 'विशेष रिपोर्ट',
      x: 880,
      y: y1,
      width: 448,
      height: tier1H,
      columnsCount: 1,
      columnGap: 14,
      showColumnDivider: false,
      imageWrapMode: 'auto',
      imageAlignment: 'Right',
      imageVertAlign: 'top',
      imageWidth: 220,
      imageHeight: 150,
      headlineFontSize: 22,
      subHeadlineFontSize: 15,
      summaryFontSize: 14,
      targetWordCount: 300,
      editorialRole: 'TOP_SIDEBAR'
    },
    {
      slotIndex: 2,
      slotBadge: 'Slot 3: मध्य कवरेज बायाँ',
      categoryBadge: 'ग्राउंड रिपोर्ट',
      x: 16,
      y: y2,
      width: 648,
      height: tier2H,
      columnsCount: 2,
      columnGap: 16,
      showColumnDivider: true,
      imageWrapMode: 'auto',
      imageAlignment: 'Left',
      imageVertAlign: 'top',
      imageWidth: 240,
      imageHeight: 150,
      headlineFontSize: 22,
      subHeadlineFontSize: 15,
      summaryFontSize: 14,
      targetWordCount: 380,
      editorialRole: 'MID_LEFT'
    },
    {
      slotIndex: 3,
      slotBadge: 'Slot 4: मध्य कवरेज दायाँ',
      categoryBadge: 'इन-डेप्थ',
      x: 680,
      y: y2,
      width: 648,
      height: tier2H,
      columnsCount: 2,
      columnGap: 16,
      showColumnDivider: true,
      imageWrapMode: 'auto',
      imageAlignment: 'Right',
      imageVertAlign: 'top',
      imageWidth: 240,
      imageHeight: 150,
      headlineFontSize: 22,
      subHeadlineFontSize: 15,
      summaryFontSize: 14,
      targetWordCount: 380,
      editorialRole: 'MID_RIGHT'
    },
    {
      slotIndex: 4,
      slotBadge: 'Slot 5: निचला एंकर बायाँ',
      categoryBadge: 'विशेष विश्लेषण',
      x: 16,
      y: y3,
      width: 648,
      height: tier3H,
      columnsCount: 2,
      columnGap: 16,
      showColumnDivider: true,
      imageWrapMode: 'auto',
      imageAlignment: 'Left',
      imageVertAlign: 'top',
      imageWidth: 240,
      imageHeight: 150,
      headlineFontSize: 22,
      subHeadlineFontSize: 15,
      summaryFontSize: 14,
      targetWordCount: 360,
      editorialRole: 'BOTTOM_LEFT_ANCHOR'
    },
    {
      slotIndex: 5,
      slotBadge: 'Slot 6: निचला एंकर दायाँ',
      categoryBadge: 'विशेष एंकर',
      x: 680,
      y: y3,
      width: 648,
      height: tier3H,
      columnsCount: 2,
      columnGap: 16,
      showColumnDivider: true,
      imageWrapMode: 'auto',
      imageAlignment: 'Right',
      imageVertAlign: 'top',
      imageWidth: 240,
      imageHeight: 150,
      headlineFontSize: 22,
      subHeadlineFontSize: 15,
      summaryFontSize: 14,
      targetWordCount: 360,
      editorialRole: 'BOTTOM_RIGHT_ANCHOR'
    }
  ];
}

export function get7SlotLayout(pageNumber = 1) {
  const isPage1 = Number(pageNumber) === 1;
  const topY = isPage1 ? BROADSHEET_CONFIG.PAGE_1_TOP_OFFSET : BROADSHEET_CONFIG.PAGE_N_TOP_OFFSET;

  const tier1H = isPage1 ? 520 : 560;
  const tier2H = isPage1 ? 580 : 610;
  const tier3H = isPage1 ? 660 : 700;

  const y1 = topY;
  const y2 = y1 + tier1H + BROADSHEET_CONFIG.GUTTER;
  const y3 = y2 + tier2H + BROADSHEET_CONFIG.GUTTER;

  return [
    {
      slotIndex: 0,
      slotBadge: 'Slot 1: लीड समाचार (मुख्य बैनर)',
      categoryBadge: 'लीड स्टोरी',
      x: 16,
      y: y1,
      width: 848,
      height: tier1H,
      columnsCount: 3,
      columnGap: 16,
      showColumnDivider: true,
      imageWrapMode: 'top-span',
      imageAlignment: 'Center Wrap',
      imageVertAlign: 'top',
      imageWidth: 460,
      imageHeight: 260,
      headlineFontSize: 28,
      subHeadlineFontSize: 16,
      summaryFontSize: 14,
      targetWordCount: 450,
      editorialRole: 'LEAD_HERO'
    },
    {
      slotIndex: 1,
      slotBadge: 'Slot 2: शीर्ष विश्लेषण (दायाँ कॉलम)',
      categoryBadge: 'विशेष रिपोर्ट',
      x: 880,
      y: y1,
      width: 448,
      height: tier1H,
      columnsCount: 1,
      columnGap: 14,
      showColumnDivider: false,
      imageWrapMode: 'auto',
      imageAlignment: 'Right',
      imageVertAlign: 'top',
      imageWidth: 220,
      imageHeight: 150,
      headlineFontSize: 22,
      subHeadlineFontSize: 15,
      summaryFontSize: 14,
      targetWordCount: 280,
      editorialRole: 'TOP_SIDEBAR'
    },
    {
      slotIndex: 2,
      slotBadge: 'Slot 3: ग्राउंड रिपोर्ट (बायाँ कॉलम)',
      categoryBadge: 'ग्राउंड ज़ीरो',
      x: 16,
      y: y2,
      width: 416,
      height: tier2H,
      columnsCount: 1,
      columnGap: 14,
      showColumnDivider: false,
      imageWrapMode: 'auto',
      imageAlignment: 'Left',
      imageVertAlign: 'top',
      imageWidth: 180,
      imageHeight: 140,
      headlineFontSize: 20,
      subHeadlineFontSize: 14,
      summaryFontSize: 13,
      targetWordCount: 260,
      editorialRole: 'MID_LEFT'
    },
    {
      slotIndex: 3,
      slotBadge: 'Slot 4: विशेष इन-डेप्थ (मध्य कॉलम)',
      categoryBadge: 'इन-डेप्थ',
      x: 448,
      y: y2,
      width: 416,
      height: tier2H,
      columnsCount: 1,
      columnGap: 14,
      showColumnDivider: false,
      imageWrapMode: 'auto',
      imageAlignment: 'Right',
      imageVertAlign: 'top',
      imageWidth: 180,
      imageHeight: 140,
      headlineFontSize: 20,
      subHeadlineFontSize: 14,
      summaryFontSize: 13,
      targetWordCount: 260,
      editorialRole: 'MID_CENTER'
    },
    {
      slotIndex: 4,
      slotBadge: 'Slot 5: रणनीतिक समीक्षा (दायाँ कॉलम)',
      categoryBadge: 'विशेष विश्लेषण',
      x: 880,
      y: y2,
      width: 448,
      height: tier2H,
      columnsCount: 1,
      columnGap: 14,
      showColumnDivider: false,
      imageWrapMode: 'auto',
      imageAlignment: 'Left',
      imageVertAlign: 'top',
      imageWidth: 190,
      imageHeight: 140,
      headlineFontSize: 20,
      subHeadlineFontSize: 14,
      summaryFontSize: 13,
      targetWordCount: 270,
      editorialRole: 'MID_RIGHT'
    },
    {
      slotIndex: 5,
      slotBadge: 'Slot 6: क्षेत्रीय व स्थानीय एंकर (बायाँ एंकर)',
      categoryBadge: 'विस्तृत कवरेज',
      x: 16,
      y: y3,
      width: 648,
      height: tier3H,
      columnsCount: 2,
      columnGap: 16,
      showColumnDivider: true,
      imageWrapMode: 'auto',
      imageAlignment: 'Right',
      imageVertAlign: 'top',
      imageWidth: 260,
      imageHeight: 160,
      headlineFontSize: 22,
      subHeadlineFontSize: 15,
      summaryFontSize: 14,
      targetWordCount: 380,
      editorialRole: 'BOTTOM_LEFT_ANCHOR'
    },
    {
      slotIndex: 6,
      slotBadge: 'Slot 7: राष्ट्रीय/वैश्विक एंकर (दायाँ एंकर)',
      categoryBadge: 'विशेष एंकर',
      x: 680,
      y: y3,
      width: 648,
      height: tier3H,
      columnsCount: 2,
      columnGap: 16,
      showColumnDivider: true,
      imageWrapMode: 'auto',
      imageAlignment: 'Right',
      imageVertAlign: 'top',
      imageWidth: 260,
      imageHeight: 160,
      headlineFontSize: 22,
      subHeadlineFontSize: 15,
      summaryFontSize: 14,
      targetWordCount: 390,
      editorialRole: 'BOTTOM_RIGHT_ANCHOR'
    }
  ];
}

export function get8SlotLayout(pageNumber = 1) {
  const isPage1 = Number(pageNumber) === 1;
  const topY = isPage1 ? BROADSHEET_CONFIG.PAGE_1_TOP_OFFSET : BROADSHEET_CONFIG.PAGE_N_TOP_OFFSET;

  const tier1H = isPage1 ? 520 : 550;
  const tier2H = isPage1 ? 580 : 610;
  const tier3H = isPage1 ? 660 : 700;

  const y1 = topY;
  const y2 = y1 + tier1H + BROADSHEET_CONFIG.GUTTER;
  const y3 = y2 + tier2H + BROADSHEET_CONFIG.GUTTER;

  return [
    {
      slotIndex: 0,
      slotBadge: 'Slot 1: मुख्य लीड (सुपर बैनर)',
      categoryBadge: 'लीड स्टोरी',
      x: 16,
      y: y1,
      width: 848,
      height: tier1H,
      columnsCount: 3,
      columnGap: 16,
      showColumnDivider: true,
      imageWrapMode: 'top-span',
      imageAlignment: 'Center Wrap',
      imageVertAlign: 'top',
      imageWidth: 460,
      imageHeight: 260,
      headlineFontSize: 28,
      subHeadlineFontSize: 16,
      summaryFontSize: 14,
      targetWordCount: 420,
      editorialRole: 'LEAD_HERO'
    },
    {
      slotIndex: 1,
      slotBadge: 'Slot 2: शीर्ष विश्लेषण (दायाँ कॉलम)',
      categoryBadge: 'विशेष रिपोर्ट',
      x: 880,
      y: y1,
      width: 448,
      height: tier1H,
      columnsCount: 1,
      columnGap: 14,
      showColumnDivider: false,
      imageWrapMode: 'auto',
      imageAlignment: 'Right',
      imageVertAlign: 'top',
      imageWidth: 220,
      imageHeight: 150,
      headlineFontSize: 22,
      subHeadlineFontSize: 15,
      summaryFontSize: 14,
      targetWordCount: 280,
      editorialRole: 'TOP_SIDEBAR'
    },
    {
      slotIndex: 2,
      slotBadge: 'Slot 3: मध्य बायाँ कॉलम',
      categoryBadge: 'ग्राउंड रिपोर्ट',
      x: 16,
      y: y2,
      width: 416,
      height: tier2H,
      columnsCount: 1,
      columnGap: 14,
      showColumnDivider: false,
      imageWrapMode: 'auto',
      imageAlignment: 'Left',
      imageVertAlign: 'top',
      imageWidth: 180,
      imageHeight: 140,
      headlineFontSize: 20,
      subHeadlineFontSize: 14,
      summaryFontSize: 13,
      targetWordCount: 240,
      editorialRole: 'MID_LEFT'
    },
    {
      slotIndex: 3,
      slotBadge: 'Slot 4: मध्य केंद्र कॉलम',
      categoryBadge: 'इन-डेप्थ',
      x: 448,
      y: y2,
      width: 416,
      height: tier2H,
      columnsCount: 1,
      columnGap: 14,
      showColumnDivider: false,
      imageWrapMode: 'auto',
      imageAlignment: 'Right',
      imageVertAlign: 'top',
      imageWidth: 180,
      imageHeight: 140,
      headlineFontSize: 20,
      subHeadlineFontSize: 14,
      summaryFontSize: 13,
      targetWordCount: 240,
      editorialRole: 'MID_CENTER'
    },
    {
      slotIndex: 4,
      slotBadge: 'Slot 5: मध्य दायाँ कॉलम',
      categoryBadge: 'विशेष विश्लेषण',
      x: 880,
      y: y2,
      width: 448,
      height: tier2H,
      columnsCount: 1,
      columnGap: 14,
      showColumnDivider: false,
      imageWrapMode: 'auto',
      imageAlignment: 'Left',
      imageVertAlign: 'top',
      imageWidth: 190,
      imageHeight: 140,
      headlineFontSize: 20,
      subHeadlineFontSize: 14,
      summaryFontSize: 13,
      targetWordCount: 250,
      editorialRole: 'MID_RIGHT'
    },
    {
      slotIndex: 5,
      slotBadge: 'Slot 6: निचला बायाँ एंकर',
      categoryBadge: 'क्षेत्रीय',
      x: 16,
      y: y3,
      width: 416,
      height: tier3H,
      columnsCount: 1,
      columnGap: 14,
      showColumnDivider: false,
      imageWrapMode: 'auto',
      imageAlignment: 'Left',
      imageVertAlign: 'top',
      imageWidth: 180,
      imageHeight: 140,
      headlineFontSize: 20,
      subHeadlineFontSize: 14,
      summaryFontSize: 13,
      targetWordCount: 260,
      editorialRole: 'BOTTOM_LEFT'
    },
    {
      slotIndex: 6,
      slotBadge: 'Slot 7: निचला केंद्र एंकर',
      categoryBadge: 'राष्ट्रीय',
      x: 448,
      y: y3,
      width: 416,
      height: tier3H,
      columnsCount: 1,
      columnGap: 14,
      showColumnDivider: false,
      imageWrapMode: 'auto',
      imageAlignment: 'Right',
      imageVertAlign: 'top',
      imageWidth: 180,
      imageHeight: 140,
      headlineFontSize: 20,
      subHeadlineFontSize: 14,
      summaryFontSize: 13,
      targetWordCount: 260,
      editorialRole: 'BOTTOM_CENTER'
    },
    {
      slotIndex: 7,
      slotBadge: 'Slot 8: निचला दायाँ एंकर',
      categoryBadge: 'विशेष एंकर',
      x: 880,
      y: y3,
      width: 448,
      height: tier3H,
      columnsCount: 1,
      columnGap: 14,
      showColumnDivider: false,
      imageWrapMode: 'auto',
      imageAlignment: 'Right',
      imageVertAlign: 'top',
      imageWidth: 190,
      imageHeight: 140,
      headlineFontSize: 20,
      subHeadlineFontSize: 14,
      summaryFontSize: 13,
      targetWordCount: 270,
      editorialRole: 'BOTTOM_RIGHT'
    }
  ];
}

export function get9SlotLayout(pageNumber = 1) {
  const isPage1 = Number(pageNumber) === 1;
  const topY = isPage1 ? BROADSHEET_CONFIG.PAGE_1_TOP_OFFSET : BROADSHEET_CONFIG.PAGE_N_TOP_OFFSET;

  const tier1H = isPage1 ? 500 : 540;
  const tier2H = isPage1 ? 580 : 610;
  const tier3H = isPage1 ? 680 : 710;

  const y1 = topY;
  const y2 = y1 + tier1H + BROADSHEET_CONFIG.GUTTER;
  const y3 = y2 + tier2H + BROADSHEET_CONFIG.GUTTER;

  // 4 columns across bottom: width 316 each, gap 16 (16 + 316 + 16 + 316 + 16 + 316 + 16 + 316 = 1328px)
  const bW = 316;
  const bG = 16;

  return [
    {
      slotIndex: 0,
      slotBadge: 'Slot 1: मुख्य लीड (सुपर बैनर)',
      categoryBadge: 'लीड स्टोरी',
      x: 16,
      y: y1,
      width: 848,
      height: tier1H,
      columnsCount: 3,
      columnGap: 16,
      showColumnDivider: true,
      imageWrapMode: 'top-span',
      imageAlignment: 'Center Wrap',
      imageVertAlign: 'top',
      imageWidth: 440,
      imageHeight: 240,
      headlineFontSize: 28,
      subHeadlineFontSize: 16,
      summaryFontSize: 14,
      targetWordCount: 400,
      editorialRole: 'LEAD_HERO'
    },
    {
      slotIndex: 1,
      slotBadge: 'Slot 2: शीर्ष विश्लेषण (दायाँ कॉलम)',
      categoryBadge: 'विशेष रिपोर्ट',
      x: 880,
      y: y1,
      width: 448,
      height: tier1H,
      columnsCount: 1,
      columnGap: 14,
      showColumnDivider: false,
      imageWrapMode: 'auto',
      imageAlignment: 'Right',
      imageVertAlign: 'top',
      imageWidth: 200,
      imageHeight: 140,
      headlineFontSize: 22,
      subHeadlineFontSize: 15,
      summaryFontSize: 14,
      targetWordCount: 260,
      editorialRole: 'TOP_SIDEBAR'
    },
    {
      slotIndex: 2,
      slotBadge: 'Slot 3: मध्य बायाँ कॉलम',
      categoryBadge: 'ग्राउंड रिपोर्ट',
      x: 16,
      y: y2,
      width: 416,
      height: tier2H,
      columnsCount: 1,
      columnGap: 14,
      showColumnDivider: false,
      imageWrapMode: 'auto',
      imageAlignment: 'Left',
      imageVertAlign: 'top',
      imageWidth: 170,
      imageHeight: 130,
      headlineFontSize: 20,
      subHeadlineFontSize: 14,
      summaryFontSize: 13,
      targetWordCount: 230,
      editorialRole: 'MID_LEFT'
    },
    {
      slotIndex: 3,
      slotBadge: 'Slot 4: मध्य केंद्र कॉलम',
      categoryBadge: 'इन-डेप्थ',
      x: 448,
      y: y2,
      width: 416,
      height: tier2H,
      columnsCount: 1,
      columnGap: 14,
      showColumnDivider: false,
      imageWrapMode: 'auto',
      imageAlignment: 'Right',
      imageVertAlign: 'top',
      imageWidth: 170,
      imageHeight: 130,
      headlineFontSize: 20,
      subHeadlineFontSize: 14,
      summaryFontSize: 13,
      targetWordCount: 230,
      editorialRole: 'MID_CENTER'
    },
    {
      slotIndex: 4,
      slotBadge: 'Slot 5: मध्य दायाँ कॉलम',
      categoryBadge: 'विशेष विश्लेषण',
      x: 880,
      y: y2,
      width: 448,
      height: tier2H,
      columnsCount: 1,
      columnGap: 14,
      showColumnDivider: false,
      imageWrapMode: 'auto',
      imageAlignment: 'Left',
      imageVertAlign: 'top',
      imageWidth: 170,
      imageHeight: 130,
      headlineFontSize: 20,
      subHeadlineFontSize: 14,
      summaryFontSize: 13,
      targetWordCount: 240,
      editorialRole: 'MID_RIGHT'
    },
    {
      slotIndex: 5,
      slotBadge: 'Slot 6: निचला कॉलम 1',
      categoryBadge: 'लोकल',
      x: 16,
      y: y3,
      width: bW,
      height: tier3H,
      columnsCount: 1,
      columnGap: 12,
      showColumnDivider: false,
      imageWrapMode: 'auto',
      imageAlignment: 'Center Wrap',
      imageVertAlign: 'top',
      imageWidth: 150,
      imageHeight: 120,
      headlineFontSize: 18,
      subHeadlineFontSize: 13,
      summaryFontSize: 12.5,
      targetWordCount: 200,
      editorialRole: 'BOTTOM_COL_1'
    },
    {
      slotIndex: 6,
      slotBadge: 'Slot 7: निचला कॉलम 2',
      categoryBadge: 'राज्य',
      x: 16 + (bW + bG),
      y: y3,
      width: bW,
      height: tier3H,
      columnsCount: 1,
      columnGap: 12,
      showColumnDivider: false,
      imageWrapMode: 'auto',
      imageAlignment: 'Center Wrap',
      imageVertAlign: 'top',
      imageWidth: 150,
      imageHeight: 120,
      headlineFontSize: 18,
      subHeadlineFontSize: 13,
      summaryFontSize: 12.5,
      targetWordCount: 200,
      editorialRole: 'BOTTOM_COL_2'
    },
    {
      slotIndex: 7,
      slotBadge: 'Slot 8: निचला कॉलम 3',
      categoryBadge: 'देश',
      x: 16 + (bW + bG) * 2,
      y: y3,
      width: bW,
      height: tier3H,
      columnsCount: 1,
      columnGap: 12,
      showColumnDivider: false,
      imageWrapMode: 'auto',
      imageAlignment: 'Center Wrap',
      imageVertAlign: 'top',
      imageWidth: 150,
      imageHeight: 120,
      headlineFontSize: 18,
      subHeadlineFontSize: 13,
      summaryFontSize: 12.5,
      targetWordCount: 200,
      editorialRole: 'BOTTOM_COL_3'
    },
    {
      slotIndex: 8,
      slotBadge: 'Slot 9: निचला कॉलम 4',
      categoryBadge: 'विशेष',
      x: 16 + (bW + bG) * 3,
      y: y3,
      width: bW,
      height: tier3H,
      columnsCount: 1,
      columnGap: 12,
      showColumnDivider: false,
      imageWrapMode: 'auto',
      imageAlignment: 'Center Wrap',
      imageVertAlign: 'top',
      imageWidth: 150,
      imageHeight: 120,
      headlineFontSize: 18,
      subHeadlineFontSize: 13,
      summaryFontSize: 12.5,
      targetWordCount: 200,
      editorialRole: 'BOTTOM_COL_4'
    }
  ];
}

export function get10SlotLayout(pageNumber = 1) {
  const isPage1 = Number(pageNumber) === 1;
  const topY = isPage1 ? BROADSHEET_CONFIG.PAGE_1_TOP_OFFSET : BROADSHEET_CONFIG.PAGE_N_TOP_OFFSET;

  const tier1H = isPage1 ? 480 : 510;
  const tier2H = isPage1 ? 520 : 540;
  const tier3H = isPage1 ? 740 : 780;

  const y1 = topY;
  const y2 = y1 + tier1H + BROADSHEET_CONFIG.GUTTER;
  const y3 = y2 + tier2H + BROADSHEET_CONFIG.GUTTER;

  // Tier 3: 5 columns across bottom (margins 16 left + 16 right = 1312 width)
  // 5 slots: width 248 each, gap 18 (16 + 248 + 18 + 248 + 18 + 248 + 18 + 248 + 18 + 248 + 16 = 1344px)
  const bW = 248;
  const bG = 18;

  return [
    // Tier 1: Lead Hero + Top Sidebar (2 slots)
    {
      slotIndex: 0,
      slotBadge: 'Slot 1: मुख्य लीड (सुपर बैनर)',
      categoryBadge: 'लीड स्टोरी',
      x: 16,
      y: y1,
      width: 864,
      height: tier1H,
      columnsCount: 3,
      columnGap: 16,
      showColumnDivider: true,
      imageWrapMode: 'top-span',
      imageAlignment: 'Center Wrap',
      imageVertAlign: 'top',
      imageWidth: 440,
      imageHeight: 230,
      headlineFontSize: 28,
      subHeadlineFontSize: 16,
      summaryFontSize: 14,
      targetWordCount: 380,
      editorialRole: 'LEAD_HERO'
    },
    {
      slotIndex: 1,
      slotBadge: 'Slot 2: शीर्ष विश्लेषण (दायाँ कॉलम)',
      categoryBadge: 'विशेष रिपोर्ट',
      x: 896,
      y: y1,
      width: 432,
      height: tier1H,
      columnsCount: 1,
      columnGap: 14,
      showColumnDivider: false,
      imageWrapMode: 'auto',
      imageAlignment: 'Right',
      imageVertAlign: 'top',
      imageWidth: 190,
      imageHeight: 135,
      headlineFontSize: 22,
      subHeadlineFontSize: 15,
      summaryFontSize: 14,
      targetWordCount: 250,
      editorialRole: 'TOP_SIDEBAR'
    },

    // Tier 2: 3 Columns across Middle (3 slots)
    {
      slotIndex: 2,
      slotBadge: 'Slot 3: मध्य बायाँ कॉलम',
      categoryBadge: 'ग्राउंड रिपोर्ट',
      x: 16,
      y: y2,
      width: 424,
      height: tier2H,
      columnsCount: 1,
      columnGap: 14,
      showColumnDivider: false,
      imageWrapMode: 'auto',
      imageAlignment: 'Left',
      imageVertAlign: 'top',
      imageWidth: 160,
      imageHeight: 120,
      headlineFontSize: 20,
      subHeadlineFontSize: 14,
      summaryFontSize: 13,
      targetWordCount: 220,
      editorialRole: 'MID_LEFT'
    },
    {
      slotIndex: 3,
      slotBadge: 'Slot 4: मध्य केंद्र कॉलम',
      categoryBadge: 'इन-डेप्थ',
      x: 456,
      y: y2,
      width: 424,
      height: tier2H,
      columnsCount: 1,
      columnGap: 14,
      showColumnDivider: false,
      imageWrapMode: 'auto',
      imageAlignment: 'Right',
      imageVertAlign: 'top',
      imageWidth: 160,
      imageHeight: 120,
      headlineFontSize: 20,
      subHeadlineFontSize: 14,
      summaryFontSize: 13,
      targetWordCount: 220,
      editorialRole: 'MID_CENTER'
    },
    {
      slotIndex: 4,
      slotBadge: 'Slot 5: मध्य दायाँ कॉलम',
      categoryBadge: 'विशेष विश्लेषण',
      x: 896,
      y: y2,
      width: 432,
      height: tier2H,
      columnsCount: 1,
      columnGap: 14,
      showColumnDivider: false,
      imageWrapMode: 'auto',
      imageAlignment: 'Left',
      imageVertAlign: 'top',
      imageWidth: 160,
      imageHeight: 120,
      headlineFontSize: 20,
      subHeadlineFontSize: 14,
      summaryFontSize: 13,
      targetWordCount: 220,
      editorialRole: 'MID_RIGHT'
    },

    // Tier 3: 5 Compact Columns across Bottom (5 slots)
    {
      slotIndex: 5,
      slotBadge: 'Slot 6: निचला कॉलम 1',
      categoryBadge: 'राष्ट्रीय',
      x: 16,
      y: y3,
      width: bW,
      height: tier3H,
      columnsCount: 1,
      columnGap: 10,
      showColumnDivider: false,
      imageWrapMode: 'auto',
      imageAlignment: 'Center Wrap',
      imageVertAlign: 'top',
      imageWidth: 140,
      imageHeight: 110,
      headlineFontSize: 17,
      subHeadlineFontSize: 12.5,
      summaryFontSize: 12,
      targetWordCount: 180,
      editorialRole: 'BOTTOM_COL_1'
    },
    {
      slotIndex: 6,
      slotBadge: 'Slot 7: निचला कॉलम 2',
      categoryBadge: 'राज्य',
      x: 16 + (bW + bG),
      y: y3,
      width: bW,
      height: tier3H,
      columnsCount: 1,
      columnGap: 10,
      showColumnDivider: false,
      imageWrapMode: 'auto',
      imageAlignment: 'Center Wrap',
      imageVertAlign: 'top',
      imageWidth: 140,
      imageHeight: 110,
      headlineFontSize: 17,
      subHeadlineFontSize: 12.5,
      summaryFontSize: 12,
      targetWordCount: 180,
      editorialRole: 'BOTTOM_COL_2'
    },
    {
      slotIndex: 7,
      slotBadge: 'Slot 8: निचला कॉलम 3',
      categoryBadge: 'राजनीति',
      x: 16 + (bW + bG) * 2,
      y: y3,
      width: bW,
      height: tier3H,
      columnsCount: 1,
      columnGap: 10,
      showColumnDivider: false,
      imageWrapMode: 'auto',
      imageAlignment: 'Center Wrap',
      imageVertAlign: 'top',
      imageWidth: 140,
      imageHeight: 110,
      headlineFontSize: 17,
      subHeadlineFontSize: 12.5,
      summaryFontSize: 12,
      targetWordCount: 180,
      editorialRole: 'BOTTOM_COL_3'
    },
    {
      slotIndex: 8,
      slotBadge: 'Slot 9: निचला कॉलम 4',
      categoryBadge: 'कारोबार',
      x: 16 + (bW + bG) * 3,
      y: y3,
      width: bW,
      height: tier3H,
      columnsCount: 1,
      columnGap: 10,
      showColumnDivider: false,
      imageWrapMode: 'auto',
      imageAlignment: 'Center Wrap',
      imageVertAlign: 'top',
      imageWidth: 140,
      imageHeight: 110,
      headlineFontSize: 17,
      subHeadlineFontSize: 12.5,
      summaryFontSize: 12,
      targetWordCount: 180,
      editorialRole: 'BOTTOM_COL_4'
    },
    {
      slotIndex: 9,
      slotBadge: 'Slot 10: निचला कॉलम 5',
      categoryBadge: 'विविध',
      x: 16 + (bW + bG) * 4,
      y: y3,
      width: bW,
      height: tier3H,
      columnsCount: 1,
      columnGap: 10,
      showColumnDivider: false,
      imageWrapMode: 'auto',
      imageAlignment: 'Center Wrap',
      imageVertAlign: 'top',
      imageWidth: 140,
      imageHeight: 110,
      headlineFontSize: 17,
      subHeadlineFontSize: 12.5,
      summaryFontSize: 12,
      targetWordCount: 180,
      editorialRole: 'BOTTOM_COL_5'
    }
  ];
}

/**
 * Universal dynamic layout selector: supports 1 to 10 slots
 */
export function getBroadsheetBlueprint({ slotCount = 7, pageNumber = 1 }) {
  const count = Math.min(10, Math.max(1, Number(slotCount) || 7));

  switch (count) {
    case 1:
      return get1SlotLayout(pageNumber);
    case 2:
      return get2SlotLayout(pageNumber);
    case 3:
      return get3SlotLayout(pageNumber);
    case 4:
      return get4SlotLayout(pageNumber);
    case 5:
      return get5SlotLayout(pageNumber);
    case 6:
      return get6SlotLayout(pageNumber);
    case 7:
      return get7SlotLayout(pageNumber);
    case 8:
      return get8SlotLayout(pageNumber);
    case 9:
      return get9SlotLayout(pageNumber);
    case 10:
    default:
      return get10SlotLayout(pageNumber);
  }
}
