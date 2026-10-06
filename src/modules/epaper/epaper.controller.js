import { sendSuccess } from '../../utils/response.js';
import * as epaperService from './epaper.service.js';
import { processAiEditorPrompt } from './aiAgent.service.js';

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
    const { editionSlug, publishDate, status, pages } = req.body;
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
    const { editionSlug, publishDate, pageNumber, title, templateKey } = req.body;
    const result = await epaperService.addPage(editionSlug, publishDate, pageNumber, title, templateKey);
    return sendSuccess(res, 'Page added successfully', result, 201);
  } catch (error) {
    next(error);
  }
};

export const generatePdf = async (req, res, next) => {
  try {
    const { editionSlug, editionName, editionTitle, editionCity, editionState, publishDate, pages } = req.body;
    if (!editionSlug || !publishDate) {
      return res.status(400).json({ success: false, message: 'editionSlug and publishDate are required' });
    }
    const result = await epaperService.generateIssuePdfService({ editionSlug, editionName, editionTitle, editionCity, editionState, publishDate, pages });
    return sendSuccess(res, result.message, result);
  } catch (error) {
    next(error);
  }
};

export const savePagesBulk = async (req, res, next) => {
  try {
    const { editionSlug, publishDate, pages } = req.body;
    const result = await epaperService.savePagesBulk(editionSlug, publishDate, pages);
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
    const { prompt, activeSlot, history, apiKey } = req.body;
    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ success: false, message: 'Prompt is required' });
    }
    const result = await processAiEditorPrompt({
      prompt: prompt.trim(),
      activeSlot,
      history,
      customApiKey: apiKey
    });
    return sendSuccess(res, 'AI Editor response generated successfully', result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to process AI prompt'
    });
  }
};
