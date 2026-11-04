import { sendSuccess } from '../../utils/response.js';
import * as epaperService from './epaper.service.js';
import { processAiEditorPrompt, generateFullPageNewspaper } from './aiAgent.service.js';
import * as epaperAutomationService from './epaperAutomation.service.js';

export const getReaderPage = async (req, res, next) => {
  try {
    const edition = req.query.edition || req.query.editionSlug;
    const date = req.query.date || req.query.publishDate;
    const pageNo = req.query.pageNo || req.query.pageNumber;
    if (!edition || !date) {
      return res.status(400).json({ success: false, message: 'edition and date query parameters are required' });
    }
    const result = await epaperService.getReaderPage(edition, date, pageNo || 1);
    return sendSuccess(res, 'Page data retrieved successfully', result);
  } catch (error) {
    next(error);
  }
};

export const getIssueDetails = async (req, res, next) => {
  try {
    const edition = req.query.edition || req.query.editionSlug;
    const date = req.query.date || req.query.publishDate;
    if (!edition || !date) {
      return res.status(400).json({ success: false, message: 'edition and date query parameters are required' });
    }
    const result = await epaperService.getIssueDetails(edition, date);
    return sendSuccess(res, 'Issue details retrieved successfully', result);
  } catch (error) {
    next(error);
  }
};

export const saveSlot = async (req, res, next) => {
  try {
    const result = await epaperService.saveSlot(req.body);
    return sendSuccess(res, result.message, result.slot);
  } catch (error) {
    next(error);
  }
};

export const publishPaper = async (req, res, next) => {
  try {
    const editionSlug = req.body.editionSlug || req.body.edition || 'patna-main';
    const publishDate = req.body.publishDate || req.body.date || new Date().toISOString().split('T')[0];
    const { status, pages } = req.body;
    const result = await epaperService.publishPaper(editionSlug, publishDate, status, pages);
    return res.status(200).json({
      success: true,
      isAlreadyPublished: Boolean(result.isAlreadyPublished),
      message: result.message,
      data: {
        ...result,
        pdfUrl: result.issue?.broadsheetPdfUrl || result.issue?.pdfUrl
      }
    });
  } catch (error) {
    next(error);
  }
};

export const addPage = async (req, res, next) => {
  try {
    const editionSlug = req.body.editionSlug || req.body.edition || 'patna-main';
    const publishDate = req.body.publishDate || req.body.date || new Date().toISOString().split('T')[0];
    const { pageNumber, title, templateKey, headerType, headerHeight, sectionTitle } = req.body;
    const result = await epaperService.addPage(
      editionSlug,
      publishDate,
      pageNumber,
      title,
      templateKey,
      headerType,
      headerHeight,
      sectionTitle
    );
    return sendSuccess(res, 'Page added successfully', result, 201);
  } catch (error) {
    next(error);
  }
};

export const generatePdf = async (req, res, next) => {
  try {
    let body = req.body || {};
    if (typeof body.data === 'string') {
      try { body = { ...body, ...JSON.parse(body.data) }; } catch {}
    } else if (body.data && typeof body.data === 'object') {
      body = { ...body, ...body.data };
    }
    const editionSlug = body.editionSlug || body.edition || 'patna-main';
    const publishDate = body.publishDate || body.date || new Date().toISOString().split('T')[0];
    const { editionName, editionTitle, editionCity, editionState, pages } = body;
    const result = await epaperService.generateIssuePdfService({ editionSlug, editionName, editionTitle, editionCity, editionState, publishDate, pages });
    return sendSuccess(res, result.message, result);
  } catch (error) {
    next(error);
  }
};

export const savePagesBulk = async (req, res, next) => {
  try {
    const editionSlug = req.body.editionSlug || req.body.edition || 'patna-main';
    const publishDate = req.body.publishDate || req.body.date || new Date().toISOString().split('T')[0];
    const pages = req.body.pages || [];
    const allowPagePruning = Boolean(req.body.allowPagePruning || req.body.clearExtraPages);
    const result = await epaperService.savePagesBulk(editionSlug, publishDate, pages, { allowPagePruning });
    return sendSuccess(res, result.message, result);
  } catch (error) {
    next(error);
  }
};

export const getStatesWithEditions = async (req, res, next) => {
  try {
    const result = await epaperService.getStatesWithEditions();
    return sendSuccess(res, 'States with active editions retrieved successfully', result);
  } catch (error) {
    next(error);
  }
};

export const getEditions = async (req, res, next) => {
  try {
    const result = await epaperService.getFlatEditions();
    return sendSuccess(res, 'Active editions list retrieved successfully', result);
  } catch (error) {
    next(error);
  }
};

export const getArchiveDates = async (req, res, next) => {
  try {
    const edition = req.query.edition || req.query.editionSlug || 'patna-main';
    const limit = req.query.limit || 30;
    const result = await epaperService.getArchiveDates(edition, limit);
    return sendSuccess(res, 'Archive dates retrieved successfully', result);
  } catch (error) {
    next(error);
  }
};

export const getTtsAudio = async (req, res, next) => {
  try {
    const text = req.query.text;
    if (!text) {
      return res.status(400).send('Missing text parameter');
    }
    const cleanText = text.slice(0, 200);
    const googleTtsUrl = 'https://translate.google.com/translate_tts?ie=UTF-8&tl=hi&client=tw-ob&q=' + encodeURIComponent(cleanText);
    const response = await fetch(googleTtsUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });
    if (!response.ok) {
      return res.status(response.status).send('Failed to fetch TTS audio');
    }
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.send(buffer);
  } catch (error) {
    next(error);
  }
};

export const aiAgent = async (req, res, next) => {
  try {
    const { prompt, activeSlot, history, apiKey, targetDate, date, editionCity } = req.body;
    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ success: false, message: 'Prompt is required' });
    }
    const result = await processAiEditorPrompt({
      prompt: prompt.trim(),
      activeSlot,
      history,
      customApiKey: apiKey,
      targetDate: targetDate || date,
      editionCity: editionCity || 'पटना'
    });
    return sendSuccess(res, 'AI Editor response generated successfully', result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to process AI prompt'
    });
  }
};

export const autoGeneratePage = async (req, res, next) => {
  try {
    const { prompt, topic, customPrompt, pageNumber, editionCity, slotCount, date, publishDate, archiveDate, apiKey } = req.body || {};
    const result = await generateFullPageNewspaper({
      prompt: prompt || customPrompt || topic || '',
      topic: topic || '',
      customPrompt: customPrompt || '',
      pageNumber: Number(pageNumber) || 1,
      editionCity: editionCity || 'पटना',
      slotCount: slotCount ? Number(slotCount) : null,
      date: date || publishDate || archiveDate || null,
      customApiKey: apiKey
    });
    return sendSuccess(res, 'Broadsheet newspaper page generated successfully with real-time news', result);
  } catch (error) {
    console.error('[autoGeneratePage] Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate broadsheet page'
    });
  }
};

export const getAutomationConfig = async (req, res, next) => {
  try {
    const edition = req.query.edition || req.query.editionSlug || 'patna-main';
    const config = await epaperAutomationService.getOrCreateAutomationConfig(edition);
    return sendSuccess(res, 'Automation configuration retrieved successfully', config);
  } catch (error) {
    console.error('[getAutomationConfig] Error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateAutomationConfig = async (req, res, next) => {
  try {
    const edition = req.body.editionSlug || req.query.edition || 'patna-main';
    const updated = await epaperAutomationService.updateAutomationConfig(edition, req.body);
    return sendSuccess(res, 'Automation configuration updated successfully', updated);
  } catch (error) {
    console.error('[updateAutomationConfig] Error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getAutomationJobHistory = async (req, res, next) => {
  try {
    const edition = req.query.edition || req.query.editionSlug || 'patna-main';
    const limit = Number(req.query.limit) || 20;
    const history = await epaperAutomationService.getAutomationJobHistory(edition, limit);
    return sendSuccess(res, 'Automation job history retrieved successfully', history);
  } catch (error) {
    console.error('[getAutomationJobHistory] Error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteAutomationJobHistory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleteIssue = req.query.deleteIssue === 'true' || req.query.clearIssue === 'true';
    if (!id) {
      return res.status(400).json({ success: false, message: 'Job Log ID is required' });
    }
    const result = await epaperAutomationService.deleteAutomationJobLog(id, { deleteIssue });
    if (!result) {
      return res.status(404).json({ success: false, message: 'Job Log not found or already deleted' });
    }
    return sendSuccess(res, 'Job log deleted successfully', { id, deleteIssue });
  } catch (error) {
    console.error('[deleteAutomationJobHistory] Error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const triggerManualAutomation = async (req, res, next) => {
  try {
    const { editionSlug, targetDate, apiKey } = req.body || {};
    const { executeAutomatedEditionGeneration } = await import('./epaperBatchGenerator.service.js');

    const isAsync = req.query.async === 'true';

    if (isAsync) {
      executeAutomatedEditionGeneration({
        editionSlug: editionSlug || 'patna-main',
        targetDate: targetDate || null,
        manualTrigger: true,
        customApiKey: apiKey || ''
      }).catch(err => console.error('[triggerManualAutomation Background Error]:', err.message));

      return sendSuccess(res, 'Automated newspaper edition generation triggered in background', {
        status: 'GENERATING',
        editionSlug: editionSlug || 'patna-main',
        targetDate: targetDate || new Date().toISOString().split('T')[0]
      });
    }

    const result = await executeAutomatedEditionGeneration({
      editionSlug: editionSlug || 'patna-main',
      targetDate: targetDate || null,
      manualTrigger: true,
      customApiKey: apiKey || ''
    });

    return sendSuccess(res, 'Automated newspaper edition generated successfully', result);
  } catch (error) {
    console.error('[triggerManualAutomation] Error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const triggerSchedulerTick = async (req, res, next) => {
  try {
    const { checkAndTriggerScheduledEpaperJobs, getCurrentIndiaDateTime } = await import('./epaperScheduler.service.js');
    const result = await checkAndTriggerScheduledEpaperJobs();
    const { timeStr, dateStr } = getCurrentIndiaDateTime();
    return res.status(200).json({
      success: true,
      message: 'Scheduler tick processed',
      indiaTime: timeStr,
      indiaDate: dateStr,
      data: result
    });
  } catch (error) {
    console.error('[triggerSchedulerTick] Error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
