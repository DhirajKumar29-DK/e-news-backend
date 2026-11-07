/**
 * E-Paper Automation & Scheduler Service
 * Manages daily automated broadsheet newspaper generation blueprints and scheduling.
 */

import { prisma } from '../../config/db.js';

export const DEFAULT_PAGE_BLUEPRINTS = [
  {
    pageNumber: 1,
    pageTitle: 'मुख्य पृष्ठ (Front Page)',
    headerType: 'grand',
    targetTopic: 'भारत और दुनिया की मुख्य बड़ी खबरें',
    slotCount: 7,
    order: 1
  },
  {
    pageNumber: 2,
    pageTitle: 'बिहार & पटना (State & City)',
    headerType: 'folio',
    targetTopic: 'पटना और बिहार के प्रमुख प्रशासनिक व विकास कार्य',
    slotCount: 7,
    order: 2
  },
  {
    pageNumber: 3,
    pageTitle: 'राष्ट्रीय & राजनीति (National Politics)',
    headerType: 'folio',
    targetTopic: 'आज की राष्ट्रीय राजनीति और संसद की बड़ी खबरें',
    slotCount: 6,
    order: 3
  },
  {
    pageNumber: 4,
    pageTitle: 'खेल जगत (Sports Arena)',
    headerType: 'folio',
    targetTopic: 'क्रीड़ा जगत: राष्ट्रीय व अंतरराष्ट्रीय खेल समाचार क्रिकेट',
    slotCount: 6,
    order: 4
  },
  {
    pageNumber: 5,
    pageTitle: 'कारोबार & बाजार (Business & Market)',
    headerType: 'folio',
    targetTopic: 'अर्थव्यवस्था, शेयर बाजार और व्यापार जगत की हलचल',
    slotCount: 6,
    order: 5
  },
  {
    pageNumber: 6,
    pageTitle: 'दुनिया & विदेश (World Affairs)',
    headerType: 'folio',
    targetTopic: 'विश्व पटल की प्रमुख कूटनीतिक और वैश्विक हलचल',
    slotCount: 6,
    order: 6
  },
  {
    pageNumber: 7,
    pageTitle: 'प्रादेशिक जिले (Regional Districts)',
    headerType: 'folio',
    targetTopic: 'हाजीपुर, वैशाली, मुजफ्फरपुर, गया और भागलपुर स्थानीय समाचार',
    slotCount: 6,
    order: 7
  },
  {
    pageNumber: 8,
    pageTitle: 'संपादकीय & विचार (Editorial & Analysis)',
    headerType: 'folio',
    targetTopic: 'विशेष संपादकीय आलेख और समसामयिक विषयों पर गहन विश्लेषण',
    slotCount: 3,
    order: 8
  }
];

/**
 * Get or seed default Automation Config and Blueprints for an Edition
 */
export async function getOrCreateAutomationConfig(editionSlug = 'patna-main') {
  // 1. Fetch real edition metadata from Database
  const edition = await prisma.edition.findUnique({
    where: { slug: editionSlug }
  });
  const editionCity = edition?.city || (editionSlug === 'patna-main' ? 'पटना' : editionSlug);

  let config = await prisma.epaperAutomationConfig.findUnique({
    where: { editionSlug },
    include: {
      blueprints: {
        orderBy: { pageNumber: 'asc' }
      },
      jobs: {
        orderBy: { createdAt: 'desc' },
        take: 10
      }
    }
  });

  if (!config) {
    // Dynamic city-tailored blueprint template for this edition
    const tailoredBlueprints = [
      {
        pageNumber: 1,
        pageTitle: 'मुख्य पृष्ठ (Front Page)',
        headerType: 'grand',
        targetTopic: 'भारत और दुनिया की मुख्य बड़ी खबरें',
        slotCount: 7,
        order: 1
      },
      {
        pageNumber: 2,
        pageTitle: `${editionCity} लोकल & ज़िला`,
        headerType: 'folio',
        targetTopic: `${editionCity} और आसपास की प्रमुख स्थानीय खबरें, विकास व प्रशासनिक कार्य`,
        slotCount: 7,
        order: 2
      },
      {
        pageNumber: 3,
        pageTitle: 'राज्य & प्रादेशिक (State & Region)',
        headerType: 'folio',
        targetTopic: `${editionCity} और राज्य की बड़ी खबरें, राजनीति व प्रशासनिक हलचल`,
        slotCount: 6,
        order: 3
      },
      {
        pageNumber: 4,
        pageTitle: 'राष्ट्रीय & राजनीति (National Politics)',
        headerType: 'folio',
        targetTopic: 'आज की राष्ट्रीय राजनीति और संसद की बड़ी खबरें',
        slotCount: 6,
        order: 4
      },
      {
        pageNumber: 5,
        pageTitle: 'कारोबार & बाजार (Business & Market)',
        headerType: 'folio',
        targetTopic: 'अर्थव्यवस्था, शेयर बाजार और व्यापार जगत की हलचल',
        slotCount: 6,
        order: 5
      },
      {
        pageNumber: 6,
        pageTitle: 'दुनिया & विदेश (World Affairs)',
        headerType: 'folio',
        targetTopic: 'विश्व पटल की प्रमुख कूटनीतिक और वैश्विक हलचल',
        slotCount: 6,
        order: 6
      },
      {
        pageNumber: 7,
        pageTitle: 'खेल जगत (Sports Arena)',
        headerType: 'folio',
        targetTopic: 'क्रीड़ा जगत: राष्ट्रीय व अंतरराष्ट्रीय खेल समाचार क्रिकेट',
        slotCount: 6,
        order: 7
      },
      {
        pageNumber: 8,
        pageTitle: 'संपादकीय & विचार (Editorial & Analysis)',
        headerType: 'folio',
        targetTopic: 'विशेष संपादकीय आलेख और समसामयिक विषयों पर गहन विश्लेषण',
        slotCount: 3,
        order: 8
      }
    ];

    config = await prisma.epaperAutomationConfig.create({
      data: {
        editionSlug,
        isEnabled: false,
        scheduleTime: '05:00',
        timezone: 'Asia/Kolkata',
        targetCity: editionCity,
        totalPages: tailoredBlueprints.length,
        autoPublish: false,
        blueprints: {
          create: tailoredBlueprints.map(bp => ({
            pageNumber: bp.pageNumber,
            pageTitle: bp.pageTitle,
            headerType: bp.headerType,
            targetTopic: bp.targetTopic,
            slotCount: bp.slotCount,
            order: bp.order,
            isActive: true
          }))
        }
      },
      include: {
        blueprints: {
          orderBy: { pageNumber: 'asc' }
        },
        jobs: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });
  }

  return config;
}

/**
 * Update Automation Settings and Page Blueprints
 */
export async function updateAutomationConfig(editionSlug = 'patna-main', updateData = {}) {
  const {
    isEnabled,
    scheduleTime,
    timezone,
    targetCity,
    autoPublish,
    blueprints = []
  } = updateData;

  const existingConfig = await getOrCreateAutomationConfig(editionSlug);

  const updatedConfig = await prisma.epaperAutomationConfig.update({
    where: { id: existingConfig.id },
    data: {
      ...(typeof isEnabled === 'boolean' ? { isEnabled } : {}),
      ...(scheduleTime ? { scheduleTime: String(scheduleTime).trim() } : {}),
      ...(timezone ? { timezone: String(timezone).trim() } : {}),
      ...(targetCity ? { targetCity: String(targetCity).trim() } : {}),
      ...(typeof autoPublish === 'boolean' ? { autoPublish } : {}),
      ...(Array.isArray(blueprints) && blueprints.length > 0 ? { totalPages: blueprints.length } : {})
    }
  });

  // If blueprints array is supplied, sync pages
  if (Array.isArray(blueprints) && blueprints.length > 0) {
    // Upsert or replace blueprints
    await prisma.epaperPageBlueprint.deleteMany({
      where: { configId: existingConfig.id }
    });

    for (let i = 0; i < blueprints.length; i++) {
      const bp = blueprints[i];
      const pageNum = Number(bp.pageNumber || (i + 1));
      await prisma.epaperPageBlueprint.create({
        data: {
          configId: existingConfig.id,
          pageNumber: pageNum,
          pageTitle: bp.pageTitle || (pageNum === 1 ? 'मुख्य पृष्ठ' : `पेज ${pageNum}`),
          headerType: bp.headerType || (pageNum === 1 ? 'grand' : 'folio'),
          targetTopic: bp.targetTopic || 'आज की मुख्य ताज़ा खबरें',
          slotCount: Math.min(12, Math.max(2, Number(bp.slotCount) || 6)),
          order: i + 1,
          isActive: bp.isActive !== false
        }
      });
    }
  }

  return getOrCreateAutomationConfig(editionSlug);
}

/**
 * Fetch Job Execution History for the Scheduler Dashboard
 * Includes Auto-Watchdog: Detects and resolves stale jobs stuck in 'GENERATING' >15 mins
 */
export async function getAutomationJobHistory(editionSlug = 'patna-main', limit = 20) {
  // Auto-Watchdog: Auto-detect interrupted/zombie jobs older than 15 minutes
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
  try {
    const staleJobs = await prisma.epaperScheduleJobLog.findMany({
      where: {
        editionSlug,
        status: 'GENERATING',
        startedAt: { lt: fifteenMinutesAgo }
      }
    });

    for (const job of staleJobs) {
      const updatedLog = (job.executionLog || '') + `\n[WATCHDOG] Execution was interrupted unexpectedly on Page ${job.pagesGenerated}/${job.totalPages} due to server process shutdown or restart. Status marked as INTERRUPTED.`;
      await prisma.epaperScheduleJobLog.update({
        where: { id: job.id },
        data: {
          status: 'INTERRUPTED',
          completedAt: job.completedAt || new Date(),
          errorMessage: `Execution interrupted unexpectedly on Page ${job.pagesGenerated}/${job.totalPages} (Server process stopped).`,
          executionLog: updatedLog
        }
      });
    }
  } catch (watchdogErr) {
    console.warn('[Auto-Watchdog Warning]:', watchdogErr.message);
  }

  return prisma.epaperScheduleJobLog.findMany({
    where: { editionSlug },
    orderBy: { createdAt: 'desc' },
    take: limit
  });
}

/**
 * Delete a specific job execution log (and optionally clear the associated draft issue)
 */
export async function deleteAutomationJobLog(jobLogId, { deleteIssue = false } = {}) {
  const log = await prisma.epaperScheduleJobLog.findUnique({ where: { id: jobLogId } });
  if (!log) return false;

  await prisma.epaperScheduleJobLog.delete({ where: { id: jobLogId } });

  if (deleteIssue && log.targetDate) {
    const targetDateObj = new Date(`${log.targetDate}T00:00:00.000Z`);
    await prisma.paperIssue.deleteMany({
      where: {
        edition: { slug: log.editionSlug },
        publishDate: targetDateObj
      }
    });
  }
  return true;
}

