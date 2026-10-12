import * as categoryService from './category.service.js';

export async function getCategories(req, res) {
  try {
    const includeInactive = req.query.all === 'true' || req.query.includeInactive === 'true';
    const categories = await categoryService.getAllCategories(includeInactive);
    res.json({ success: true, data: categories });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function createCategory(req, res) {
  try {
    const category = await categoryService.createCategory(req.body);
    res.status(201).json({ success: true, message: 'Category created successfully', data: category });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

export async function updateCategory(req, res) {
  try {
    const category = await categoryService.updateCategory(req.params.id, req.body);
    res.json({ success: true, message: 'Category updated successfully', data: category });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

export async function reorderCategories(req, res) {
  try {
    const categories = await categoryService.reorderCategories(req.body.orderedIds);
    res.json({ success: true, message: 'Categories reordered successfully', data: categories });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

export async function deleteCategory(req, res) {
  try {
    await categoryService.deleteCategory(req.params.id);
    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}
