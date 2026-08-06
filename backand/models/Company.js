const mongoose = require('mongoose');

/**
 * Entité Société — informations de l'entreprise utilisatrice de l'application.
 * Ces données alimentent les bons de commande, PDF et documents officiels.
 */
const companySchema = new mongoose.Schema({
  // ========== IDENTITÉ ==========
  name: {
    type: String,
    required: [true, 'Le nom de la société est obligatoire'],
    trim: true
  },
  designation: {
    type: String,
    trim: true
  },
  legalForm: {
    type: String,
    trim: true,
    default: 'SARL'
  },

  // ========== IDENTIFIANTS LÉGAUX ==========
  matricule: {
    type: String,
    trim: true,
    uppercase: true
  },
  taxId: {
    type: String,
    trim: true,
    uppercase: true
  },
  registrationNumber: {
    type: String,
    trim: true
  },
  vatNumber: {
    type: String,
    trim: true,
    uppercase: true
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
    trim: true
  },
  phone2: {
    type: String,
    trim: true
  },
  fax: {
    type: String,
    trim: true
  },
  website: {
    type: String,
    trim: true
  },

  // ========== ADRESSE ==========
  address: {
    type: String,
    trim: true
  },
  addressComplement: {
    type: String,
    trim: true
  },
  city: {
    type: String,
    trim: true,
    default: 'Sousse'
  },
  postalCode: {
    type: String,
    trim: true
  },
  country: {
    type: String,
    trim: true,
    default: 'Tunisie'
  },

  // ========== LOGO & VISUEL ==========
  logo: {
    type: String,
    trim: true,
    default: ''
  },
  logoWidth: {
    type: Number,
    default: 110,
    min: 40,
    max: 300
  },
  logoHeight: {
    type: Number,
    default: 60,
    min: 30,
    max: 200
  },

  // ========== FINANCIER ==========
  currency: {
    type: String,
    trim: true,
    default: 'DT'
  },
  bankName: {
    type: String,
    trim: true
  },
  bankIban: {
    type: String,
    trim: true,
    uppercase: true
  },
  bankBic: {
    type: String,
    trim: true,
    uppercase: true
  },
  bankAccount: {
    type: String,
    trim: true
  },

  // ========== CONDITIONS PAR DÉFAUT (BC) ==========
  defaultPaymentTerms: {
    type: String,
    trim: true,
    default: '30 jours net'
  },
  defaultDeliveryTerms: {
    type: String,
    trim: true,
    default: 'Selon disponibilité'
  },
  defaultWarranty: {
    type: String,
    trim: true,
    default: 'Garantie fabricant'
  },
  defaultNotes: {
    type: String,
    trim: true,
    default: 'Merci de confirmer la réception de ce bon de commande.'
  },

  // ========== STATUT ==========
  isActive: {
    type: Boolean,
    default: true
  },
  isDefault: {
    type: Boolean,
    default: true
  },
  notes: {
    type: String,
    trim: true
  },

  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

companySchema.virtual('fullAddress').get(function () {
  return [
    this.address,
    this.addressComplement,
    this.postalCode,
    this.city,
    this.country
  ].filter(Boolean).join(', ');
});

companySchema.virtual('displayName').get(function () {
  return this.designation || this.name;
});

companySchema.index({ isDefault: 1 });
companySchema.index({ isActive: 1 });
companySchema.index({ name: 1 });

// Une seule société par défaut
companySchema.pre('save', async function (next) {
  if (this.isDefault && this.isModified('isDefault')) {
    await this.constructor.updateMany(
      { _id: { $ne: this._id }, isDefault: true },
      { $set: { isDefault: false } }
    );
  }
  next();
});

// Format prêt pour le PDF / PrintSettings
companySchema.methods.toPrintCompany = function () {
  return {
    name: this.name,
    designation: this.designation,
    address: this.address,
    addressComplement: this.addressComplement,
    city: this.city,
    postalCode: this.postalCode,
    country: this.country,
    phone: this.phone1 || this.phone2 || '',
    phoneSecondary: this.phone2 || '',
    email: this.email || '',
    website: this.website || '',
    taxId: this.taxId || this.matricule || this.vatNumber || '',
    matricule: this.matricule || '',
    registrationNumber: this.registrationNumber || '',
    logo: this.logo || '',
    logoWidth: this.logoWidth || 110,
    logoHeight: this.logoHeight || 60,
    currency: this.currency || 'DT',
    bankName: this.bankName || '',
    bankIban: this.bankIban || '',
    bankBic: this.bankBic || ''
  };
};

companySchema.methods.toDefaultTerms = function () {
  return {
    payment: this.defaultPaymentTerms,
    delivery: this.defaultDeliveryTerms,
    warranty: this.defaultWarranty,
    notes: this.defaultNotes
  };
};

companySchema.statics.getActive = async function () {
  let company = await this.findOne({ isDefault: true, isActive: true });
  if (!company) {
    company = await this.findOne({ isActive: true }).sort({ updatedAt: -1 });
  }
  return company;
};

companySchema.statics.getOrCreateDefault = async function () {
  let company = await this.getActive();
  if (!company) {
    company = await this.create({
      name: '2SBI',
      designation: '2SBI',
      address: 'Hergla',
      city: 'Sousse',
      country: 'Tunisie',
      currency: 'DT',
      isDefault: true,
      isActive: true
    });
  }
  return company;
};

const Company = mongoose.model('Company', companySchema);
module.exports = Company;
