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
  }); // e.g. "05:00", "23:59"

  const dateStr = now.toLocaleDateString('en-CA', {
    timeZone: 'Asia/Kolkata'
  }); // e.g. "2026-11-03" (YYYY-MM-DD)

  return { timeStr, dateStr };
}

/**
 * Determine the intended issue date for a given schedule configuration:
 * - Night schedules (>= 18:00, e.g. 23:59) triggered in the evening/night target TOMORROW'S edition.
 * - Otherwise, targets TODAY'S edition.
 */
export function getTargetDateForEdition(scheduleTime = '05:00') {
  const now = new Date();
  const { timeStr, dateStr } = getCurrentIndiaDateTime();

  const isNightSchedule = scheduleTime >= '18:00';
  const isCurrentlyEveningOrNight = timeStr >= '18:00';

  if (isNightSchedule && isCurrentlyEveningOrNight) {
    // Preparing tomorrow morning's newspaper ahead of time
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const tomorrowDateStr = tomorrow.toLocaleDateString('en-CA', {
      timeZone: 'Asia/Kolkata'
    });
    return { targetDate: tomorrowDateStr, isNextDayNightRun: true };
  }

  return { targetDate: dateStr, isNextDayNightRun: false };
}

/**
 * Check active configurations and trigger generation if scheduled time matches or run was missed.
 * Returns a summary of actions taken for diagnostics / manual tick API.
 */
export async function checkAndTriggerScheduledEpaperJobs() {
  if (isChecking) {
    return { skipped: true, reason: 'Check already in progress' };
  }
  isChecking = true;

  const results = [];

  try {
    const { timeStr } = getCurrentIndiaDateTime();

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
      return { skipped: true, reason: 'No active automation configs enabled', checkedAt: timeStr };
    }

    for (const config of activeConfigs) {
      const editionSlug = config.editionSlug || 'patna-main';
      const scheduleTime = config.scheduleTime || '05:00';
      const { targetDate } = getTargetDateForEdition(scheduleTime);

      // 1. Check if an issue or completed/generating job already exists for the target date
      const existingJobToday = await prisma.epaperScheduleJobLog.findFirst({
        where: {
          editionSlug,
          targetDate,
          status: { in: ['AWAITING_APPROVAL', 'PUBLISHED', 'GENERATING'] }
        }
      });

      if (existingJobToday) {
        results.push({
          editionSlug,
          targetDate,
          status: 'SKIPPED',
          reason: `Job already exists with status: ${existingJobToday.status}`
        });
        continue;
      }

      // Check if PaperIssue already exists in DB for this target date with pages
      const existingIssue = await prisma.paperIssue.findFirst({
        where: {
          edition: { slug: editionSlug },
          publishDate: new Date(`${targetDate}T00:00:00.000Z`),
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
        results.push({
          editionSlug,
          targetDate,
          status: 'SKIPPED',
          reason: `PaperIssue already exists with ${existingIssue.pages.length} pages`
        });
        continue;
      }

      // 2. Trigger Evaluation:
      // Condition A: Exact Time Match (e.g. 23:59 === 23:59 or 05:00 === 05:00)
      const isExactTime = timeStr === scheduleTime;

      // Condition B: Missed Run Recovery
      let isMissedRecovery = false;
      let recoveryReason = '';

      if (scheduleTime >= '18:00') {
        // Night schedule (e.g. 23:59):
        // If we are now in the morning/day of targetDate (timeStr < '18:00') and targetDate's issue is missing!
        if (timeStr < '18:00') {
          isMissedRecovery = true;
          recoveryReason = `Missed night generation (${scheduleTime}) for today's paper (${targetDate})`;
        }
      } else {
        // Morning/day schedule (e.g. 05:00):
        // If current time is past scheduled time (e.g. 05:01+ or 07:30) and issue is missing
        if (timeStr > scheduleTime) {
          isMissedRecovery = true;
          recoveryReason = `Missed morning generation (${scheduleTime}), current time is ${timeStr}`;
        }
      }

      if (isExactTime || isMissedRecovery) {
        const triggerReason = isExactTime
          ? `Exact Time Match (${scheduleTime})`
          : `Auto-Recovery: ${recoveryReason}`;

        console.log(`[EpaperScheduler] 🚀 Triggering automated generation for "${editionSlug}" on ${targetDate} (${triggerReason}).`);

        results.push({
          editionSlug,
          targetDate,
          status: 'TRIGGERED',
          reason: triggerReason
        });

        // Execute in background without awaiting to avoid blocking scheduler tick
        executeAutomatedEditionGeneration({
          editionSlug,
          targetDate,
          manualTrigger: false
        }).catch((err) => {
          console.error(`[EpaperScheduler] Failed to execute generation for ${editionSlug}:`, err.message);
        });
      } else {
        results.push({
          editionSlug,
          targetDate,
          status: 'PENDING',
          reason: `Waiting for scheduled time ${scheduleTime} (Current: ${timeStr})`
        });
      }
    }

    return {
      success: true,
      checkedAt: timeStr,
      results
    };
  } catch (err) {
    console.warn('[EpaperScheduler] Error during schedule check tick:', err.message);
    return {
      success: false,
      error: err.message
    };
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
