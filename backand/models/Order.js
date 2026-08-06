const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  // ========== INFORMATIONS DE BASE ==========
  orderNumber: {
    type: String,
    required: true,
    unique: true
  },
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    required: true
  },
  
  // ========== PRODUITS ==========
  products: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true },
    receivedQuantity: { type: Number, default: 0 },
    remainingQuantity: { type: Number, default: 0 }
  }],
  
  totalAmount: { type: Number, required: true },
  
  // ========== STATUT ==========
  status: {
    type: String,
    enum: ['en_attente_verification', 'confirme'],
    default: 'en_attente_verification'
  },
  
  // ========== DATES ==========
  deliveryDate: Date,
  confirmedAt: Date,
  receivedDate: Date,
  
  // ========== UTILISATEURS ==========
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  confirmedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  receivedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
  // ========== CORRECTIONS ==========
  corrections: [{
    field: String,
    oldValue: mongoose.Schema.Types.Mixed,
    newValue: mongoose.Schema.Types.Mixed,
    modifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    modifiedAt: { type: Date, default: Date.now },
    reason: String
  }],
  
  // ==========================================
  // 📜 HISTORIQUE COMPLET DES CHANGEMENTS
  // ==========================================
  history: [{
    // ID unique de l'historique
    historyId: {
      type: String,
      required: true,
      default: () => `HIST-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`
    },
    
    // Type d'action
    action: {
      type: String,
      enum: [
        'CREATION',           // Création du bon de commande
        'MODIFICATION',       // Modification générale
        'CORRECTION',         // Correction apportée
        'VERIFICATION',       // Vérification
        'CONFIRMATION',       // Confirmation
        'RECEPTION',          // Réception
        'RECEPTION_PARTIELLE',// Réception partielle
        'EXPEDITION',         // Expédition
        'IMPRESSION',         // Impression PDF
        'ANNULATION',         // Annulation
        'CHANGEMENT_STATUT',  // Changement de statut
        'AJOUT_PRODUIT',      // Ajout d'un produit
        'SUPPRESSION_PRODUIT',// Suppression d'un produit
        'MODIFICATION_PRODUIT',// Modification d'un produit
        'MAJ_HISTORIQUE'       // Mise à jour d'une entrée d'historique
      ],
      required: true
    },
    
    // Statut avant et après
    oldStatus: String,
    newStatus: String,
    
    // Date et heure
    date: { type: Date, default: Date.now },
    heure: { type: String, required: true, default: () => new Date().toLocaleTimeString('fr-FR', { hour12: false }) },
    
    // Utilisateur
    user: {
      id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      nom: String,
      email: String,
      role: String
    },
    
    // Description
    description: String,
    commentaire: String,
    
    // Détails des changements
    details: {
      // Pour les modifications de produits
      productId: mongoose.Schema.Types.ObjectId,
      productName: String,
      oldQuantity: Number,
      newQuantity: Number,
      oldPrice: Number,
      newPrice: Number,
      
      // Pour les corrections
      corrections: [{
        field: String,
        oldValue: mongoose.Schema.Types.Mixed,
        newValue: mongoose.Schema.Types.Mixed
      }],
      
      // Pour la réception
      receivedProducts: [{
        productId: mongoose.Schema.Types.ObjectId,
        productName: String,
        quantity: Number
      }],
      
      // Autres détails
      additionalInfo: mongoose.Schema.Types.Mixed
    },
    
    // Version du document
    version: { type: Number, default: 1 }
  }],
  
  // ========== VERSIONING ==========
  version: { type: Number, default: 1 },
  
  // ========== PDF ==========
  pdfPath: String,
  printCount: { type: Number, default: 0 },
  lastPrintedAt: Date,
  
  // ========== NOTES ==========
  notes: String

}, { timestamps: true });

// ==========================================
// INDEX
// ==========================================
orderSchema.index({ status: 1 });
orderSchema.index({ 'history.date': -1 });
orderSchema.index({ 'history.user.id': 1 });

// ==========================================
// MÉTHODES
// ==========================================

// Ajouter une entrée dans l'historique
orderSchema.methods.addHistory = function({
  action,
  oldStatus = null,
  newStatus = null,
  user,
  description = '',
  commentaire = '',
  details = {},
  version = null
}) {
  const now = new Date();
  
  const historyEntry = {
    historyId: `HIST-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    action: action,
    oldStatus: oldStatus || this.status,
    newStatus: newStatus || this.status,
    date: now,
    heure: now.toLocaleTimeString('fr-FR', { hour12: false }),
    user: {
      id: user._id,
      nom: `${user.firstName} ${user.lastName}`,
      email: user.email,
      role: user.role
    },
    description: description,
    commentaire: commentaire,
    details: details,
    version: version || this.version
  };
  
  this.history.push(historyEntry);
  return historyEntry;
};

// Récupérer l'historique complet
orderSchema.methods.getFullHistory = function() {
  return this.history.sort((a, b) => b.date - a.date);
};

// Récupérer l'historique par action
orderSchema.methods.getHistoryByAction = function(action) {
  return this.history.filter(h => h.action === action);
};

// Récupérer l'historique par utilisateur
orderSchema.methods.getHistoryByUser = function(userId) {
  return this.history.filter(h => h.user.id.toString() === userId.toString());
};

// Récupérer l'historique par période
orderSchema.methods.getHistoryByDateRange = function(startDate, endDate) {
  return this.history.filter(h => {
    return h.date >= startDate && h.date <= endDate;
  });
};

// ==========================================
// STATIQUES
// ==========================================

// Récupérer l'historique complet d'une commande avec pagination
orderSchema.statics.getHistoryWithPagination = async function(orderId, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  
  const order = await this.findById(orderId)
    .select('orderNumber history')
    .populate('history.user.id', 'firstName lastName email role');
  
  if (!order) return null;
  
  const total = order.history.length;
  const history = order.history
    .sort((a, b) => b.date - a.date)
    .slice(skip, skip + limit);
  
  return {
    orderNumber: order.orderNumber,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    history
  };
};

// ==========================================
// EXPORT
// ==========================================
const Order = mongoose.model('Order', orderSchema);
module.exports = Order;