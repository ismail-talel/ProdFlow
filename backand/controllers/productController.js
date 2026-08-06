const ProductService = require('../services/productService');

exports.getProducts = async (req, res, next) => {
  try {
    const products = await ProductService.findAll(req.query);
    res.json({ success: true, count: products.length, data: products });
  } catch (error) {
    next(error);
  }
};

exports.getProductById = async (req, res, next) => {
  try {
    const product = await ProductService.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Produit non trouvé' });
    }
    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

exports.searchProducts = async (req, res, next) => {
  try {
    const { q } = req.query;
    const normalizedQuery = typeof q === 'string' ? q.trim() : '';

    if (!normalizedQuery) {
      return res.status(400).json({ success: false, message: 'Terme de recherche requis' });
    }

    const products = await ProductService.search(normalizedQuery);
    res.json({ success: true, count: products.length, data: products });
  } catch (error) {
    next(error);
  }
};

exports.getLowStockProducts = async (req, res, next) => {
  try {
    const products = await ProductService.getLowStock();
    res.json({ success: true, count: products.length, data: products });
  } catch (error) {
    next(error);
  }
};

exports.createProduct = async (req, res, next) => {
  try {
    const product = await ProductService.create(req.body);
    res.status(201).json({ success: true, message: 'Produit créé', data: product });
  } catch (error) {
    next(error);
  }
};

exports.updateProduct = async (req, res, next) => {
  try {
    const product = await ProductService.update(req.params.id, req.body);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Produit non trouvé' });
    }
    res.json({ success: true, message: 'Produit mis à jour', data: product });
  } catch (error) {
    next(error);
  }
};

exports.updateStock = async (req, res, next) => {
  try {
    const { quantity, operation } = req.body;
    const numericQuantity = Number(quantity);
    const normalizedOperation = typeof operation === 'string' ? operation.toLowerCase() : 'set';

    if (quantity === undefined || quantity === null || Number.isNaN(numericQuantity)) {
      return res.status(400).json({ success: false, message: 'Quantité invalide' });
    }

    if (!['increment', 'decrement', 'set'].includes(normalizedOperation)) {
      return res.status(400).json({ success: false, message: 'Opération de stock invalide' });
    }

    const product = await ProductService.updateStock(req.params.id, numericQuantity, normalizedOperation);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Produit non trouvé' });
    }

    res.json({ success: true, message: 'Stock mis à jour', data: product });
  } catch (error) {
    next(error);
  }
};

exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await ProductService.delete(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Produit non trouvé' });
    }
    res.json({ success: true, message: 'Produit désactivé' });
  } catch (error) {
    next(error);
  }
};
