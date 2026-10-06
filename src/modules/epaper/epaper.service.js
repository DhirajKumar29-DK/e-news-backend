import { prisma } from '../../config/db.js';
import { AppError } from '../../utils/appError.js';
import { generateIssuePdf } from './puppeteer.service.js';

/**
 * Helper: Find or create PaperIssue for edition & date
 * Auto-creates Edition if it doesn't exist yet!
 */
const getOrCreatePaperIssue = async (editionSlug, dateString) => {
  const cleanSlug = (editionSlug || 'patna-main').toLowerCase().trim();

  let edition = await prisma.edition.findFirst({
    where: {
      OR: [
        { slug: cleanSlug },
        { slug: { contains: cleanSlug } },
        { name: { contains: cleanSlug } }
      ],
      deletedAt: null
    }
  });

  if (!edition) {
    const formattedName = cleanSlug
      .split('-')
      .map(s => s.charAt(0).toUpperCase() + s.slice(1))
      .join(' ');

    edition = await prisma.edition.create({
      data: {
        name: formattedName,
        city: formattedName.replace('Edition', '').trim(),
        slug: cleanSlug,
        code: cleanSlug.toUpperCase().replace(/-/g, '_'),
        isActive: true
      }
    });
  }

  // UTC Safe Day-Range Boundaries (00:00:00.000 to 23:59:59.999)
  const dClean = (dateString || new Date().toISOString()).split('T')[0];
  const [y, m, d] = dClean.split('-').map(Number);
  const startOfDay = new Date(Date.UTC(y, (m || 1) - 1, d || 1, 0, 0, 0, 0));
  const endOfDay = new Date(Date.UTC(y, (m || 1) - 1, d || 1, 23, 59, 59, 999));

  let issue = await prisma.paperIssue.findFirst({
    where: {
      editionId: edition.id,
      publishDate: {
        gte: startOfDay,
        lte: endOfDay
      },
      deletedAt: null
    }
  });

  if (!issue) {
    issue = await prisma.paperIssue.create({
      data: {
        editionId: edition.id,
        publishDate: startOfDay,
        status: 'DRAFT',
        totalPages: 1,
        pages: {
          create: [
            {
              pageNumber: 1,
              title: 'Lead Cover',
              templateKey: 'layout_1'
            }
          ]
        }
      }
    });
  }

  return { issue, edition };
};

/**
 * Public Reader API: Get Single Broadsheet Page (Zero Lag)
 */
export const getReaderPage = async (editionSlug, dateString, pageNo = 1) => {
  const { issue, edition } = await getOrCreatePaperIssue(editionSlug, dateString);

  const page = await prisma.paperPage.findFirst({
    where: {
      paperIssueId: issue.id,
      pageNumber: Number(pageNo),
      deletedAt: null
    },
    include: {
      slots: {
        where: { deletedAt: null },
        orderBy: { slotIndex: 'asc' }
      }
    }
  });

  return {
    edition: {
      id: edition.id,
      name: edition.name,
      city: edition.city,
      slug: edition.slug
    },
    issue: {
      id: issue.id,
      publishDate: issue.publishDate,
      status: issue.status,
      broadsheetPdfUrl: issue.broadsheetPdfUrl,
      totalPages: issue.totalPages
    },
    page: page || null
  };
};

/**
 * Get Issue Details & Pages Thumbnails List
 */
export const getIssueDetails = async (editionSlug, dateString) => {
  const { issue, edition } = await getOrCreatePaperIssue(editionSlug, dateString);

  const pages = await prisma.paperPage.findMany({
    where: { paperIssueId: issue.id, deletedAt: null },
    orderBy: { pageNumber: 'asc' },
    include: {
      slots: {
        where: { deletedAt: null },
        orderBy: { slotIndex: 'asc' }
      }
    }
  });

  return {
    edition,
    issue: {
      id: issue.id,
      publishDate: issue.publishDate,
      status: issue.status,
      broadsheetPdfUrl: issue.broadsheetPdfUrl,
      totalPages: pages.length
    },
    pages
  };
};

/**
 * Admin API: Save / Edit Broadsheet Slot Content & Geometry
 */
export const saveSlot = async (slotData) => {
  const {
    editionSlug,
    publishDate,
    pageNumber,
    slotIndex,
    x,
    y,
    width,
    height,
    headline,
    subHeadline,
    categoryTag,
    contentText,
    imageUrl,
    imageAlign,
    imageWidth,
    imageHeight,
    imgPxX,
    imgPxY,
    headlineFontSize,
    subHeadlineFontSize,
    bodyFontSize,
    headlineColor,
    subHeadlineColor,
    bodyTextColor,
    colSpan,
    rowSpan,
    forceRowBreak,
    isAd
  } = slotData;

  const { issue } = await getOrCreatePaperIssue(editionSlug, publishDate);

  let page = await prisma.paperPage.findFirst({
    where: {
      paperIssueId: issue.id,
      pageNumber: Number(pageNumber || 1)
    }
  });

  if (!page) {
    page = await prisma.paperPage.create({
      data: {
        paperIssueId: issue.id,
        pageNumber: Number(pageNumber || 1),
        title: `Page ${pageNumber || 1}`,
        templateKey: 'layout_1'
      }
    });
  }

  let slot = await prisma.paperSlot.findFirst({
    where: {
      pageId: page.id,
      slotIndex: Number(slotIndex),
      deletedAt: null
    }
  });

  const payload = {
    pageId: page.id,
    slotIndex: Number(slotIndex),
    x: x !== undefined ? Number(x) : 16,
    y: y !== undefined ? Number(y) : 115,
    width: width !== undefined ? Number(width) : 400,
    height: height !== undefined ? Number(height) : 250,
    headline: headline || '',
    subHeadline: subHeadline || '',
    categoryTag: categoryTag || '',
    contentText: contentText || '',
    imageUrl: imageUrl || '',
    imageAlign: imageAlign || 'LEFT',
    imageWidth: imageWidth !== undefined && imageWidth !== null ? Number(imageWidth) : null,
    imageHeight: imageHeight !== undefined && imageHeight !== null ? Number(imageHeight) : null,
    imgPxX: imgPxX !== undefined && imgPxX !== null ? Number(imgPxX) : null,
    imgPxY: imgPxY !== undefined && imgPxY !== null ? Number(imgPxY) : null,
    headlineFontSize: headlineFontSize !== undefined && headlineFontSize !== null ? Number(headlineFontSize) : 22,
    subHeadlineFontSize: subHeadlineFontSize !== undefined && subHeadlineFontSize !== null ? Number(subHeadlineFontSize) : 18,
    bodyFontSize: bodyFontSize !== undefined && bodyFontSize !== null ? Number(bodyFontSize) : 14,
    headlineColor: headlineColor || '#111827',
    subHeadlineColor: subHeadlineColor || '#ba1228',
    bodyTextColor: bodyTextColor || '#1f2937',
    colSpan: colSpan !== undefined ? Number(colSpan) : 8,
    rowSpan: rowSpan || 'auto',
    forceRowBreak: Boolean(forceRowBreak),
    isAd: Boolean(isAd),
    columnCount: slotData.columnCount || slotData.columnsCount || 1,
    showColumnDividers: Boolean(slotData.showColumnDividers || slotData.showColumnDivider),
    subStories: slotData.subStories || null,
    highlightBox: slotData.highlightBox || null,
    photoCaption: slotData.photoCaption || null,
    kickerTag: slotData.kickerTag || slotData.jumpTag || null
  };

  if (slot) {
    slot = await prisma.paperSlot.update({
      where: { id: slot.id },
      data: payload
    });
  } else {
    slot = await prisma.paperSlot.create({
      data: payload
    });
  }

  return slot;
};

/**
 * Admin API: Publish Issue & Status Update
 */
export const publishIssue = async (editionSlug, dateString, status = 'PUBLISHED', pages = null) => {
  const { issue, edition } = await getOrCreatePaperIssue(editionSlug, dateString);

  // Persist all pages & slots to database so Reader & PDF have 100% exact synced content
  if (Array.isArray(pages) && pages.length > 0) {
    try {
      await savePagesBulk(editionSlug, dateString, pages);
    } catch (saveErr) {
      console.warn('savePagesBulk during publish error:', saveErr.message);
    }
  }


  let pdfResult = null;
  try {
    pdfResult = await generateIssuePdfService({
      editionSlug: edition.slug,
      editionName: edition.name,
      publishDate: dateString,
      pages: pages || undefined
    });
  } catch (pdfErr) {
    console.warn('⚠️ PDF Generation background note:', pdfErr.message);
  }

  const updatedIssue = await prisma.paperIssue.update({
    where: { id: issue.id },
    data: {
      status: status || 'PUBLISHED',
      ...(pdfResult?.pdfUrl ? { broadsheetPdfUrl: pdfResult.pdfUrl } : {})
    }
  });

  return {
    message: `Paper status updated to ${status}`,
    isAlreadyPublished: false,
    issue: updatedIssue,
    pdfUrl: updatedIssue.broadsheetPdfUrl || pdfResult?.pdfUrl
  };
};

export const publishPaper = publishIssue;

/**
 * Admin API: Add New Page
 */
export const addPage = async (editionSlug, dateString, pageNumber, title, templateKey) => {
  const { issue } = await getOrCreatePaperIssue(editionSlug, dateString);

  let page = await prisma.paperPage.findFirst({
    where: {
      paperIssueId: issue.id,
      pageNumber: Number(pageNumber)
    }
  });

  if (!page) {
    page = await prisma.paperPage.create({
      data: {
        paperIssueId: issue.id,
        pageNumber: Number(pageNumber),
        title: title || `Page ${pageNumber}`,
        templateKey: templateKey || 'layout_1'
      }
    });

    await prisma.paperIssue.update({
      where: { id: issue.id },
      data: { totalPages: { increment: 1 } }
    });
  }

  return page;
};

/**
 * Generate High-Resolution Broadsheet PDF & Page Canvas Screenshots via Puppeteer
 */
export const generateIssuePdfService = async (params) => {
  const editionSlug = typeof params === 'object' ? params.editionSlug : params;
  const dateString = typeof params === 'object' ? params.publishDate : arguments[1];
  const incomingPages = typeof params === 'object' ? params.pages : arguments[2];

  const { issue, edition } = await getOrCreatePaperIssue(editionSlug, dateString);

  if (Array.isArray(incomingPages) && incomingPages.length > 0) {
    try {
      await savePagesBulk(editionSlug, dateString, incomingPages);
    } catch (saveErr) {
      console.warn('savePagesBulk in generateIssuePdfService note:', saveErr.message);
    }
  }

  let pages = incomingPages;
  if (!pages || !Array.isArray(pages) || pages.length === 0) {
    pages = await prisma.paperPage.findMany({
      where: { paperIssueId: issue.id, deletedAt: null },
      orderBy: { pageNumber: 'asc' },
      include: {
        slots: {
          where: { deletedAt: null },
          orderBy: { slotIndex: 'asc' }
        }
      }
    });
  }

  const pdfResult = await generateIssuePdf({
    editionSlug: edition.slug,
    editionName: (typeof params === 'object' && params.editionName) || edition.name,
    editionTitle: typeof params === 'object' ? params.editionTitle : null,
    editionCity: typeof params === 'object' ? params.editionCity : null,
    editionState: typeof params === 'object' ? params.editionState : null,
    publishDate: dateString,
    pages
  });

  // Save generated pageImage URLs on PaperPage records in database!
  if (Array.isArray(pdfResult.pageImages)) {
    for (const pImg of pdfResult.pageImages) {
      await prisma.paperPage.updateMany({
        where: {
          paperIssueId: issue.id,
          pageNumber: Number(pImg.pageNumber),
          deletedAt: null
        },
        data: {
          pageImage: pImg.pageImage
        }
      });
    }
  }

  const updatedIssue = await prisma.paperIssue.update({
    where: { id: issue.id },
    data: {
      broadsheetPdfUrl: pdfResult.publicUrl,
      status: 'PUBLISHED',
      totalPages: pages.length
    }
  });

  return {
    message: 'Broadsheet PDF & Page Canvas Images generated successfully',
    pdfUrl: pdfResult.publicUrl,
    pageImages: pdfResult.pageImages,
    issue: updatedIssue
  };
};

/**
 * Admin API: Save All Pages & Slots in 1 Bulk Operation
 */
export const savePagesBulk = async (editionSlug, dateString, pages) => {
  const { issue } = await getOrCreatePaperIssue(editionSlug, dateString);

  if (!Array.isArray(pages)) {
    return { message: 'Invalid pages array' };
  }

  for (const pg of pages) {
    const pageNum = Number(pg.pageNumber || 1);
    let page = await prisma.paperPage.findFirst({
      where: {
        paperIssueId: issue.id,
        pageNumber: pageNum
      }
    });

    if (!page) {
      page = await prisma.paperPage.create({
        data: {
          paperIssueId: issue.id,
          pageNumber: pageNum,
          title: pg.title || `Page ${pageNum}`,
          templateKey: pg.templateKey || 'layout_1'
        }
      });
    } else if (page.deletedAt) {
      page = await prisma.paperPage.update({
        where: { id: page.id },
        data: { deletedAt: null, title: pg.title || `Page ${pageNum}` }
      });
    }

    // Clean old slots for this page before saving fresh slots stack
    await prisma.paperSlot.updateMany({
      where: { pageId: page.id, deletedAt: null },
      data: { deletedAt: new Date() }
    });

    if (Array.isArray(pg.slots)) {
      for (let i = 0; i < pg.slots.length; i++) {
        const s = pg.slots[i];
        const slotIdx = Number(s.slotNumber || (i + 1));

        const payload = {
          pageId: page.id,
          slotIndex: slotIdx,
          x: s.x !== undefined ? Number(s.x) : 16,
          y: s.y !== undefined ? Number(s.y) : 115,
          width: s.width !== undefined ? Number(s.width) : 400,
          height: s.height !== undefined ? Number(s.height) : 250,
          headline: s.headline || '',
          subHeadline: s.subHeadline || '',
          categoryTag: s.categoryBadge || s.categoryTag || '',
          contentText: s.summary || s.contentText || '',
          imageUrl: s.imageUrl || '',
          imageAlign: s.imageAlignment === 'Right' ? 'RIGHT' : s.imageAlignment === 'Center Wrap' ? 'CENTER' : (s.imageAlign || 'LEFT'),
          imageWidth: s.imageWidth !== undefined && s.imageWidth !== null ? Number(s.imageWidth) : null,
          imageHeight: s.imageHeight !== undefined && s.imageHeight !== null ? Number(s.imageHeight) : null,
          imgPxX: s.imgPxX !== undefined && s.imgPxX !== null ? Number(s.imgPxX) : null,
          imgPxY: s.imgPxY !== undefined && s.imgPxY !== null ? Number(s.imgPxY) : null,
          headlineFontSize: s.headlineFontSize !== undefined && s.headlineFontSize !== null ? Number(s.headlineFontSize) : 22,
          subHeadlineFontSize: s.subHeadlineFontSize !== undefined && s.subHeadlineFontSize !== null ? Number(s.subHeadlineFontSize) : 18,
          bodyFontSize: s.bodyFontSize !== undefined && s.bodyFontSize !== null ? Number(s.bodyFontSize) : 14,
          headlineColor: s.headlineColor || '#111827',
          subHeadlineColor: s.subHeadlineColor || '#ba1228',
          bodyTextColor: s.bodyTextColor || '#1f2937',
          colSpan: s.colSpan !== undefined && s.colSpan !== null ? Number(s.colSpan) : 8,
          rowSpan: s.rowSpan || 'auto',
          forceRowBreak: Boolean(s.forceRowBreak),
          isAd: Boolean(s.isAd),
          columnCount: s.columnsCount || s.columnCount || 1,
          showColumnDividers: Boolean(s.showColumnDivider || s.showColumnDividers),
          subStories: s.subStories || null,
          highlightBox: s.highlightBox || null,
          photoCaption: s.photoCaption || null,
          kickerTag: s.kickerTag || s.jumpTag || null
        };

        await prisma.paperSlot.create({
          data: payload
        });
      }
    }
  }

  // Soft-delete extra pages beyond pages.length if pages were removed
  await prisma.paperPage.updateMany({
    where: {
      paperIssueId: issue.id,
      pageNumber: { gt: pages.length },
      deletedAt: null
    },
    data: { deletedAt: new Date() }
  });

  await prisma.paperIssue.update({
    where: { id: issue.id },
    data: { totalPages: pages.length }
  });

  return {
    message: `Saved ${pages.length} page(s) successfully`
  };
};

/**
 * 1. Get Nested States with Active Editions (For Public Reader Mega-Menu)
 */
export const getStatesWithEditions = async () => {
  const states = await prisma.state.findMany({
    where: { active: true },
    orderBy: { order: 'asc' },
    select: {
      id: true,
      name: true,
      slug: true,
      order: true,
      editions: {
        where: { isActive: true, deletedAt: null },
        orderBy: { order: 'asc' },
        select: {
          id: true,
          name: true,
          city: true,
          title: true,
          tag: true,
          slug: true,
          order: true
        }
      }
    }
  });
  return states;
};

/**
 * 2. Get Flat Active Editions List with State Info (For Admin Studio Dropdown)
 */
export const getFlatEditions = async () => {
  const editions = await prisma.edition.findMany({
    where: { isActive: true, deletedAt: null },
    orderBy: { order: 'asc' },
    select: {
      id: true,
      name: true,
      city: true,
      title: true,
      tag: true,
      slug: true,
      order: true,
      state: {
        select: {
          id: true,
          name: true,
          slug: true
        }
      }
    }
  });
  return editions;
};

/**
 * 3. Get Available Published Archive Dates for an Edition (LiveHindustan Standard)
 */
export const getArchiveDates = async (editionSlug, limitDays = 30) => {
  const cleanSlug = (editionSlug || 'patna-main').toLowerCase().trim();

  const edition = await prisma.edition.findFirst({
    where: {
      OR: [
        { slug: cleanSlug },
        { slug: { contains: cleanSlug } }
      ],
      deletedAt: null
    }
  });

  if (!edition) {
    return [];
  }

  const pastDateLimit = new Date();
  pastDateLimit.setDate(pastDateLimit.getDate() - Number(limitDays || 30));
  pastDateLimit.setUTCHours(0, 0, 0, 0);

  const issues = await prisma.paperIssue.findMany({
    where: {
      editionId: edition.id,
      deletedAt: null,
      publishDate: {
        gte: pastDateLimit
      },
      OR: [
        { status: 'PUBLISHED' },
        { broadsheetPdfUrl: { not: null } }
      ]
    },
    orderBy: {
      publishDate: 'desc'
    },
    select: {
      id: true,
      publishDate: true,
      status: true,
      broadsheetPdfUrl: true,
      totalPages: true
    }
  });

  const datesSet = new Set();
  const result = [];

  for (const item of issues) {
    const dStr = item.publishDate.toISOString().split('T')[0];
    if (!datesSet.has(dStr)) {
      datesSet.add(dStr);
      result.push({
        date: dStr,
        pdfUrl: item.broadsheetPdfUrl,
        totalPages: item.totalPages,
        status: item.status
      });
    }
  }

  return result;
};

export default {
  getReaderPage,
  getIssueDetails,
  saveSlot,
  publishIssue,
  publishPaper,
  addPage,
  generateIssuePdfService,
  savePagesBulk,
  getStatesWithEditions,
  getFlatEditions,
  getArchiveDates
};
