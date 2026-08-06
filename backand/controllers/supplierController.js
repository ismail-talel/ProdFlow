const SupplierService = require('../services/supplierService');


exports.createSupplier = async (req, res, next) => {
  try {
    const supplier = await SupplierService.create(req.body);
    res.status(201).json({
      success: true,
      message: 'Fournisseur créé avec succès',
      data: supplier
    });
  } catch (error) {
    next(error);
  }
};


exports.getSuppliers = async (req, res, next) => {
  try {
    const { search, isActive } = req.query;
    const suppliers = await SupplierService.findAll({ search, isActive });
    
    res.json({
      success: true,
      count: suppliers.length,
      data: suppliers
    });
  } catch (error) {
    next(error);
  }
};


exports.getSupplierById = async (req, res, next) => {
  try {
    const supplier = await SupplierService.findById(req.params.id);
    
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Fournisseur non trouvé'
      });
    }
    
    res.json({
      success: true,
      data: supplier
    });
  } catch (error) {
    next(error);
  }
};


exports.updateSupplier = async (req, res, next) => {
  try {
    const supplier = await SupplierService.update(req.params.id, req.body);
    
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Fournisseur non trouvé'
      });
    }
    
    res.json({
      success: true,
      message: 'Fournisseur mis à jour avec succès',
      data: supplier
    });
  } catch (error) {
    next(error);
  }
};


exports.deleteSupplier = async (req, res, next) => {
  try {
    const supplier = await SupplierService.delete(req.params.id);
    
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Fournisseur non trouvé'
      });
    }
    
    res.json({
      success: true,
      message: 'Fournisseur supprimé avec succès'
    });
  } catch (error) {
    next(error);
  }
};


exports.deactivateSupplier = async (req, res, next) => {
  try {
    const supplier = await SupplierService.deactivate(req.params.id);
    
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Fournisseur non trouvé'
      });
    }
    
    res.json({
      success: true,
      message: 'Fournisseur désactivé avec succès',
      data: supplier
    });
  } catch (error) {
    next(error);
  }
};


exports.activateSupplier = async (req, res, next) => {
  try {
    const supplier = await SupplierService.activate(req.params.id);
    
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Fournisseur non trouvé'
      });
    }
    
    res.json({
      success: true,
      message: 'Fournisseur activé avec succès',
      data: supplier
    });
  } catch (error) {
    next(error);
  }
};


exports.searchSuppliers = async (req, res, next) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Terme de recherche requis'
      });
    }
    
    const suppliers = await SupplierService.search(q);
    
    res.json({
      success: true,
      count: suppliers.length,
      data: suppliers
    });
  } catch (error) {
    next(error);
  }
};


exports.getSupplierStats = async (req, res, next) => {
  try {
    const stats = await SupplierService.getStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};


exports.getSupplierProducts = async (req, res, next) => {
  try {
    const products = await SupplierService.getProducts(req.params.id);
    
    res.json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    next(error);
  }
};


exports.getSupplierOrders = async (req, res, next) => {
  try {
    const orders = await SupplierService.getOrders(req.params.id);
    
    res.json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    next(error);
  }
};
