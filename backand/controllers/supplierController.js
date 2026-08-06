const SupplierService = require('../services/supplierService');

// ============================================
// CRUD FOURNISSEUR - COMPLET
// ============================================

// ==========================================
// 1. CRÉER UN FOURNISSEUR
// ==========================================
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

// ==========================================
// 2. RÉCUPÉRER TOUS LES FOURNISSEURS
// ==========================================
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

// ==========================================
// 3. RÉCUPÉRER UN FOURNISSEUR PAR ID
// ==========================================
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

// ==========================================
// 4. METTRE À JOUR UN FOURNISSEUR
// ==========================================
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

// ==========================================
// 5. SUPPRIMER UN FOURNISSEUR (Définitif)
// ==========================================
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

// ==========================================
// 6. DÉSACTIVER UN FOURNISSEUR
// ==========================================
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

// ==========================================
// 7. ACTIVER UN FOURNISSEUR
// ==========================================
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

// ==========================================
// 8. RECHERCHER DES FOURNISSEURS
// ==========================================
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

// ==========================================
// 9. STATISTIQUES DES FOURNISSEURS
// ==========================================
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

// ==========================================
// 10. RÉCUPÉRER LES PRODUITS D'UN FOURNISSEUR
// ==========================================
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

// ==========================================
// 11. RÉCUPÉRER LES COMMANDES D'UN FOURNISSEUR
// ==========================================
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