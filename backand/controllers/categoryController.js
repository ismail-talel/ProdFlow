const CategoryService = require('../services/categoryService');

exports.getCategories = async (req, res, next) => {
  try {
    const categories = await CategoryService.findAll(req.query);
    res.json({ success: true, count: categories.length, data: categories });
  } catch (error) {
    next(error);
  }
};

exports.getCategoryById = async (req, res, next) => {
  try {
    const category = await CategoryService.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Catégorie non trouvée' });
    }
    res.json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
};

exports.createCategory = async (req, res, next) => {
  try {
    const category = await CategoryService.create(req.body);
    res.status(201).json({ success: true, message: 'Catégorie créée', data: category });
  } catch (error) {
    next(error);
  }
};

exports.updateCategory = async (req, res, next) => {
  try {
    const category = await CategoryService.update(req.params.id, req.body);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Catégorie non trouvée' });
    }
    res.json({ success: true, message: 'Catégorie mise à jour', data: category });
  } catch (error) {
    next(error);
  }
};

exports.deleteCategory = async (req, res, next) => {
  try {
    const category = await CategoryService.delete(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Catégorie non trouvée' });
    }
    res.json({ success: true, message: 'Catégorie supprimée' });
  } catch (error) {
    next(error);
  }
};
