import { Router } from 'express';
import * as epaperController from './epaper.controller.js';
import { validate } from '../../middleware/validate.middleware.js';
import { saveSlotSchema, publishPaperSchema, addPageSchema, generatePdfSchema, savePagesBulkSchema } from './epaper.validation.js';

const router = Router();

// Dynamic States, Editions & Archive Dates Endpoints
router.get('/states-with-editions', epaperController.getStatesWithEditions);
router.get('/editions', epaperController.getEditions);
router.get('/archive-dates', epaperController.getArchiveDates);
router.get('/tts', epaperController.getTtsAudio);

// Reader & Issue Endpoints
router.get('/reader/page', epaperController.getReaderPage);
router.get('/issue', epaperController.getIssueDetails);

router.post('/admin/save-slot', validate(saveSlotSchema), epaperController.saveSlot);
router.post('/admin/save-pages-bulk', validate(savePagesBulkSchema), epaperController.savePagesBulk);
router.post('/admin/publish', validate(publishPaperSchema), epaperController.publishPaper);
router.post('/admin/publish-issue', validate(publishPaperSchema), epaperController.publishPaper);
router.post('/admin/add-page', validate(addPageSchema), epaperController.addPage);

// PDF Generation endpoints
router.post('/admin/generate-pdf', validate(generatePdfSchema), epaperController.generatePdf);
router.post('/generate-pdf', validate(generatePdfSchema), epaperController.generatePdf);

// AI News Editor Agent Endpoint (Conversational Gemini AI)
router.post('/ai-agent', epaperController.aiAgent);
router.post('/admin/ai-agent', epaperController.aiAgent);

export default router;
