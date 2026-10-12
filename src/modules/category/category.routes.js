import { Router } from 'express';
import * as categoryController from './category.controller.js';

const router = Router();

// Public: Get all active categories (or all if ?all=true)
router.get('/', categoryController.getCategories);

// Admin: Create, Reorder, Update, Delete
router.post('/', categoryController.createCategory);
router.put('/reorder', categoryController.reorderCategories);
router.put('/:id', categoryController.updateCategory);
router.delete('/:id', categoryController.deleteCategory);

export default router;
