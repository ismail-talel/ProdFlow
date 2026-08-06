const Category = require('../models/Category');
const Product = require('../models/Product');

class CategoryService {
  static async create(data) {
    const category = new Category(data);
    await category.save();
    return category;
  }

  static async findAll(filters = {}) {
    const query = {};
    if (filters.isActive !== undefined) {
      query.isActive = filters.isActive === 'true';
    }
    return await Category.find(query).sort({ name: 1 });
  }

  static async findById(id) {
    return await Category.findById(id);
  }

  static async update(id, data) {
    return await Category.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true });
  }

  static async delete(id) {
    const count = await Product.countDocuments({ category: id, isActive: true });
    if (count > 0) {
      throw new Error('Impossible de supprimer une catégorie utilisée par des produits');
    }
    return await Category.findByIdAndDelete(id);
  }
}

module.exports = CategoryService;
