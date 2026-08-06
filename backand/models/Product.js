const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  // ========== IDENTIFICATION ==========
  reference: {
    type: String,
    required: [true, 'La référence produit est obligatoire'],
    unique: true,
    uppercase: true,
    trim: true
  },
  barcode: {
    type: String,
    trim: true,
    sparse: true,
    unique: true
  },
  designation: {
    type: String,
    required: [true, 'La désignation produit est obligatoire'],
    trim: true
  },
  // Conservé pour compatibilité avec les anciennes données
  name: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },

  // ========== FOURNISSEUR ==========
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier'
  },
  supplierReference: {
    type: String,
    trim: true,
    uppercase: true
  },

  // ========== PRIX & TAXES ==========
  unitOfMeasure: {
    type: String,
    trim: true,
    default: 'unité'
  },
  priceHT: {
    type: Number,
    required: [true, 'Le prix HT est obligatoire'],
    min: [0, 'Le prix HT doit être positif']
  },
  // Conservé pour compatibilité avec les anciennes données / commandes
  unitPrice: {
    type: Number,
    min: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: [0, 'La remise ne peut pas être négative'],
    max: [100, 'La remise ne peut pas dépasser 100%']
  },
  tva: {
    type: Number,
    default: 19,
    min: [0, 'La TVA ne peut pas être négative']
  },
  priceInCurrency: {
    type: Number,
    min: 0,
    default: 0
  },
  margin: {
    type: Number,
    default: 0,
    min: 0
  },

  // ========== IMAGE ==========
  image: {
    type: String,
    trim: true
  },

  // ========== DIMENSIONS ==========
  width: { type: Number, min: 0 },
  length: { type: Number, min: 0 },
  height: { type: Number, min: 0 },
  radius: { type: Number, min: 0 },
  diameter: { type: Number, min: 0 },
  weight: { type: Number, min: 0 },

  // ========== CARACTÉRISTIQUES ==========
  color: {
    type: String,
    trim: true
  },
  materials: {
    type: String,
    trim: true
  },
  compositionType: {
    type: String,
    enum: {
      values: ['compose', 'non_compose'],
      message: 'Type de composition invalide (compose / non_compose)'
    },
    default: 'non_compose'
  },
  originType: {
    type: String,
    enum: {
      values: ['importe', 'local'],
      message: 'Type d\'origine invalide (importe / local)'
    },
    default: 'local'
  },

  // ========== STOCK & CATÉGORIE ==========
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  },
  quantity: {
    type: Number,
    default: 0,
    min: 0
  },
  minThreshold: {
    type: Number,
    default: 10,
    min: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform(_doc, ret) {
      ret.name = ret.name || ret.designation || '';
      ret.designation = ret.designation || ret.name || '';
      ret.unitPrice = ret.unitPrice ?? ret.priceHT ?? 0;
      ret.priceHT = ret.priceHT ?? ret.unitPrice ?? 0;
      ret.description = ret.description || '';
      return ret;
    }
  },
  toObject: { virtuals: true }
});

productSchema.virtual('priceTTC').get(function () {
  const ht = Number(this.priceHT ?? this.unitPrice) || 0;
  const discount = Number(this.discount) || 0;
  const tva = Number(this.tva) || 0;
  const afterDiscount = ht * (1 - discount / 100);
  return Math.round(afterDiscount * (1 + tva / 100) * 100) / 100;
});

productSchema.index({ designation: 1 });
productSchema.index({ name: 1 });
productSchema.index({ supplier: 1 });
productSchema.index({ compositionType: 1 });
productSchema.index({ originType: 1 });
productSchema.index({ isActive: 1 });

productSchema.pre('validate', function (next) {
  if (!this.designation && this.name) {
    this.designation = this.name;
  }
  if (!this.name && this.designation) {
    this.name = this.designation;
  }

  if ((this.priceHT === undefined || this.priceHT === null) && this.unitPrice != null) {
    this.priceHT = this.unitPrice;
  }
  if ((this.unitPrice === undefined || this.unitPrice === null) && this.priceHT != null) {
    this.unitPrice = this.priceHT;
  }

  if (this.barcode === '') {
    this.barcode = undefined;
  }
  next();
});

productSchema.pre('save', function (next) {
  if (this.designation) this.name = this.designation;
  if (this.priceHT != null) this.unitPrice = this.priceHT;
  next();
});

const Product = mongoose.model('Product', productSchema);
module.exports = Product;
