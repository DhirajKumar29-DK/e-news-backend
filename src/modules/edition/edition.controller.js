import { sendSuccess } from '../../utils/response.js';
import * as editionService from './edition.service.js';

export const getEditions = async (req, res, next) => {
  try {
    const includeInactive = req.query.includeInactive === 'true';
    const editions = await editionService.getAllEditions(includeInactive);
    return sendSuccess(res, 'Editions retrieved successfully', editions);
  } catch (error) {
    next(error);
  }
};

export const getEditionById = async (req, res, next) => {
  try {
    const edition = await editionService.getEditionByIdOrSlug(req.params.id);
    return sendSuccess(res, 'Edition retrieved successfully', edition);
  } catch (error) {
    next(error);
  }
};

export const createEdition = async (req, res, next) => {
  try {
    const newEdition = await editionService.createEdition(req.body);
    return sendSuccess(res, 'Edition created successfully', newEdition, 201);
  } catch (error) {
    next(error);
  }
};

export const updateEdition = async (req, res, next) => {
  try {
    const updatedEdition = await editionService.updateEdition(req.params.id, req.body);
    return sendSuccess(res, 'Edition updated successfully', updatedEdition);
  } catch (error) {
    next(error);
  }
};

export const deleteEdition = async (req, res, next) => {
  try {
    const result = await editionService.deleteEdition(req.params.id);
    return sendSuccess(res, result.message, null);
  } catch (error) {
    next(error);
  }
};
