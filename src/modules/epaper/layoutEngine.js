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
  PAGE_1_TOP_OFFSET: 184, // Space for grand masthead (2px below header line)
  PAGE_N_TOP_OFFSET: 72,  // Space for sleek section header (2px below header line)
  FOOTER_OFFSET: 60
};

export function get1SlotLayout(pageNumber = 1) {
  const isPage1 = Number(pageNumber) === 1;
  const topY = isPage1 ? BROADSHEET_CONFIG.PAGE_1_TOP_OFFSET : BROADSHEET_CONFIG.PAGE_N_TOP_OFFSET;
  const height = isPage1 ? 1912 : 2024;

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
      showColumnDivider: false,
      imageWrapMode: 'top-span',
      imageAlignment: 'Center Wrap',
      imageVertAlign: 'top',
      imageWidth: 620,
      imageHeight: 360,
      headlineFontSize: 34,
      subHeadlineFontSize: 18,
      summaryFontSize: 15,
      targetWordCount: isPage1 ? 1200 : 1300,
      editorialRole: 'FULL_PAGE_INVESTIGATIVE'
    }
  ];
}

export function get2SlotLayout(pageNumber = 1) {
  const isPage1 = Number(pageNumber) === 1;
  const topY = isPage1 ? BROADSHEET_CONFIG.PAGE_1_TOP_OFFSET : BROADSHEET_CONFIG.PAGE_N_TOP_OFFSET;
  const totalH = isPage1 ? 1912 : 2024;
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
      showColumnDivider: false,
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
      showColumnDivider: false,
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
  const totalH = isPage1 ? 1912 : 2024;
  const tier1H = isPage1 ? 560 : 610;
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
      showColumnDivider: false,
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
      slotBadge: 'Slot 2: बायाँ स्तंभ विश्लेषण (Left Broadsheet Column)',
      categoryBadge: 'ग्राउंड रिपोर्ट',
      x: 16,
      y: y2,
      width: 648,
      height: tier2H,
      columnsCount: 2,
      columnGap: 16,
      showColumnDivider: false,
      imageWrapMode: 'auto',
      imageAlignment: 'Right',
      imageVertAlign: 'top',
      imageWidth: 260,
      imageHeight: 180,
      headlineFontSize: 24,
      subHeadlineFontSize: 15,
      summaryFontSize: 14,
      targetWordCount: 750,
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
      showColumnDivider: false,
      imageWrapMode: 'auto',
      imageAlignment: 'Right',
      imageVertAlign: 'top',
      imageWidth: 260,
      imageHeight: 180,
      headlineFontSize: 24,
      subHeadlineFontSize: 15,
      summaryFontSize: 14,
      targetWordCount: 750,
      editorialRole: 'RIGHT_PILLAR'
    }
  ];
}

export function get4SlotLayout(pageNumber = 1) {
  const isPage1 = Number(pageNumber) === 1;
  const topY = isPage1 ? BROADSHEET_CONFIG.PAGE_1_TOP_OFFSET : BROADSHEET_CONFIG.PAGE_N_TOP_OFFSET;
  const totalH = isPage1 ? 1912 : 2024;
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
      showColumnDivider: false,
      imageWrapMode: 'auto',
      imageAlignment: 'Right',
      imageVertAlign: 'top',
      imageWidth: 260,
      imageHeight: 160,
      headlineFontSize: 24,
      subHeadlineFontSize: 15,
      summaryFontSize: 14,
      targetWordCount: 550,
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
      showColumnDivider: false,
      imageWrapMode: 'auto',
      imageAlignment: 'Right',
      imageVertAlign: 'top',
      imageWidth: 260,
      imageHeight: 160,
      headlineFontSize: 24,
      subHeadlineFontSize: 15,
      summaryFontSize: 14,
      targetWordCount: 550,
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
      showColumnDivider: false,
      imageWrapMode: 'auto',
      imageAlignment: 'Left',
      imageVertAlign: 'top',
      imageWidth: 260,
      imageHeight: 160,
      headlineFontSize: 24,
      subHeadlineFontSize: 15,
      summaryFontSize: 14,
      targetWordCount: 550,
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
      showColumnDivider: false,
      imageWrapMode: 'auto',
      imageAlignment: 'Right',
      imageVertAlign: 'top',
      imageWidth: 260,
      imageHeight: 160,
      headlineFontSize: 24,
      subHeadlineFontSize: 15,
      summaryFontSize: 14,
      targetWordCount: 550,
      editorialRole: 'BOTTOM_RIGHT_QUAD'
    }
  ];
}

export function get5SlotLayout(pageNumber = 1) {
  const isPage1 = Number(pageNumber) === 1;
  const topY = isPage1 ? BROADSHEET_CONFIG.PAGE_1_TOP_OFFSET : BROADSHEET_CONFIG.PAGE_N_TOP_OFFSET;
  const tier1H = isPage1 ? 560 : 612;
  const remainingH = (isPage1 ? 1912 : 2024) - tier1H - (BROADSHEET_CONFIG.GUTTER * 2);
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
      showColumnDivider: false,
      imageWrapMode: 'top-span',
      imageAlignment: 'Center Wrap',
      imageVertAlign: 'top',
      imageWidth: 480,
      imageHeight: 250,
      headlineFontSize: 28,
      subHeadlineFontSize: 16,
      summaryFontSize: 14,
      targetWordCount: 580,
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
      showColumnDivider: false,
      imageWrapMode: 'auto',
      imageAlignment: 'Left',
      imageVertAlign: 'top',
      imageWidth: 240,
      imageHeight: 150,
      headlineFontSize: 22,
      subHeadlineFontSize: 15,
      summaryFontSize: 14,
      targetWordCount: 450,
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
      showColumnDivider: false,
      imageWrapMode: 'auto',
      imageAlignment: 'Right',
      imageVertAlign: 'top',
      imageWidth: 240,
      imageHeight: 150,
      headlineFontSize: 22,
      subHeadlineFontSize: 15,
      summaryFontSize: 14,
      targetWordCount: 450,
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
      showColumnDivider: false,
      imageWrapMode: 'auto',
      imageAlignment: 'Left',
      imageVertAlign: 'top',
      imageWidth: 240,
      imageHeight: 150,
      headlineFontSize: 22,
      subHeadlineFontSize: 15,
      summaryFontSize: 14,
      targetWordCount: 450,
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
      showColumnDivider: false,
      imageWrapMode: 'auto',
      imageAlignment: 'Right',
      imageVertAlign: 'top',
      imageWidth: 240,
      imageHeight: 150,
      headlineFontSize: 22,
      subHeadlineFontSize: 15,
      summaryFontSize: 14,
      targetWordCount: 450,
      editorialRole: 'BOTTOM_RIGHT'
    }
  ];
}

export function get6SlotLayout(pageNumber = 1) {
  const isPage1 = Number(pageNumber) === 1;
  const topY = isPage1 ? BROADSHEET_CONFIG.PAGE_1_TOP_OFFSET : BROADSHEET_CONFIG.PAGE_N_TOP_OFFSET;

  const tier1H = isPage1 ? 560 : 612;
  const tier2H = isPage1 ? 660 : 690;
  const tier3H = isPage1 ? 660 : 690;

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
      showColumnDivider: false,
      imageWrapMode: 'top-span',
      imageAlignment: 'Center Wrap',
      imageVertAlign: 'top',
      imageWidth: 460,
      imageHeight: 260,
      headlineFontSize: 28,
      subHeadlineFontSize: 16,
      summaryFontSize: 14,
      targetWordCount: 480,
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
      targetWordCount: 330,
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
      showColumnDivider: false,
      imageWrapMode: 'auto',
      imageAlignment: 'Left',
      imageVertAlign: 'top',
      imageWidth: 240,
      imageHeight: 150,
      headlineFontSize: 22,
      subHeadlineFontSize: 15,
      summaryFontSize: 14,
      targetWordCount: 420,
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
      showColumnDivider: false,
      imageWrapMode: 'auto',
      imageAlignment: 'Right',
      imageVertAlign: 'top',
      imageWidth: 240,
      imageHeight: 150,
      headlineFontSize: 22,
      subHeadlineFontSize: 15,
      summaryFontSize: 14,
      targetWordCount: 420,
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
      showColumnDivider: false,
      imageWrapMode: 'auto',
      imageAlignment: 'Left',
      imageVertAlign: 'top',
      imageWidth: 240,
      imageHeight: 150,
      headlineFontSize: 22,
      subHeadlineFontSize: 15,
      summaryFontSize: 14,
      targetWordCount: 420,
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
      showColumnDivider: false,
      imageWrapMode: 'auto',
      imageAlignment: 'Right',
      imageVertAlign: 'top',
      imageWidth: 240,
      imageHeight: 150,
      headlineFontSize: 22,
      subHeadlineFontSize: 15,
      summaryFontSize: 14,
      targetWordCount: 420,
      editorialRole: 'BOTTOM_RIGHT_ANCHOR'
    }
  ];
}

export function get7SlotLayout(pageNumber = 1) {
  const isPage1 = Number(pageNumber) === 1;
  const topY = isPage1 ? BROADSHEET_CONFIG.PAGE_1_TOP_OFFSET : BROADSHEET_CONFIG.PAGE_N_TOP_OFFSET;

  const tier1H = isPage1 ? 550 : 590;
  const tier2H = isPage1 ? 640 : 672;
  const tier3H = isPage1 ? 690 : 730;

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
      showColumnDivider: false,
      imageWrapMode: 'top-span',
      imageAlignment: 'Center Wrap',
      imageVertAlign: 'top',
      imageWidth: 460,
      imageHeight: 260,
      headlineFontSize: 28,
      subHeadlineFontSize: 16,
      summaryFontSize: 14,
      targetWordCount: 480,
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
      targetWordCount: 320,
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
      targetWordCount: 290,
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
      targetWordCount: 290,
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
      targetWordCount: 300,
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
      showColumnDivider: false,
      imageWrapMode: 'auto',
      imageAlignment: 'Right',
      imageVertAlign: 'top',
      imageWidth: 260,
      imageHeight: 160,
      headlineFontSize: 22,
      subHeadlineFontSize: 15,
      summaryFontSize: 14,
      targetWordCount: 440,
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
      showColumnDivider: false,
      imageWrapMode: 'auto',
      imageAlignment: 'Right',
      imageVertAlign: 'top',
      imageWidth: 260,
      imageHeight: 160,
      headlineFontSize: 22,
      subHeadlineFontSize: 15,
      summaryFontSize: 14,
      targetWordCount: 440,
      editorialRole: 'BOTTOM_RIGHT_ANCHOR'
    }
  ];
}

export function get8SlotLayout(pageNumber = 1) {
  const isPage1 = Number(pageNumber) === 1;
  const topY = isPage1 ? BROADSHEET_CONFIG.PAGE_1_TOP_OFFSET : BROADSHEET_CONFIG.PAGE_N_TOP_OFFSET;

  const tier1H = isPage1 ? 550 : 590;
  const tier2H = isPage1 ? 640 : 672;
  const tier3H = isPage1 ? 690 : 730;

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
      showColumnDivider: false,
      imageWrapMode: 'top-span',
      imageAlignment: 'Center Wrap',
      imageVertAlign: 'top',
      imageWidth: 460,
      imageHeight: 260,
      headlineFontSize: 28,
      subHeadlineFontSize: 16,
      summaryFontSize: 14,
      targetWordCount: 480,
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
      targetWordCount: 320,
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
      targetWordCount: 290,
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
      targetWordCount: 290,
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
      targetWordCount: 300,
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
      targetWordCount: 300,
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
      targetWordCount: 300,
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
      targetWordCount: 310,
      editorialRole: 'BOTTOM_RIGHT'
    }
  ];
}

export function get9SlotLayout(pageNumber = 1) {
  const isPage1 = Number(pageNumber) === 1;
  const topY = isPage1 ? BROADSHEET_CONFIG.PAGE_1_TOP_OFFSET : BROADSHEET_CONFIG.PAGE_N_TOP_OFFSET;

  const tier1H = isPage1 ? 540 : 580;
  const tier2H = isPage1 ? 640 : 674;
  const tier3H = isPage1 ? 700 : 738;

  const y1 = topY;
  const y2 = y1 + tier1H + BROADSHEET_CONFIG.GUTTER;
  const y3 = y2 + tier2H + BROADSHEET_CONFIG.GUTTER;

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
      showColumnDivider: false,
      imageWrapMode: 'top-span',
      imageAlignment: 'Center Wrap',
      imageVertAlign: 'top',
      imageWidth: 440,
      imageHeight: 240,
      headlineFontSize: 28,
      subHeadlineFontSize: 16,
      summaryFontSize: 14,
      targetWordCount: 460,
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
      targetWordCount: 300,
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
      targetWordCount: 280,
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
      targetWordCount: 280,
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
      imageWidth: 180,
      imageHeight: 130,
      headlineFontSize: 20,
      subHeadlineFontSize: 14,
      summaryFontSize: 13,
      targetWordCount: 290,
      editorialRole: 'MID_RIGHT'
    },
    {
      slotIndex: 5,
      slotBadge: 'Slot 6: निचला ब्रीफ 1',
      categoryBadge: 'संक्षेप',
      x: 16,
      y: y3,
      width: bW,
      height: tier3H,
      columnsCount: 1,
      columnGap: 12,
      showColumnDivider: false,
      imageWrapMode: 'auto',
      imageAlignment: 'Left',
      imageVertAlign: 'top',
      imageWidth: 130,
      imageHeight: 110,
      headlineFontSize: 18,
      subHeadlineFontSize: 13.5,
      summaryFontSize: 12.5,
      targetWordCount: 260,
      editorialRole: 'BOTTOM_BRIEF_1'
    },
    {
      slotIndex: 6,
      slotBadge: 'Slot 7: निचला ब्रीफ 2',
      categoryBadge: 'संक्षेप',
      x: 16 + bW + bG,
      y: y3,
      width: bW,
      height: tier3H,
      columnsCount: 1,
      columnGap: 12,
      showColumnDivider: false,
      imageWrapMode: 'auto',
      imageAlignment: 'Left',
      imageVertAlign: 'top',
      imageWidth: 130,
      imageHeight: 110,
      headlineFontSize: 18,
      subHeadlineFontSize: 13.5,
      summaryFontSize: 12.5,
      targetWordCount: 260,
      editorialRole: 'BOTTOM_BRIEF_2'
    },
    {
      slotIndex: 7,
      slotBadge: 'Slot 8: निचला ब्रीफ 3',
      categoryBadge: 'संक्षेप',
      x: 16 + (bW + bG) * 2,
      y: y3,
      width: bW,
      height: tier3H,
      columnsCount: 1,
      columnGap: 12,
      showColumnDivider: false,
      imageWrapMode: 'auto',
      imageAlignment: 'Left',
      imageVertAlign: 'top',
      imageWidth: 130,
      imageHeight: 110,
      headlineFontSize: 18,
      subHeadlineFontSize: 13.5,
      summaryFontSize: 12.5,
      targetWordCount: 260,
      editorialRole: 'BOTTOM_BRIEF_3'
    },
    {
      slotIndex: 8,
      slotBadge: 'Slot 9: निचला ब्रीफ 4',
      categoryBadge: 'संक्षेप',
      x: 16 + (bW + bG) * 3,
      y: y3,
      width: bW,
      height: tier3H,
      columnsCount: 1,
      columnGap: 12,
      showColumnDivider: false,
      imageWrapMode: 'auto',
      imageAlignment: 'Left',
      imageVertAlign: 'top',
      imageWidth: 130,
      imageHeight: 110,
      headlineFontSize: 18,
      subHeadlineFontSize: 13.5,
      summaryFontSize: 12.5,
      targetWordCount: 260,
      editorialRole: 'BOTTOM_BRIEF_4'
    }
  ];
}

export function get10SlotLayout(pageNumber = 1) {
  const isPage1 = Number(pageNumber) === 1;
  const topY = isPage1 ? BROADSHEET_CONFIG.PAGE_1_TOP_OFFSET : BROADSHEET_CONFIG.PAGE_N_TOP_OFFSET;

  // 4 Tiers: 3 gutters = 48px
  // Page 1: 1912 - 48 = 1864px (450 + 460 + 450 + 504 = 1864px) -> Sum = 1912px
  // Page N: 2024 - 48 = 1976px (480 + 490 + 480 + 526 = 1976px) -> Sum = 2024px
  const tier1H = isPage1 ? 450 : 480;
  const tier2H = isPage1 ? 460 : 490;
  const tier3H = isPage1 ? 450 : 480;
  const tier4H = isPage1 ? 504 : 526;

  const y1 = topY;
  const y2 = y1 + tier1H + BROADSHEET_CONFIG.GUTTER;
  const y3 = y2 + tier2H + BROADSHEET_CONFIG.GUTTER;
  const y4 = y3 + tier3H + BROADSHEET_CONFIG.GUTTER;

  return [
    // TIER 1: 2 SLOTS (Lead Hero Banner + Top Right Sidebar)
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
      showColumnDivider: false,
      imageWrapMode: 'top-span',
      imageAlignment: 'Center Wrap',
      imageVertAlign: 'top',
      imageWidth: 440,
      imageHeight: 220,
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
      imageWidth: 180,
      imageHeight: 130,
      headlineFontSize: 20,
      subHeadlineFontSize: 14,
      summaryFontSize: 13,
      targetWordCount: 240,
      editorialRole: 'TOP_SIDEBAR'
    },

    // TIER 2: 3 SLOTS (3 Ground Report Columns)
    {
      slotIndex: 2,
      slotBadge: 'Slot 3: ग्राउंड रिपोर्ट (बायाँ कॉलम)',
      categoryBadge: 'ग्राउंड ज़ीरो',
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
      imageWidth: 170,
      imageHeight: 130,
      headlineFontSize: 20,
      subHeadlineFontSize: 14,
      summaryFontSize: 13,
      targetWordCount: 240,
      editorialRole: 'MID_LEFT'
    },
    {
      slotIndex: 3,
      slotBadge: 'Slot 4: विशेष इन-डेप्थ (मध्य कॉलम)',
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
      imageWidth: 170,
      imageHeight: 130,
      headlineFontSize: 20,
      subHeadlineFontSize: 14,
      summaryFontSize: 13,
      targetWordCount: 240,
      editorialRole: 'MID_CENTER'
    },
    {
      slotIndex: 4,
      slotBadge: 'Slot 5: रणनीतिक समीक्षा (दायाँ कॉलम)',
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
      imageWidth: 170,
      imageHeight: 130,
      headlineFontSize: 20,
      subHeadlineFontSize: 14,
      summaryFontSize: 13,
      targetWordCount: 240,
      editorialRole: 'MID_RIGHT'
    },

    // TIER 3: 2 SLOTS (2 Wide Broadsheet Feature Columns)
    {
      slotIndex: 5,
      slotBadge: 'Slot 6: प्रमुख फीचर स्टोरी (बायाँ)',
      categoryBadge: 'विशेष फीचर',
      x: 16,
      y: y3,
      width: 648,
      height: tier3H,
      columnsCount: 2,
      columnGap: 16,
      showColumnDivider: false,
      imageWrapMode: 'auto',
      imageAlignment: 'Right',
      imageVertAlign: 'top',
      imageWidth: 220,
      imageHeight: 140,
      headlineFontSize: 22,
      subHeadlineFontSize: 15,
      summaryFontSize: 14,
      targetWordCount: 320,
      editorialRole: 'FEATURE_LEFT'
    },
    {
      slotIndex: 6,
      slotBadge: 'Slot 7: प्रमुख फीचर स्टोरी (दायाँ)',
      categoryBadge: 'विशेष विश्लेषण',
      x: 680,
      y: y3,
      width: 648,
      height: tier3H,
      columnsCount: 2,
      columnGap: 16,
      showColumnDivider: false,
      imageWrapMode: 'auto',
      imageAlignment: 'Right',
      imageVertAlign: 'top',
      imageWidth: 220,
      imageHeight: 140,
      headlineFontSize: 22,
      subHeadlineFontSize: 15,
      summaryFontSize: 14,
      targetWordCount: 320,
      editorialRole: 'FEATURE_RIGHT'
    },

    // TIER 4: 3 SLOTS (3 Balanced Bottom Anchor Stories)
    {
      slotIndex: 7,
      slotBadge: 'Slot 8: निचला एंकर बायाँ',
      categoryBadge: 'क्षेत्रीय',
      x: 16,
      y: y4,
      width: 424,
      height: tier4H,
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
      targetWordCount: 260,
      editorialRole: 'BOTTOM_LEFT'
    },
    {
      slotIndex: 8,
      slotBadge: 'Slot 9: निचला एंकर केंद्र',
      categoryBadge: 'राष्ट्रीय',
      x: 456,
      y: y4,
      width: 424,
      height: tier4H,
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
      targetWordCount: 260,
      editorialRole: 'BOTTOM_CENTER'
    },
    {
      slotIndex: 9,
      slotBadge: 'Slot 10: निचला एंकर दायाँ',
      categoryBadge: 'विशेष एंकर',
      x: 896,
      y: y4,
      width: 432,
      height: tier4H,
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
      targetWordCount: 260,
      editorialRole: 'BOTTOM_RIGHT'
    }
  ];
}

/**
 * Dynamic Content-Aware Layout Engine (Smart Auto-Packer)
 * Calculates slot dimensions (X, Y, Width, Height, Columns) dynamically based on actual story word counts & images.
 * Guarantees zero empty white space inside slots and zero void at the bottom (Max Y = 2096px).
 */
export function generateContentAwareLayout({ stories = [], pageNumber = 1, slotCount = null }) {
  const isPage1 = Number(pageNumber) === 1;
  const topY = isPage1 ? BROADSHEET_CONFIG.PAGE_1_TOP_OFFSET : BROADSHEET_CONFIG.PAGE_N_TOP_OFFSET;
  const maxY = 2096;
  const totalAvailableH = maxY - topY;

  const count = Math.min(10, Math.max(1, Number(slotCount || stories.length || 7)));

  // If no stories provided, fallback to standard geometric blueprint
  if (!Array.isArray(stories) || stories.length === 0) {
    return getBroadsheetBlueprint({ slotCount: count, pageNumber });
  }

  // Row partitions for broadsheet modularity
  let partitions = [];
  if (count === 1) partitions = [1];
  else if (count === 2) partitions = [2];
  else if (count === 3) partitions = [1, 2];
  else if (count === 4) partitions = [2, 2];
  else if (count === 5) partitions = [2, 3];
  else if (count === 6) partitions = [2, 2, 2];
  else if (count === 7) partitions = [2, 3, 2];
  else if (count === 8) partitions = [2, 3, 3];
  else if (count === 9) partitions = [2, 3, 4];
  else partitions = [2, 4, 4];

  const numRows = partitions.length;
  const totalGutterH = (numRows - 1) * BROADSHEET_CONFIG.GUTTER;
  const netAvailableH = totalAvailableH - totalGutterH;

  // Group stories into rows
  let sIdx = 0;
  const rowStories = partitions.map(pCount => {
    const row = [];
    for (let i = 0; i < pCount; i++) {
      const s = stories[sIdx] || {};
      row.push({
        ...s,
        globalIndex: sIdx
      });
      sIdx++;
    }
    return row;
  });

  // Calculate raw required height for each row based on content volume
  const rawRowHeights = rowStories.map((row, rIdx) => {
    const storyHeights = row.map(st => {
      const text = st.content || st.summary || st.contentText || '';
      const words = text ? text.trim().split(/\s+/).filter(Boolean).length : 220;
      const hasImage = Boolean(st.imageUrl || st.image);
      const photoH = hasImage ? (rIdx === 0 ? 250 : 180) : 0;
      const cols = row.length === 1 ? 3 : (row.length === 2 ? 2 : 1);
      const lines = Math.ceil(words / (cols * 8));
      const bodyH = lines * 22;
      return 75 + photoH + bodyH + 20;
    });
    return Math.max(...storyHeights, 200);
  });

  const sumRaw = rawRowHeights.reduce((a, b) => a + b, 0);
  const scale = netAvailableH / Math.max(1, sumRaw);
  const finalRowHeights = rawRowHeights.map(h => Math.round(h * scale));
  const sumFinal = finalRowHeights.reduce((a, b) => a + b, 0);
  finalRowHeights[finalRowHeights.length - 1] += (netAvailableH - sumFinal);

  // Assemble dynamic geometry slots
  const resultSlots = [];
  let currentY = topY;

  rowStories.forEach((row, rIdx) => {
    const rowH = finalRowHeights[rIdx];
    const rowSlotsCount = row.length;
    const totalGutterW = (rowSlotsCount - 1) * BROADSHEET_CONFIG.GUTTER;
    const netRowW = 1312 - totalGutterW;

    // Width distribution within the row
    let slotWidths = [];
    if (rowSlotsCount === 1) {
      slotWidths = [1312];
    } else if (rowSlotsCount === 2) {
      const w0 = (row[0].content || row[0].summary || row[0].contentText || '').split(/\s+/).length;
      const w1 = (row[1].content || row[1].summary || row[1].contentText || '').split(/\s+/).length;
      if (rIdx === 0 && w0 >= w1 * 1.25) {
        slotWidths = [848, 448]; // Lead gets 65% width
      } else if (rIdx === 0 && w1 >= w0 * 1.25) {
        slotWidths = [448, 848];
      } else {
        slotWidths = [648, 648];
      }
    } else if (rowSlotsCount === 3) {
      slotWidths = [416, 416, 448]; // 416 + 16 + 416 + 16 + 448 = 1312
    } else if (rowSlotsCount === 4) {
      slotWidths = [316, 316, 316, 316]; // 316*4 + 48 = 1312
    } else {
      const equalW = Math.floor(netRowW / rowSlotsCount);
      slotWidths = Array(rowSlotsCount).fill(equalW);
      slotWidths[slotWidths.length - 1] += (netRowW - (equalW * rowSlotsCount));
    }

    let currentX = BROADSHEET_CONFIG.MARGIN_X;

    row.forEach((story, cIdx) => {
      const slotW = slotWidths[cIdx];
      const gIdx = story.globalIndex;
      const isLead = rIdx === 0 && cIdx === 0;

      let colsCount = 1;
      if (slotW >= 800) colsCount = 3;
      else if (slotW >= 420) colsCount = 2;
      else colsCount = 1;

      let imgW = 200;
      let imgH = 140;
      if (slotW >= 800) {
        imgW = 460;
        imgH = 260;
      } else if (slotW >= 550) {
        imgW = 320;
        imgH = 200;
      } else if (slotW >= 400) {
        imgW = 220;
        imgH = 150;
      } else {
        imgW = 160;
        imgH = 120;
      }

      resultSlots.push({
        slotIndex: gIdx,
        slotBadge: `Slot ${gIdx + 1}`,
        categoryBadge: story.categoryBadge || 'समाचार',
        x: currentX,
        y: currentY,
        width: slotW,
        height: rowH,
        columnsCount: colsCount,
        columnGap: 14,
        showColumnDivider: false,
        imageWrapMode: 'auto',
        imageAlignment: isLead ? 'Left' : (cIdx % 2 === 1 ? 'Right' : 'Left'),
        imageVertAlign: 'top',
        imageWidth: imgW,
        imageHeight: imgH,
        headlineFontSize: isLead ? 28 : (rowH > 500 ? 24 : 22),
        subHeadlineFontSize: isLead ? 19 : 17,
        summaryFontSize: 15,
        targetWordCount: Math.round((slotW * rowH) / 450),
        editorialRole: isLead ? 'GRAND_LEAD' : `ROW_${rIdx + 1}_COL_${cIdx + 1}`
      });

      currentX += slotW + BROADSHEET_CONFIG.GUTTER;
    });

    currentY += rowH + BROADSHEET_CONFIG.GUTTER;
  });

  return resultSlots;
}

/**
 * Universal dynamic layout selector: supports 1 to 10 slots
 */
export function getBroadsheetBlueprint({ slotCount = 7, pageNumber = 1, stories = null }) {
  if (Array.isArray(stories) && stories.length > 0) {
    return generateContentAwareLayout({ stories, pageNumber, slotCount });
  }

  const count = Math.min(10, Math.max(1, Number(slotCount) || 7));

  let rawSlots = [];
  switch (count) {
    case 1:
      rawSlots = get1SlotLayout(pageNumber);
      break;
    case 2:
      rawSlots = get2SlotLayout(pageNumber);
      break;
    case 3:
      rawSlots = get3SlotLayout(pageNumber);
      break;
    case 4:
      rawSlots = get4SlotLayout(pageNumber);
      break;
    case 5:
      rawSlots = get5SlotLayout(pageNumber);
      break;
    case 6:
      rawSlots = get6SlotLayout(pageNumber);
      break;
    case 7:
      rawSlots = get7SlotLayout(pageNumber);
      break;
    case 8:
      rawSlots = get8SlotLayout(pageNumber);
      break;
    case 9:
      rawSlots = get9SlotLayout(pageNumber);
      break;
    case 10:
    default:
      rawSlots = get10SlotLayout(pageNumber);
      break;
  }

  // Standardize professional typography: Heading=23px (Lead 28px), Subheading=19px, Content=15px
  return rawSlots.map((s, idx) => ({
    ...s,
    headlineFontSize: idx === 0 && count > 1 ? (s.headlineFontSize || 28) : 23,
    subHeadlineFontSize: 19,
    summaryFontSize: 15
  }));
}
