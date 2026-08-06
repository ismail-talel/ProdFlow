const { Order, Product, Supplier } = require('../models');
const { UserRoles } = require('../models/UserRoles');
const mongoose = require('mongoose');

const createError = (message, status = 400) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

const validateObjectId = (id, fieldName = 'ID') => {
  if (!id) {
    throw createError(`${fieldName} est requis`, 400);
  }
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw createError(`Format de ${fieldName} invalide`, 400);
  }
  return id;
};

const CREATABLE_BY = [
  UserRoles.SUPER_ADMIN,
  UserRoles.ADMIN_MAGASIN,
  UserRoles.RESPONSABLE_RECEPTION
];

const CONFIRMABLE_MODIFIABLE_BY = [
  UserRoles.SUPER_ADMIN,
  UserRoles.ADMIN_MAGASIN,
  UserRoles.RESPONSABLE_RECEPTION,
  UserRoles.EXPEDITION_MAGASIN
];

const MODIFIABLE_STATUSES = ['en_attente_verification'];
const CONFIRMABLE_STATUSES = ['en_attente_verification'];

const assertRole = (user, allowedRoles, message) => {
  if (!user || !allowedRoles.includes(user.role)) {
    throw createError(message || 'Accès refusé pour votre rôle', 403);
  }
};

const userSnapshot = (user) => ({
  id: user._id,
  nom: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
  email: user.email,
  role: user.role
});

class OrderService {
  static async findAll(filters = {}) {
    const query = {};
    if (filters.status) query.status = filters.status;
    if (filters.supplierId) {
      validateObjectId(filters.supplierId, 'Supplier ID');
      query.supplier = filters.supplierId;
    }
    if (filters.createdBy) {
      validateObjectId(filters.createdBy, 'CreatedBy ID');
      query.createdBy = filters.createdBy;
    }

    return await Order.find(query)
      .populate('supplier', 'name designation reference code')
      .populate('createdBy', 'firstName lastName email role')
      .populate('confirmedBy', 'firstName lastName email role')
      .populate('products.product', 'reference designation name priceHT unitPrice')
      .sort({ createdAt: -1 });
  }

  static async findById(id) {
    validateObjectId(id, 'Order ID');
    const order = await Order.findById(id)
      .populate('supplier')
      .populate('createdBy', 'firstName lastName email role')
      .populate('confirmedBy', 'firstName lastName email role')
      .populate('receivedBy', 'firstName lastName email role')
      .populate('products.product')
      .populate('history.user.id', 'firstName lastName email role');

    if (!order) {
      throw createError('Commande non trouvée', 404);
    }
    return order;
  }

  // ==========================================
  // CRÉER — responsable magasin / réception
  // ==========================================
  static async create(data, user) {
    assertRole(
      user,
      CREATABLE_BY,
      'Seul le responsable magasin ou le responsable réception peut créer un bon de commande'
    );

    if (!data.supplierId) throw createError('Fournisseur requis', 400);
    validateObjectId(data.supplierId, 'Supplier ID');

    if (!Array.isArray(data.products) || data.products.length === 0) {
      throw createError('Au moins un produit est requis', 400);
    }

    const supplier = await Supplier.findById(data.supplierId);
    if (!supplier) throw createError('Fournisseur non trouvé', 404);

    const orderNumber = `CMD-${Date.now()}`;
    let totalAmount = 0;
    const products = [];

    for (const item of data.products) {
      if (!item.productId) {
        throw createError('ID produit requis pour chaque produit', 400);
      }
      validateObjectId(item.productId, 'Product ID');

      const quantity = Number(item.quantity);
      if (!Number.isFinite(quantity) || quantity <= 0) {
        throw createError('Quantité invalide pour le produit', 400);
      }

      const product = await Product.findById(item.productId);
      if (!product) throw createError(`Produit ${item.productId} non trouvé`, 404);

      const rawPrice = item.unitPrice ?? product.priceHT ?? product.unitPrice ?? 0;
      const unitPrice = Number(rawPrice);
      if (!Number.isFinite(unitPrice) || unitPrice < 0) {
        throw createError('Prix unitaire invalide pour le produit', 400);
      }

      const total = unitPrice * quantity;
      totalAmount += total;

      products.push({
        product: product._id,
        quantity,
        unitPrice,
        total,
        remainingQuantity: quantity
      });
    }

    const deliveryDate = data.deliveryDate
      ? new Date(data.deliveryDate)
      : undefined;
    if (deliveryDate && Number.isNaN(deliveryDate.getTime())) {
      throw createError('Date de livraison invalide', 400);
    }

    const order = new Order({
      orderNumber,
      supplier: data.supplierId,
      products,
      totalAmount,
      deliveryDate,
      notes: data.notes || '',
      createdBy: user._id,
      status: 'en_attente_verification'
    });

    order.addHistory({
      action: 'CREATION',
      user,
      description: `Création du bon de commande par ${user.role}`,
      commentaire: data.commentaire || '',
      details: {
        totalAmount,
        productCount: products.length,
        createdByRole: user.role,
        additionalInfo: { user: userSnapshot(user) }
      }
    });

    await order.save();
    return order;
  }

  // ==========================================
  // MODIFIER — réception / expédition
  // ==========================================
  static async modify(id, data, user, commentaire = '') {
    assertRole(
      user,
      CONFIRMABLE_MODIFIABLE_BY,
      'Seul le responsable réception ou le magasin expédition peut modifier un bon de commande'
    );

    validateObjectId(id, 'Order ID');
    const order = await Order.findById(id);
    if (!order) throw createError('Commande non trouvée', 404);

    if (!MODIFIABLE_STATUSES.includes(order.status)) {
      throw createError(
        'Le bon de commande ne peut être modifié qu\'en attente de vérification',
        400
      );
    }

    const oldStatus = order.status;
    const oldTotal = order.totalAmount;
    const changes = [];

    if (data.notes !== undefined && data.notes !== order.notes) {
      changes.push({ field: 'notes', oldValue: order.notes, newValue: data.notes });
      order.notes = data.notes;
    }

    if (data.deliveryDate !== undefined) {
      const newDate = data.deliveryDate ? new Date(data.deliveryDate) : null;
      changes.push({ field: 'deliveryDate', oldValue: order.deliveryDate, newValue: newDate });
      order.deliveryDate = newDate;
    }

    if (data.supplierId) {
      validateObjectId(data.supplierId, 'Supplier ID');
      const supplier = await Supplier.findById(data.supplierId);
      if (!supplier) throw createError('Fournisseur non trouvé', 404);
      if (order.supplier.toString() !== data.supplierId) {
        changes.push({
          field: 'supplier',
          oldValue: order.supplier,
          newValue: data.supplierId
        });
        order.supplier = data.supplierId;
      }
    }

    if (Array.isArray(data.products) && data.products.length > 0) {
      const updatedProducts = [];

      for (const item of data.products) {
        if (!item.productId) {
          throw createError('ID produit requis pour chaque produit', 400);
        }
        validateObjectId(item.productId, 'Product ID');

        if (!item.quantity || item.quantity <= 0) {
          throw createError('Quantité doit être supérieure à 0', 400);
        }

        const existing = order.products.find(
          (p) => p.product.toString() === item.productId
        );
        const dbProduct = await Product.findById(item.productId);
        if (!dbProduct) throw createError(`Produit ${item.productId} non trouvé`, 404);

        const unitPrice =
          item.unitPrice ??
          existing?.unitPrice ??
          dbProduct.priceHT ??
          dbProduct.unitPrice ??
          0;
        const receivedQty = existing?.receivedQuantity || 0;

        if (existing) {
          if (existing.quantity !== item.quantity || existing.unitPrice !== unitPrice) {
            changes.push({
              field: 'product',
              productId: item.productId,
              oldValue: { quantity: existing.quantity, unitPrice: existing.unitPrice },
              newValue: { quantity: item.quantity, unitPrice }
            });
          }
        } else {
          changes.push({
            field: 'ajout_produit',
            productId: item.productId,
            newValue: { quantity: item.quantity, unitPrice }
          });
        }

        updatedProducts.push({
          product: dbProduct._id,
          quantity: item.quantity,
          unitPrice,
          total: item.quantity * unitPrice,
          receivedQuantity: receivedQty,
          remainingQuantity: Math.max(0, item.quantity - receivedQty)
        });
      }

      const removed = order.products.filter(
        (p) => !data.products.some((item) => item.productId === p.product.toString())
      );
      for (const r of removed) {
        changes.push({
          field: 'suppression_produit',
          productId: r.product,
          oldValue: { quantity: r.quantity, unitPrice: r.unitPrice }
        });
      }

      order.products = updatedProducts;
      order.totalAmount = order.products.reduce((sum, p) => sum + p.total, 0);
    }

    if (changes.length === 0) {
      throw createError('Aucune modification détectée', 400);
    }

    // Enregistrer aussi dans corrections[]
    for (const change of changes) {
      order.corrections.push({
        field: change.field,
        oldValue: change.oldValue,
        newValue: change.newValue,
        modifiedBy: user._id,
        modifiedAt: new Date(),
        reason: commentaire || 'Modification du bon de commande'
      });
    }

    // Statut inchangé : uniquement Attente Vérification / Confirmé
    order.status = 'en_attente_verification';
    order.version += 1;

    order.addHistory({
      action: 'MODIFICATION',
      oldStatus,
      newStatus: order.status,
      user,
      description: `Modification du bon de commande par ${user.role}`,
      commentaire,
      details: {
        corrections: changes,
        oldTotal,
        newTotal: order.totalAmount,
        additionalInfo: { modifiedByRole: user.role }
      },
      version: order.version
    });

    await order.save();
    return order;
  }

  // Compat : anciennes corrections via verify
  static async verifyAndCorrect(id, corrections, user, commentaire = '') {
    assertRole(
      user,
      CONFIRMABLE_MODIFIABLE_BY,
      'Seul le responsable réception ou le magasin expédition peut corriger un bon de commande'
    );

    validateObjectId(id, 'Order ID');

    if (!Array.isArray(corrections) || corrections.length === 0) {
      throw createError('Au moins une correction est requise', 400);
    }

    const order = await Order.findById(id);
    if (!order) throw createError('Commande non trouvée', 404);

    if (!MODIFIABLE_STATUSES.includes(order.status)) {
      throw createError('La commande ne peut pas être modifiée dans son état actuel', 400);
    }

    const oldStatus = order.status;
    const oldTotal = order.totalAmount;
    const appliedCorrections = [];

    for (const correction of corrections) {
      if (correction.field === 'products') {
        if (!Array.isArray(correction.products)) {
          throw createError('Format de correction produit invalide', 400);
        }

        for (const productCorr of correction.products) {
          if (!productCorr.productId) {
            throw createError('ID produit requis pour la correction', 400);
          }
          validateObjectId(productCorr.productId, 'Product ID');

          const product = order.products.find(
            (p) => p.product.toString() === productCorr.productId
          );
          if (product) {
            const oldQty = product.quantity;
            const oldPrice = product.unitPrice;
            const receivedQty = product.receivedQuantity || 0;

            if (productCorr.quantity !== undefined && productCorr.quantity <= 0) {
              throw createError('Quantité doit être supérieure à 0', 400);
            }

            product.quantity = productCorr.quantity ?? product.quantity;
            product.unitPrice = productCorr.unitPrice ?? product.unitPrice;
            product.total = product.quantity * product.unitPrice;
            product.remainingQuantity = Math.max(0, product.quantity - receivedQty);

            appliedCorrections.push({
              productId: product.product,
              oldQuantity: oldQty,
              newQuantity: product.quantity,
              oldPrice,
              newPrice: product.unitPrice
            });

            order.corrections.push({
              field: 'product',
              oldValue: { quantity: oldQty, unitPrice: oldPrice },
              newValue: { quantity: product.quantity, unitPrice: product.unitPrice },
              modifiedBy: user._id,
              reason: commentaire || 'Correction'
            });
          }
        }
      } else {
        const oldValue = order[correction.field];
        order[correction.field] = correction.newValue;
        appliedCorrections.push({
          field: correction.field,
          oldValue,
          newValue: correction.newValue
        });
        order.corrections.push({
          field: correction.field,
          oldValue,
          newValue: correction.newValue,
          modifiedBy: user._id,
          reason: commentaire || 'Correction'
        });
      }
    }

    order.totalAmount = order.products.reduce((sum, p) => sum + p.total, 0);
    order.status = 'en_attente_verification';
    order.version += 1;

    order.addHistory({
      action: 'CORRECTION',
      oldStatus,
      newStatus: order.status,
      user,
      description: `Corrections apportées par ${user.role}`,
      commentaire,
      details: {
        corrections: appliedCorrections,
        oldTotal,
        newTotal: order.totalAmount
      },
      version: order.version
    });

    await order.save();
    return order;
  }

  // ==========================================
  // CONFIRMER — réception / expédition
  // ==========================================
  static async confirm(id, user, commentaire = '') {
    assertRole(
      user,
      CONFIRMABLE_MODIFIABLE_BY,
      'Seul le responsable réception ou le magasin expédition peut confirmer un bon de commande'
    );

    validateObjectId(id, 'Order ID');

    const order = await Order.findById(id);
    if (!order) throw createError('Commande non trouvée', 404);

    if (order.status === 'confirme') {
      throw createError('Commande déjà confirmée', 400);
    }

    if (!CONFIRMABLE_STATUSES.includes(order.status)) {
      throw createError(
        'Seuls les bons en attente de vérification peuvent être confirmés',
        400
      );
    }

    const oldStatus = order.status;
    order.status = 'confirme';
    order.confirmedBy = user._id;
    order.confirmedAt = new Date();

    order.addHistory({
      action: 'CONFIRMATION',
      oldStatus,
      newStatus: order.status,
      user,
      description: `Confirmation du bon de commande par ${user.role}`,
      commentaire,
      details: {
        totalAmount: order.totalAmount,
        additionalInfo: { confirmedByRole: user.role }
      }
    });

    await order.save();
    return order;
  }

  static async receive(id, receivedProducts, user, commentaire = '') {
    validateObjectId(id, 'Order ID');

    const order = await Order.findById(id);
    if (!order) throw createError('Commande non trouvée', 404);

    if (order.status !== 'confirme') {
      throw createError('La commande doit être confirmée avant réception', 400);
    }

    if (!Array.isArray(receivedProducts) || receivedProducts.length === 0) {
      throw createError('Liste des produits reçus requise', 400);
    }

    const oldStatus = order.status;
    const receivedDetails = [];

    for (const received of receivedProducts) {
      if (!received.productId) {
        throw createError('ID produit requis pour la réception', 400);
      }
      validateObjectId(received.productId, 'Product ID');

      if (!received.quantity || received.quantity <= 0) {
        throw createError('Quantité reçue doit être supérieure à 0', 400);
      }

      const product = order.products.find(
        (p) => p.product.toString() === received.productId
      );

      if (!product) {
        throw createError(`Produit ${received.productId} non trouvé dans la commande`, 404);
      }

      if (received.quantity > product.remainingQuantity) {
        throw createError(
          `Quantité reçue (${received.quantity}) dépasse la quantité restante (${product.remainingQuantity})`,
          400
        );
      }

      product.receivedQuantity += received.quantity;
      product.remainingQuantity -= received.quantity;

      receivedDetails.push({
        productId: product.product,
        quantity: received.quantity,
        remaining: product.remainingQuantity
      });

      const dbProduct = await Product.findById(received.productId);
      if (dbProduct) {
        dbProduct.quantity += received.quantity;
        await dbProduct.save();
      }
    }

    const allReceived = order.products.every((p) => p.remainingQuantity === 0);
    // Statuts métier : uniquement Attente Vérification / Confirmé
    order.status = 'confirme';
    order.receivedBy = user._id;
    order.receivedDate = new Date();

    order.addHistory({
      action: allReceived ? 'RECEPTION' : 'RECEPTION_PARTIELLE',
      oldStatus,
      newStatus: order.status,
      user,
      description: allReceived ? 'Réception complète' : 'Réception partielle',
      commentaire,
      details: {
        receivedProducts: receivedDetails,
        totalReceived: receivedDetails.reduce((sum, r) => sum + r.quantity, 0)
      }
    });

    await order.save();
    return order;
  }

  static async getHistory(id, page = 1, limit = 20) {
    validateObjectId(id, 'Order ID');
    if (page < 1) page = 1;
    if (limit < 1) limit = 20;
    if (limit > 100) limit = 100;
    return await Order.getHistoryWithPagination(id, page, limit);
  }

  static async getHistoryByAction(id, action) {
    validateObjectId(id, 'Order ID');
    if (!action) throw createError('Action requise', 400);

    const order = await Order.findById(id);
    if (!order) throw createError('Commande non trouvée', 404);

    return {
      orderNumber: order.orderNumber,
      action,
      count: order.getHistoryByAction(action).length,
      history: order.getHistoryByAction(action).sort((a, b) => b.date - a.date)
    };
  }

  static async getHistoryByUser(id, userId) {
    validateObjectId(id, 'Order ID');
    validateObjectId(userId, 'User ID');

    const order = await Order.findById(id);
    if (!order) throw createError('Commande non trouvée', 404);

    return {
      orderNumber: order.orderNumber,
      userId,
      history: order.getHistoryByUser(userId).sort((a, b) => b.date - a.date)
    };
  }

  // Modifier une entrée d'historique (commentaire / description)
  static async updateHistoryEntry(orderId, historyId, data, user) {
    assertRole(
      user,
      CONFIRMABLE_MODIFIABLE_BY,
      'Vous n\'avez pas le droit de modifier l\'historique'
    );

    validateObjectId(orderId, 'Order ID');
    if (!historyId) throw createError('Identifiant historique requis', 400);

    const order = await Order.findById(orderId);
    if (!order) throw createError('Commande non trouvée', 404);

    const entry = order.history.find(
      (h) => h.historyId === historyId || h._id?.toString() === historyId
    );
    if (!entry) throw createError('Entrée d\'historique introuvable', 404);

    const oldCommentaire = entry.commentaire || '';
    const oldDescription = entry.description || '';
    const changes = [];

    if (data.commentaire !== undefined && data.commentaire !== oldCommentaire) {
      entry.commentaire = String(data.commentaire).trim();
      changes.push({ field: 'commentaire', oldValue: oldCommentaire, newValue: entry.commentaire });
    }

    if (data.description !== undefined && data.description !== oldDescription) {
      entry.description = String(data.description).trim();
      changes.push({ field: 'description', oldValue: oldDescription, newValue: entry.description });
    }

    if (changes.length === 0) {
      throw createError('Aucune modification détectée sur l\'historique', 400);
    }

    if (!entry.details) entry.details = {};
    if (!entry.details.additionalInfo) entry.details.additionalInfo = {};
    entry.details.additionalInfo.lastEditedAt = new Date();
    entry.details.additionalInfo.lastEditedBy = {
      id: user._id,
      nom: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
      role: user.role
    };
    order.markModified('history');

    order.addHistory({
      action: 'MAJ_HISTORIQUE',
      user,
      description: `Mise à jour de l'historique (${entry.action})`,
      commentaire: data.editReason || `Modification de l'entrée ${entry.historyId}`,
      details: {
        corrections: changes,
        additionalInfo: { targetHistoryId: entry.historyId, targetAction: entry.action }
      }
    });

    await order.save();
    return order;
  }

  // Historique global de tous les bons de commande
  static async getGlobalHistory(filters = {}) {
    const page = Math.max(1, Number(filters.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(filters.limit) || 20));
    const skip = (page - 1) * limit;

    const match = {};
    if (filters.action) match['history.action'] = filters.action;
    if (filters.role) match['history.user.role'] = filters.role;
    if (filters.from || filters.to) {
      match['history.date'] = {};
      if (filters.from) match['history.date'].$gte = new Date(filters.from);
      if (filters.to) match['history.date'].$lte = new Date(filters.to);
    }

    const pipeline = [
      { $unwind: '$history' },
      ...(Object.keys(match).length ? [{ $match: match }] : []),
      { $sort: { 'history.date': -1 } },
      {
        $facet: {
          data: [
            { $skip: skip },
            { $limit: limit },
            {
              $project: {
                _id: 0,
                orderId: '$_id',
                orderNumber: 1,
                orderStatus: '$status',
                historyId: '$history.historyId',
                action: '$history.action',
                oldStatus: '$history.oldStatus',
                newStatus: '$history.newStatus',
                date: '$history.date',
                heure: '$history.heure',
                user: '$history.user',
                description: '$history.description',
                commentaire: '$history.commentaire',
                details: '$history.details',
                version: '$history.version'
              }
            }
          ],
          totalCount: [{ $count: 'count' }]
        }
      }
    ];

    const [result] = await Order.aggregate(pipeline);
    const total = result.totalCount[0]?.count || 0;

    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 0,
      history: result.data
    };
  }

  static async exportHistory(id) {
    validateObjectId(id, 'Order ID');

    const order = await Order.findById(id);
    if (!order) throw createError('Commande non trouvée', 404);

    if (!order.history || order.history.length === 0) {
      throw createError('Aucun historique disponible pour cette commande', 404);
    }

    const headers =
      'Date,Heure,Action,Utilisateur,Role,Ancien Statut,Nouveau Statut,Description,Commentaire\n';
    const rows = order.history
      .map((h) => {
        const userNom = h.user?.nom || 'Système';
        const role = h.user?.role || '';
        return [
          h.date ? h.date.toISOString().split('T')[0] : '',
          h.heure || '',
          h.action || '',
          `"${userNom}"`,
          role,
          h.oldStatus || '',
          h.newStatus || '',
          `"${(h.description || '').replace(/"/g, '""')}"`,
          `"${(h.commentaire || '').replace(/"/g, '""')}"`
        ].join(',');
      })
      .join('\n');

    return headers + rows;
  }

  static async expedite(id, user, commentaire = '') {
    validateObjectId(id, 'Order ID');

    const order = await Order.findById(id);
    if (!order) throw createError('Commande non trouvée', 404);

    if (order.status !== 'confirme') {
      throw createError('La commande doit être confirmée avant expédition', 400);
    }

    const oldStatus = order.status;
    order.addHistory({
      action: 'EXPEDITION',
      oldStatus,
      newStatus: order.status,
      user,
      description: 'Expédition de la commande',
      commentaire
    });

    await order.save();
    return order;
  }

  static async cancel(id, user, commentaire = '') {
    validateObjectId(id, 'Order ID');

    const order = await Order.findById(id);
    if (!order) throw createError('Commande non trouvée', 404);

    const orderNumber = order.orderNumber;
    await order.deleteOne();
    return { _id: id, deleted: true, orderNumber, commentaire: commentaire || '' };
  }

  /** Normalise les anciens statuts vers Attente Vérification / Confirmé */
  static async migrateStatusesToTwoStates() {
    await Order.updateMany(
      { status: { $in: ['en_correction'] } },
      { $set: { status: 'en_attente_verification' } }
    );
    await Order.updateMany(
      { status: { $in: ['partiellement_recu', 'recu'] } },
      { $set: { status: 'confirme' } }
    );
    // Anciennes commandes annulées : on les retire
    await Order.deleteMany({ status: 'annule' });
  }
}

module.exports = OrderService;
