const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
 
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
  

  products: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true },
    receivedQuantity: { type: Number, default: 0 },
    remainingQuantity: { type: Number, default: 0 }
  }],
  
  totalAmount: { type: Number, required: true },
  

  status: {
    type: String,
    enum: ['en_attente_verification', 'confirme'],
    default: 'en_attente_verification'
  },
  

  deliveryDate: Date,
  confirmedAt: Date,
  receivedDate: Date,
  

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  confirmedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  receivedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
  corrections: [{
    field: String,
    oldValue: mongoose.Schema.Types.Mixed,
    newValue: mongoose.Schema.Types.Mixed,
    modifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    modifiedAt: { type: Date, default: Date.now },
    reason: String
  }],
  

  history: [{
  
    historyId: {
      type: String,
      required: true,
      default: () => `HIST-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`
    },
    
    
    action: {
      type: String,
      enum: [
        'CREATION',        
        'MODIFICATION',       
        'CORRECTION',         
        'VERIFICATION',       
        'CONFIRMATION',       
        'RECEPTION',          
        'RECEPTION_PARTIELLE',
        'EXPEDITION',         
        'IMPRESSION',         
        'ANNULATION',         
        'CHANGEMENT_STATUT', 
        'AJOUT_PRODUIT',    
        'SUPPRESSION_PRODUIT',
        'MODIFICATION_PRODUIT',
        'MAJ_HISTORIQUE'      
      ],
      required: true
    },
    
    
    oldStatus: String,
    newStatus: String,
    
 
    date: { type: Date, default: Date.now },
    heure: { type: String, required: true, default: () => new Date().toLocaleTimeString('fr-FR', { hour12: false }) },
    

    user: {
      id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      nom: String,
      email: String,
      role: String
    },
    
   
    description: String,
    commentaire: String,
   
    details: {
      
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
      
  
      receivedProducts: [{
        productId: mongoose.Schema.Types.ObjectId,
        productName: String,
        quantity: Number
      }],
      
     
      additionalInfo: mongoose.Schema.Types.Mixed
    },
   
    version: { type: Number, default: 1 }
  }],
  
  version: { type: Number, default: 1 },
 
  pdfPath: String,
  printCount: { type: Number, default: 0 },
  lastPrintedAt: Date,
  
  notes: String

}, { timestamps: true });


orderSchema.index({ status: 1 });
orderSchema.index({ 'history.date': -1 });
orderSchema.index({ 'history.user.id': 1 });




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


orderSchema.methods.getHistoryByAction = function(action) {
  return this.history.filter(h => h.action === action);
};


orderSchema.methods.getHistoryByUser = function(userId) {
  return this.history.filter(h => h.user.id.toString() === userId.toString());
};


orderSchema.methods.getHistoryByDateRange = function(startDate, endDate) {
  return this.history.filter(h => {
    return h.date >= startDate && h.date <= endDate;
  });
};


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

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;
