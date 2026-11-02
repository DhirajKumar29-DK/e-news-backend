/**
 * E-Paper Multi-Page Automated Batch Generation Engine
 * Iterates through newspaper page blueprints sequentially, pulls verified live news,
 * applies layout geometry, and persists the full multi-page edition in DRAFT status.
 */

import { prisma } from '../../config/db.js';
import { generateFullPageNewspaper } from './aiAgent.service.js';
import { savePagesBulk, publishIssue } from './epaper.service.js';
import { getOrCreateAutomationConfig } from './epaperAutomation.service.js';

// In-memory active generation lock to prevent concurrent duplicate runs
const activeLocks = new Set();

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Execute automated generation for an entire edition based on its page blueprints
 */
export async function executeAutomatedEditionGeneration({
  editionSlug = 'patna-main',
  targetDate = null,
  manualTrigger = false,
  customApiKey = ''
}) {
  const effectiveDate = targetDate || new Date().toISOString().split('T')[0];
  const lockKey = `${editionSlug}_${effectiveDate}`;

  if (activeLocks.has(lockKey)) {
    console.warn(`[BatchGenerator] Generation already in progress for ${lockKey}. Skipping duplicate invocation.`);
    return {
      success: false,
      message: `Generation already actively in progress for ${editionSlug} on ${effectiveDate}.`,
      isDuplicateBlocked: true
    };
  }

  activeLocks.add(lockKey);
  const startTime = Date.now();
  const logEntries = [];

  const addLog = (msg) => {
    const ts = new Date().toISOString().substring(11, 19);
    const line = `[${ts}] ${msg}`;
    logEntries.push(line);
    console.log(`[EpaperAutomation] ${line}`);
  };

  addLog(`Starting automated newspaper generation for "${editionSlug}" (Target Date: ${effectiveDate}, Trigger: ${manualTrigger ? 'Manual' : 'Scheduled'})`);

  let jobLog = null;
  try {
    const config = await getOrCreateAutomationConfig(editionSlug);

    if (!config.isEnabled && !manualTrigger) {
      addLog(`Scheduler is disabled for ${editionSlug}. Aborting.`);
      activeLocks.delete(lockKey);
      return { success: false, message: 'Scheduler is currently disabled.' };
    }

    const activeBlueprints = (config.blueprints || [])
      .filter((bp) => bp.isActive !== false)
      .sort((a, b) => a.pageNumber - b.pageNumber);

    if (activeBlueprints.length === 0) {
      addLog('No active page blueprints found. Aborting.');
      activeLocks.delete(lockKey);
      return { success: false, message: 'No active page blueprints configured.' };
    }

    addLog(`Loaded ${activeBlueprints.length} page blueprint(s). Creating job record...`);

    // Create DB Job Log record
    jobLog = await prisma.epaperScheduleJobLog.create({
      data: {
        configId: config.id,
        editionSlug,
        targetDate: effectiveDate,
        status: 'GENERATING',
        totalPages: activeBlueprints.length,
        pagesGenerated: 0,
        startedAt: new Date(),
        executionLog: logEntries.join('\n')
      }
    });

    const generatedPages = [];

    for (let i = 0; i < activeBlueprints.length; i++) {
      const bp = activeBlueprints[i];
      const pageNum = bp.pageNumber || i + 1;
      addLog(`Generating Page ${pageNum}/${activeBlueprints.length}: "${bp.pageTitle}" (Topic: "${bp.targetTopic}", Slots: ${bp.slotCount})...`);

      try {
        const effectivePagePrompt = (bp.targetTopic && bp.targetTopic.trim())
          ? `${bp.pageTitle ? bp.pageTitle + ': ' : ''}${bp.targetTopic}`
          : (bp.pageTitle || 'आज की मुख्य ताज़ा खबरें');

        const pageResult = await generateFullPageNewspaper({
          prompt: effectivePagePrompt,
          pageNumber: pageNum,
          editionCity: config.targetCity || 'पटना',
          slotCount: bp.slotCount,
          date: effectiveDate,
          customApiKey
        });

        if (pageResult && Array.isArray(pageResult.slots) && pageResult.slots.length > 0) {
          addLog(`  -> Page ${pageNum} successfully generated with ${pageResult.slots.length} verified slots.`);
          generatedPages.push({
            pageNumber: pageNum,
            title: bp.pageTitle,
            sectionTitle: bp.pageTitle,
            headerType: bp.headerType || (pageNum === 1 ? 'grand' : 'folio'),
            templateKey: bp.headerType || (pageNum === 1 ? 'grand' : 'folio'),
            slots: pageResult.slots
          });
        } else {
          addLog(`  -> Warning: Page ${pageNum} returned 0 slots. Building fallback layout.`);
          generatedPages.push({
            pageNumber: pageNum,
            title: bp.pageTitle,
            sectionTitle: bp.pageTitle,
            headerType: bp.headerType || (pageNum === 1 ? 'grand' : 'folio'),
            templateKey: bp.headerType || (pageNum === 1 ? 'grand' : 'folio'),
            slots: []
          });
        }
      } catch (pageErr) {
        addLog(`  -> Error generating Page ${pageNum}: ${pageErr.message}. Continuing with next page.`);
        generatedPages.push({
          pageNumber: pageNum,
          title: bp.pageTitle,
          sectionTitle: bp.pageTitle,
          headerType: bp.headerType || (pageNum === 1 ? 'grand' : 'folio'),
          templateKey: bp.headerType || (pageNum === 1 ? 'grand' : 'folio'),
          slots: []
        });
      }

      // Update progress in job log
      await prisma.epaperScheduleJobLog.update({
        where: { id: jobLog.id },
        data: {
          pagesGenerated: generatedPages.length,
          executionLog: logEntries.join('\n')
        }
      });

      // Rate limit cushion: Pause 4s between LLM generations (skip pause after last page)
      if (i < activeBlueprints.length - 1) {
        addLog(`  -> Pausing 4s for AI token rate-limit cushion...`);
        await sleep(4000);
      }
    }

    addLog(`All ${generatedPages.length} page(s) generated. Persisting entire edition to database via savePagesBulk...`);

    // Save entire edition in DRAFT status
    const saveResult = await savePagesBulk(editionSlug, effectiveDate, generatedPages);
    addLog(`Database persistence complete: ${saveResult?.message || 'Success'}`);

    // If autoPublish is explicitly enabled (e.g. non-hybrid), publish immediately.
    // By default (Hybrid Mode), it remains DRAFT awaiting Admin approval!
    let finalStatus = 'AWAITING_APPROVAL';
    if (config.autoPublish) {
      addLog(`Auto-Publish is ENABLED. Publishing edition immediately...`);
      try {
        await publishIssue(editionSlug, effectiveDate, 'PUBLISHED', generatedPages);
        finalStatus = 'PUBLISHED';
        addLog(`Edition published automatically.`);
      } catch (pubErr) {
        addLog(`Auto-Publish note: ${pubErr.message}`);
      }
    } else {
      addLog(`Hybrid Mode Active: Edition saved as DRAFT. Ready for Admin Review & Approval in E-Paper Studio.`);
    }

    const durationSec = Math.round((Date.now() - startTime) / 1000);
    addLog(`Automation job completed successfully in ${durationSec}s. Final Status: ${finalStatus}`);

    // Update job log to completed status
    await prisma.epaperScheduleJobLog.update({
      where: { id: jobLog.id },
      data: {
        status: finalStatus,
        pagesGenerated: generatedPages.length,
        completedAt: new Date(),
        executionLog: logEntries.join('\n')
      }
    });

    // Update lastRun timestamp in config
    await prisma.epaperAutomationConfig.update({
      where: { id: config.id },
      data: {
        updatedAt: new Date()
      }
    });

    activeLocks.delete(lockKey);

    return {
      success: true,
      jobId: jobLog.id,
      editionSlug,
      date: effectiveDate,
      totalPagesGenerated: generatedPages.length,
      status: finalStatus,
      durationSeconds: durationSec,
      pages: generatedPages
    };
  } catch (err) {
    const durationSec = Math.round((Date.now() - startTime) / 1000);
    addLog(`FATAL ERROR during batch generation: ${err.message}`);
    console.error('[BatchGenerator] Error:', err);

    if (jobLog) {
      await prisma.epaperScheduleJobLog.update({
        where: { id: jobLog.id },
        data: {
          status: 'FAILED',
          errorMessage: err.message,
          completedAt: new Date(),
          executionLog: logEntries.join('\n')
        }
      });
    }

    activeLocks.delete(lockKey);

    return {
      success: false,
      message: err.message,
      executionLog: logEntries.join('\n')
    };
  }
}

