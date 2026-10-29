import { sendSuccess } from '../../utils/response.js';
import * as reporterService from './reporter.service.js';

export const getReporters = async (req, res, next) => {
  try {
    const result = await reporterService.getAllReporters(req.query);
    return sendSuccess(res, 'Reporters retrieved successfully', result);
  } catch (error) {
    next(error);
  }
};

export const getReporter = async (req, res, next) => {
  try {
    const result = await reporterService.getReporterById(req.params.id);
    return sendSuccess(res, 'Reporter details retrieved successfully', result);
  } catch (error) {
    next(error);
  }
};

export const createReporter = async (req, res, next) => {
  try {
    const result = await reporterService.createReporterByAdmin(req.body);
    return sendSuccess(res, 'Reporter created successfully by administrator', result, 201);
  } catch (error) {
    next(error);
  }
};

export const updateStatus = async (req, res, next) => {
  try {
    const { status, rejectionReason } = req.body;
    const result = await reporterService.updateReporterStatus(req.params.id, status, rejectionReason);
    return sendSuccess(res, `Reporter status updated to ${result.status}`, result);
  } catch (error) {
    next(error);
  }
};

export const deleteReporter = async (req, res, next) => {
  try {
    const result = await reporterService.deleteReporter(req.params.id);
    return sendSuccess(res, result.message, null);
  } catch (error) {
    next(error);
  }
};

