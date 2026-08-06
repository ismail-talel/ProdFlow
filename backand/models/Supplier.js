const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
  // ========== IDENTIFICATION ==========
  reference: {
    type: String,
    unique: true,
    uppercase: true,
    trim: true
  },
  // Conservé pour compatibilité avec les anciennes données
  code: {
    type: String,
    uppercase: true,
    trim: true
  },
  designation: {
    type: String,
    required: [true, 'La désignation du fournisseur est obligatoire'],
    trim: true,
    minlength: [2, 'La désignation doit contenir au moins 2 caractères']
  },
  name: {
    type: String,
    trim: true,
    minlength: [2, 'Le nom doit contenir au moins 2 caractères']
  },
  matricule: {
    type: String,
    trim: true,
    uppercase: true
  },

  // ========== LOCALISATION ==========
  country: {
    type: String,
    trim: true,
    default: 'Tunisie'
  },
  type: {
    type: String,
    enum: {
      values: ['local', 'etranger'],
      message: 'Type invalide (local / etranger)'
    },
    default: 'local'
  },

  // ========== CONTACT ==========
  email: {
    type: String,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Email invalide']
  },
  phone1: {
    type: String,
    required: [true, 'Le téléphone 1 est obligatoire'],
    trim: true
  },
  phone2: {
    type: String,
    trim: true
  },
  // Conservé pour compatibilité
  phone: {
    type: String,
    trim: true
  },

  // ========== ADRESSE ==========
  address: {
    type: mongoose.Schema.Types.Mixed
  },

  // ========== PAIEMENT & LIVRAISON ==========
  paymentType: {
    type: String,
    trim: true,
    default: 'virement'
  },
  deliveryType: {
    type: String,
    trim: true
  },

  // ========== LOGO ==========
  companyLogo: {
    type: String,
    trim: true
  },

  // ========== STATUT ==========
  isActive: {
    type: Boolean,
    default: true
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform(_doc, ret) {
      ret.mobile = ret.phone2 || ret.mobile || '';
      ret.description = ret.notes || ret.description || '';
      return ret;
    }
  },
  toObject: { virtuals: true }
});

supplierSchema.index({ designation: 1 });
supplierSchema.index({ name: 1 });
supplierSchema.index({ email: 1 });
supplierSchema.index({ phone1: 1 });
supplierSchema.index({ type: 1 });
supplierSchema.index({ country: 1 });
supplierSchema.index({ isActive: 1 });

supplierSchema.pre('validate', function (next) {
  if (!this.designation && this.name) {
    this.designation = this.name;
  }
  if (!this.name && this.designation) {
    this.name = this.designation;
  }

  if (!this.reference && this.code) {
    this.reference = this.code;
  }
  if (!this.code && this.reference) {
    this.code = this.reference;
  }

  if (!this.phone1 && this.phone) {
    this.phone1 = this.phone;
  }
  if (!this.phone && this.phone1) {
    this.phone = this.phone1;
  }

  next();
});

supplierSchema.pre('save', function (next) {
  if (!this.reference) {
    const source = this.designation || this.name || 'FOU';
    const prefix = source.substring(0, 3).toUpperCase();
    const random = Math.floor(Math.random() * 1000);
    this.reference = `${prefix}${String(random).padStart(3, '0')}`;
  }

  this.code = this.reference;
  if (this.designation) this.name = this.name || this.designation;
  if (this.phone1) this.phone = this.phone1;

  next();
});

supplierSchema.virtual('status').get(function () {
  return this.isActive ? 'Actif' : 'Inactif';
});

supplierSchema.virtual('productCount', {
  ref: 'Product',
  localField: '_id',
  foreignField: 'supplier',
  count: true
});

const Supplier = mongoose.model('Supplier', supplierSchema);
module.exports = Supplier;
