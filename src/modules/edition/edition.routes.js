import { Router } from 'express';
import * as editionController from './edition.controller.js';
import { validate } from '../../middleware/validate.middleware.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { createEditionSchema, updateEditionSchema } from './edition.validation.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Editions
 *   description: City / Regional Edition Management for Navbar Dropdown
 */

/**
 * @swagger
 * /editions:
 *   get:
 *     summary: Get all Active City Editions (Public)
 *     tags: [Editions]
 *     parameters:
 *       - in: query
 *         name: includeInactive
 *         schema:
 *           type: boolean
 *         description: Include inactive editions (Admin only preview)
 *     responses:
 *       200:
 *         description: List of city editions retrieved
 */
router.get('/', editionController.getEditions);

/**
 * @swagger
 * /editions/{id}:
 *   get:
 *     summary: Get Single Edition by ID or Slug (Public)
 *     tags: [Editions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Edition ID or Slug (e.g. patna-main)
 *     responses:
 *       200:
 *         description: Edition details
 *       404:
 *         description: Edition not found
 */
router.get('/:id', editionController.getEditionById);

/**
 * @swagger
 * /editions:
 *   post:
 *     summary: Create New City Edition (Admin Protected)
 *     tags: [Editions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - city
 *               - slug
 *             properties:
 *               name:
 *                 type: string
 *                 example: Patna Main (अपना पटना)
 *               city:
 *                 type: string
 *                 example: Patna
 *               slug:
 *                 type: string
 *                 example: patna-main
 *               code:
 *                 type: string
 *                 example: PAT_MAIN
 *               isActive:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       201:
 *         description: Edition created successfully
 *       401:
 *         description: Unauthorized
 */
router.post('/', authMiddleware(['ADMIN']), validate(createEditionSchema), editionController.createEdition);

/**
 * @swagger
 * /editions/{id}:
 *   put:
 *     summary: Update City Edition (Admin Protected)
 *     tags: [Editions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               city:
 *                 type: string
 *               slug:
 *                 type: string
 *               code:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Edition updated successfully
 *       401:
 *         description: Unauthorized
 */
router.put('/:id', authMiddleware(['ADMIN']), validate(updateEditionSchema), editionController.updateEdition);

/**
 * @swagger
 * /editions/{id}:
 *   delete:
 *     summary: Soft Delete City Edition (Admin Protected)
 *     tags: [Editions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Edition soft deleted successfully
 *       401:
 *         description: Unauthorized
 */
router.delete('/:id', authMiddleware(['ADMIN']), editionController.deleteEdition);

export default router;
