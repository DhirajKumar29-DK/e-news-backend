/**
 * E-Paper Automated Daily Scheduler Service
 * Monitors publication schedules in Asia/Kolkata timezone, triggers automated multi-page
 * newspaper generation at the set time, and automatically recovers missed runs after server restarts.
 */

import { prisma } from '../../config/db.js';
import { executeAutomatedEditionGeneration } from './epaperBatchGenerator.service.js';

let schedulerInterval = null;
let isChecking = false;

/**
 * Get current time & date formatted in Asia/Kolkata timezone
 */
export function getCurrentIndiaDateTime() {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-GB', {
    timeZone: 'Asia/Kolkata',
    hour12: false,
    hour: '2-digit',
    minute: '2-digit'
  }); // e.g. "05:00"

  const dateStr = now.toLocaleDateString('en-CA', {
    timeZone: 'Asia/Kolkata'
  }); // e.g. "2026-11-02" (YYYY-MM-DD)

  return { timeStr, dateStr };
}

/**
 * Check active configurations and trigger generation if scheduled time matches or run was missed
 */
export async function checkAndTriggerScheduledEpaperJobs() {
  if (isChecking) return;
  isChecking = true;

  try {
    const { timeStr, dateStr } = getCurrentIndiaDateTime();

    // Query all automation configs that are ENABLED
    const activeConfigs = await prisma.epaperAutomationConfig.findMany({
      where: { isEnabled: true },
      include: {
        blueprints: {
          where: { isActive: true }
        }
      }
    });

    if (!activeConfigs || activeConfigs.length === 0) {
      isChecking = false;
      return;
    }

    for (const config of activeConfigs) {
      const editionSlug = config.editionSlug || 'patna-main';
      const scheduleTime = config.scheduleTime || '05:00';

      // 1. Check if an issue or completed job already exists for today
      const existingJobToday = await prisma.epaperScheduleJobLog.findFirst({
        where: {
          editionSlug,
          targetDate: dateStr,
          status: { in: ['AWAITING_APPROVAL', 'PUBLISHED', 'GENERATING'] }
        }
      });

      if (existingJobToday) {
        // Today's paper is already either generating, waiting for approval, or published
        continue;
      }

      // Check if PaperIssue already exists in DB for this date with pages
      const existingIssue = await prisma.paperIssue.findFirst({
        where: {
          edition: { slug: editionSlug },
          publishDate: new Date(`${dateStr}T00:00:00.000Z`),
          deletedAt: null
        },
        include: {
          pages: {
            where: { deletedAt: null },
            select: { id: true }
          }
        }
      });

      if (existingIssue && existingIssue.pages && existingIssue.pages.length > 0) {
        // Issue already exists and has pages populated
        continue;
      }

      // 2. Trigger Evaluation:
      // Condition A: Current minute matches scheduleTime (e.g. 05:00 === 05:00)
      const isExactTime = timeStr === scheduleTime;

      // Condition B: Missed Run Recovery
      // If current time is past scheduleTime (e.g. server booted up at 05:45 AM)
      // and today's issue does NOT exist yet, automatically trigger recovery!
      const isPastScheduleTime = timeStr > scheduleTime;
      const isMissedRecovery = isPastScheduleTime;

      if (isExactTime || isMissedRecovery) {
        console.log(`[EpaperScheduler] 🚀 Triggering automated generation for "${editionSlug}" on ${dateStr} (Reason: ${isExactTime ? 'Exact Time Match ' + scheduleTime : 'Missed Schedule Recovery'}).`);

        // Execute in background without awaiting to avoid blocking scheduler tick
        executeAutomatedEditionGeneration({
          editionSlug,
          targetDate: dateStr,
          manualTrigger: false
        }).catch((err) => {
          console.error(`[EpaperScheduler] Failed to execute generation for ${editionSlug}:`, err.message);
        });
      }
    }
  } catch (err) {
    console.warn('[EpaperScheduler] Error during schedule check tick:', err.message);
  } finally {
    isChecking = false;
  }
}

/**
 * Start the background scheduler daemon
 */
export function startEpaperScheduler() {
  if (schedulerInterval) {
    return; // Already started
  }

  console.log('⏰ [EpaperScheduler] Background scheduler initialized. Monitoring Asia/Kolkata daily publication schedules.');

  // Initial check 5s after boot (for missed run recovery)
  setTimeout(() => {
    checkAndTriggerScheduledEpaperJobs().catch(() => {});
  }, 5000);

  // Periodic check every 60 seconds (1 minute interval)
  schedulerInterval = setInterval(() => {
    checkAndTriggerScheduledEpaperJobs().catch(() => {});
  }, 60 * 1000);
}

/**
 * Stop the background scheduler
 */
export function stopEpaperScheduler() {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    console.log('[EpaperScheduler] Scheduler stopped.');
  }
}
