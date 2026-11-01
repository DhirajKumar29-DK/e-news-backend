/**
 * AI Settings Controller
 */

import { sendSuccess } from '../../utils/response.js';
import * as aiSettingsService from './aiSettings.service.js';
import * as aiUsageService from './aiUsage.service.js';

export const getSettings = async (req, res, next) => {
  try {
    const data = await aiSettingsService.getPublicAiSettings();
    return sendSuccess(res, 'AI settings fetched successfully', data);
  } catch (error) {
    next(error);
  }
};

export const updateSettings = async (req, res, next) => {
  try {
    const data = await aiSettingsService.updateAiSettings(req.body);
    return sendSuccess(res, 'AI settings updated successfully', data);
  } catch (error) {
    if (error.message && (error.message.includes('Cannot save') || error.message.includes('test failed'))) {
      return res.status(400).json({ success: false, message: error.message });
    }
    next(error);
  }
};

export const fetchModels = async (req, res, next) => {
  try {
    const { provider, apiKey } = req.body;
    if (!provider) {
      return res.status(400).json({ success: false, message: 'Provider is required' });
    }
    const result = await aiSettingsService.fetchProviderModels({ provider, apiKey });
    return sendSuccess(res, `Models fetched successfully for ${provider.toUpperCase()}`, result);
  } catch (error) {
    if (error.message) {
      return res.status(400).json({ success: false, message: error.message });
    }
    next(error);
  }
};

export const testConnection = async (req, res, next) => {
  try {
    const { provider, model, apiKey } = req.body;
    if (!provider) {
      return res.status(400).json({ success: false, message: 'Provider is required' });
    }
    const result = await aiSettingsService.testConnection({ provider, model, apiKey });
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
        data: result
      });
    }
    return sendSuccess(res, result.message, result);
  } catch (error) {
    next(error);
  }
};

export const revealKey = async (req, res, next) => {
  try {
    const { provider } = req.body;
    if (!provider) {
      return res.status(400).json({ success: false, message: 'Provider is required' });
    }
    const key = await aiSettingsService.getDecryptedKeyForAdmin(provider);
    return sendSuccess(res, 'Key revealed successfully', { apiKey: key });
  } catch (error) {
    next(error);
  }
};

export const getUsageStats = async (req, res, next) => {
  try {
    const { provider } = req.query;
    const stats = await aiUsageService.getAiTokenUsageStats({ provider });
    return sendSuccess(res, 'AI Token usage statistics fetched successfully', stats);
  } catch (error) {
    next(error);
  }
};
