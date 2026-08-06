const mongoose = require('mongoose');

// ========================================
// 1. SOUS-SCHEMAS (ORGANISÉS)
// ========================================

// 1.1 INFORMATIONS DE L'ENTREPRISE
const CompanyInfoSchema = new mongoose.Schema({
  name: { 
    type: String, 
    default: '2SBI',
    trim: true,
    required: [true, 'Le nom de l\'entreprise est requis']
  },
  address: { 
    type: String, 
    default: 'Hergla-sousse',
    trim: true
  },
  addressComplement: { 
    type: String, 
    default: '',
    trim: true
  },
  city: { 
    type: String, 
    default: 'Sousse',
    trim: true
  },
  country: { 
    type: String, 
    default: 'Tunisie',
    trim: true
  },
  postalCode: { 
    type: String, 
    default: '',
    trim: true
  },
  phone: { 
    type: String, 
    default: '',
    trim: true
  },
  phoneSecondary: { 
    type: String, 
    default: '',
    trim: true
  },
  email: { 
    type: String, 
    default: '',
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Email invalide']
  },
  website: { 
    type: String, 
    default: '',
    trim: true
  },
  taxId: { 
    type: String, 
    default: '',
    trim: true,
    uppercase: true
  },
  registrationNumber: { 
    type: String, 
    default: '',
    trim: true
  },
  logo: { 
    type: String, 
    default: '',
    validate: {
      validator: function(v) {
        if (!v) return true;
        return (
          v.startsWith('data:image') ||
          v.startsWith('http://') ||
          v.startsWith('https://') ||
          v.startsWith('/uploads/') ||
          v.startsWith('/assets/') ||
          v.startsWith('uploads/') ||
          v.startsWith('assets/') ||
          /\.(png|jpe?g|gif|webp|svg)$/i.test(v)
        );
      },
      message: 'Logo invalide (URL, base64, /uploads/... ou fichier image)'
    }
  },
  logoWidth: { 
    type: Number, 
    default: 120,
    min: 40,
    max: 300
  },
  logoHeight: {
    type: Number,
    default: 70,
    min: 30,
    max: 200
  },
  currency: {
    type: String,
    default: 'DT',
    trim: true
  },
  website: {
    type: String,
    default: '',
    trim: true
  },
  signature: { 
    type: String, 
    default: '',
    validate: {
      validator: function(v) {
        return v === '' || v.startsWith('data:image') || v.startsWith('/uploads/');
      },
      message: 'Signature doit être une image base64 ou un chemin uploads'
    }
  },
  stamp: { 
    type: String, 
    default: '',
    validate: {
      validator: function(v) {
        return v === '' || v.startsWith('data:image') || v.startsWith('/uploads/');
      },
      message: 'Cachet doit être une image base64 ou un chemin uploads'
    }
  }
}, { _id: false });

// 1.2 PARAMÈTRES D'IMPRESSION
const PrintOptionsSchema = new mongoose.Schema({
  // Format
  paperSize: { 
    type: String, 
    enum: ['A4', 'A5', 'Letter', 'Legal', 'A3', 'Executive'],
    default: 'A4'
  },
  orientation: { 
    type: String, 
    enum: ['portrait', 'landscape'],
    default: 'portrait'
  },
  
  // Typographie
  fontFamily: { 
    type: String, 
    enum: ['Arial', 'Helvetica', 'Times New Roman', 'Courier', 'Georgia', 'Verdana', 'Inter', 'Roboto'],
    default: 'Inter'
  },
  fontSize: { 
    type: Number, 
    default: 10,
    min: 6,
    max: 20
  },
  fontSizeTitle: { 
    type: Number, 
    default: 16,
    min: 10,
    max: 28
  },
  fontSizeHeader: { 
    type: Number, 
    default: 12,
    min: 8,
    max: 18
  },
  fontSizeFooter: { 
    type: Number, 
    default: 8,
    min: 6,
    max: 12
  },
  
  // Couleurs
  primaryColor: { 
    type: String, 
    default: '#1a237e',
    match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Couleur hexadécimale invalide']
  },
  secondaryColor: { 
    type: String, 
    default: '#0d47a1',
    match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Couleur hexadécimale invalide']
  },
  accentColor: { 
    type: String, 
    default: '#e53935',
    match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Couleur hexadécimale invalide']
  },
  textColor: {
    type: String,
    default: '#1a1a2e',
    match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Couleur hexadécimale invalide']
  },
  
  // Affichage
  showLogo: { 
    type: Boolean, 
    default: true 
  },
  showHeader: { 
    type: Boolean, 
    default: true 
  },
  showFooter: { 
    type: Boolean, 
    default: true 
  },
  showSignature: { 
    type: Boolean, 
    default: true 
  },
  showStamp: { 
    type: Boolean, 
    default: false 
  },
  showBorders: { 
    type: Boolean, 
    default: true 
  },
  showTableBorders: { 
    type: Boolean, 
    default: true 
  },
  showPageNumbers: { 
    type: Boolean, 
    default: true 
  },
  showWatermark: { 
    type: Boolean, 
    default: false 
  },
  showTableStripes: {
    type: Boolean,
    default: true
  },
  
  // Copies et langue
  copyCount: { 
    type: Number, 
    default: 2,
    min: 1,
    max: 10
  },
  language: { 
    type: String, 
    enum: ['fr', 'en', 'ar', 'de', 'es', 'it'],
    default: 'fr'
  },
  
  // Qualité
  quality: { 
    type: String, 
    enum: ['draft', 'normal', 'high', 'best'],
    default: 'high'
  },
  
  // Compression
  compress: { 
    type: Boolean, 
    default: true 
  },
  
  // Protection
  password: { 
    type: String, 
    default: '',
    minlength: 0,
    maxlength: 20
  },
  
  // Permissions
  permissions: {
    printing: { type: Boolean, default: true },
    copying: { type: Boolean, default: true },
    modifying: { type: Boolean, default: false }
  }
}, { _id: false });

// 1.3 MISE EN PAGE
const LayoutSchema = new mongoose.Schema({
  margins: {
    top: { 
      type: Number, 
      default: 100,
      min: 20,
      max: 300
    },
    bottom: { 
      type: Number, 
      default: 100,
      min: 20,
      max: 300
    },
    left: { 
      type: Number, 
      default: 100,
      min: 20,
      max: 300
    },
    right: { 
      type: Number, 
      default: 100,
      min: 20,
      max: 300
    }
  },
  spacing: {
    lineHeight: { 
      type: Number, 
      default: 1.6,
      min: 1,
      max: 3
    },
    paragraphSpacing: { 
      type: Number, 
      default: 10,
      min: 0,
      max: 50
    },
    tableCellPadding: { 
      type: Number, 
      default: 8,
      min: 0,
      max: 20
    },
    columnGap: {
      type: Number,
      default: 20,
      min: 0,
      max: 50
    }
  },
  header: {
    height: { 
      type: Number, 
      default: 150,
      min: 50,
      max: 300
    },
    showSeparator: { 
      type: Boolean, 
      default: true 
    },
    separatorColor: {
      type: String,
      default: '#1a237e',
      match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Couleur hexadécimale invalide']
    },
    separatorWidth: {
      type: Number,
      default: 3,
      min: 1,
      max: 10
    }
  },
  footer: {
    height: { 
      type: Number, 
      default: 80,
      min: 30,
      max: 200
    },
    showSeparator: { 
      type: Boolean, 
      default: true 
    },
    separatorColor: {
      type: String,
      default: '#e0e0e0',
      match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Couleur hexadécimale invalide']
    },
    separatorWidth: {
      type: Number,
      default: 1,
      min: 1,
      max: 5
    }
  },
  watermark: {
    text: { 
      type: String, 
      default: 'EXEMPLAIRE',
      trim: true
    },
    opacity: { 
      type: Number, 
      default: 0.1,
      min: 0.05,
      max: 0.5
    },
    angle: { 
      type: Number, 
      default: 45,
      min: 0,
      max: 90
    },
    fontSize: { 
      type: Number, 
      default: 60,
      min: 20,
      max: 100
    },
    color: { 
      type: String, 
      default: '#000000',
      match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Couleur hexadécimale invalide']
    },
    position: {
      type: String,
      enum: ['center', 'top-left', 'top-right', 'bottom-left', 'bottom-right'],
      default: 'center'
    }
  }
}, { _id: false });

// 1.4 TEXTES PERSONNALISÉS
const CustomTextsSchema = new mongoose.Schema({
  documentTitle: {
    type: String,
    default: 'BON DE COMMANDE',
    trim: true,
    uppercase: true
  },
  documentSubtitle: {
    type: String,
    default: 'Purchase Order',
    trim: true
  },
  tableHeaders: {
    reference: { type: String, default: 'Réf.', trim: true },
    description: { type: String, default: 'Désignation', trim: true },
    quantity: { type: String, default: 'Qté', trim: true },
    unitPrice: { type: String, default: 'P.U. HT', trim: true },
    total: { type: String, default: 'Total HT', trim: true },
    vat: { type: String, default: 'TVA', trim: true },
    totalVat: { type: String, default: 'Total TTC', trim: true },
    subtotal: { type: String, default: 'Sous-total', trim: true },
    discount: { type: String, default: 'Remise', trim: true }
  },
  labels: {
    orderNumber: { type: String, default: 'N° Commande', trim: true },
    date: { type: String, default: 'Date', trim: true },
    deliveryDate: { type: String, default: 'Livraison prévue', trim: true },
    status: { type: String, default: 'Statut', trim: true },
    company: { type: String, default: 'Société', trim: true },
    supplier: { type: String, default: 'Fournisseur', trim: true },
    amountInWords: { type: String, default: 'Arrêté à la somme de', trim: true }
  },
  footerTexts: {
    thankYou: { 
      type: String, 
      default: 'Nous vous remercions de votre confiance.',
      trim: true 
    },
    signatureLabel: { 
      type: String, 
      default: 'Signature du client',
      trim: true 
    },
    signatureCompanyLabel: { 
      type: String, 
      default: 'Signature du fournisseur',
      trim: true 
    },
    generatedOn: {
      type: String,
      default: 'Généré le',
      trim: true
    }
  }
}, { _id: false });

// 1.5 CONDITIONS GÉNÉRALES
const TermsSchema = new mongoose.Schema({
  payment: { 
    type: String, 
    default: '30 jours net',
    trim: true
  },
  paymentDetails: { 
    type: String, 
    default: 'Virement bancaire',
    trim: true
  },
  paymentOptions: [{
    type: String,
    enum: ['Virement bancaire', 'Chèque', 'Espèces', 'Carte bancaire', 'PayPal', 'Autre'],
    default: 'Virement bancaire'
  }],
  delivery: { 
    type: String, 
    default: 'Livraison sous 48h',
    trim: true
  },
  deliveryAddress: { 
    type: String, 
    default: '',
    trim: true
  },
  deliveryMethod: {
    type: String,
    enum: ['Transporteur', 'Colissimo', 'Chronopost', 'DHL', 'UPS', 'FedEx', 'Autre'],
    default: 'Transporteur'
  },
  warranty: { 
    type: String, 
    default: 'Garantie 1 an pièces et main-d\'œuvre',
    trim: true
  },
  returnPolicy: { 
    type: String, 
    default: 'Retour sous 14 jours',
    trim: true
  },
  latePaymentPenalty: { 
    type: String, 
    default: 'Pénalités de retard: 1% par mois',
    trim: true
  },
  disputeResolution: { 
    type: String, 
    default: 'Litiges soumis au tribunal de Sousse',
    trim: true
  },
  notes: { 
    type: String, 
    default: '',
    trim: true,
    maxlength: 1000
  },
  customTerms: [{
    label: { type: String, trim: true },
    text: { type: String, trim: true }
  }],
  showOnDocument: {
    type: Boolean,
    default: true
  }
}, { _id: false });

// ========================================
// 2. SCHÉMA PRINCIPAL
// ========================================
const printSettingsSchema = new mongoose.Schema({
  // Informations de l'entreprise
  company: {
    type: CompanyInfoSchema,
    default: () => ({})
  },

  // Paramètres d'impression
  printOptions: {
    type: PrintOptionsSchema,
    default: () => ({})
  },

  // Mise en page
  layout: {
    type: LayoutSchema,
    default: () => ({})
  },

  // Textes personnalisés
  customTexts: {
    type: CustomTextsSchema,
    default: () => ({})
  },

  // Conditions générales
  defaultTerms: {
    type: TermsSchema,
    default: () => ({})
  },

  // Métadonnées
  metadata: {
    createdBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User' 
    },
    updatedBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User' 
    },
    isActive: { 
      type: Boolean, 
      default: true 
    },
    isDefault: { 
      type: Boolean, 
      default: false 
    },
    version: { 
      type: Number, 
      default: 1,
      min: 1
    },
    tags: [{
      type: String,
      trim: true,
      lowercase: true
    }]
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ========================================
// 3. INDEXES
// ========================================
printSettingsSchema.index({ 'company.name': 1 });
printSettingsSchema.index({ 'metadata.isDefault': 1 });
printSettingsSchema.index({ 'metadata.isActive': 1 });
printSettingsSchema.index({ createdAt: -1 });
printSettingsSchema.index({ updatedAt: -1 });
printSettingsSchema.index({ 'metadata.tags': 1 });
printSettingsSchema.index({ 'printOptions.language': 1 });

// ========================================
// 4. VIRTUAL PROPERTIES
// ========================================
printSettingsSchema.virtual('fullAddress').get(function() {
  const parts = [];
  if (this.company.address) parts.push(this.company.address);
  if (this.company.addressComplement) parts.push(this.company.addressComplement);
  if (this.company.postalCode) parts.push(this.company.postalCode);
  if (this.company.city) parts.push(this.company.city);
  if (this.company.country) parts.push(this.company.country);
  return parts.join(', ');
});

printSettingsSchema.virtual('fullName').get(function() {
  return `${this.company.name} - ${this.company.city || ''}`.trim();
});

printSettingsSchema.virtual('isProtected').get(function() {
  return this.printOptions.password && this.printOptions.password.length > 0;
});

printSettingsSchema.virtual('displayName').get(function() {
  return `${this.company.name} - ${this.printOptions.paperSize} (v${this.metadata.version})`;
});

printSettingsSchema.virtual('hasLogo').get(function() {
  return this.company.logo && this.company.logo.length > 0;
});

// ========================================
// 5. MÉTHODES D'INSTANCE
// ========================================
printSettingsSchema.methods = {
  // Cloner les paramètres
  clone() {
    const cloneData = this.toObject();
    delete cloneData._id;
    delete cloneData.createdAt;
    delete cloneData.updatedAt;
    delete cloneData.__v;
    cloneData.metadata = {
      ...cloneData.metadata,
      version: this.metadata.version + 1,
      isDefault: false,
      isActive: true
    };
    return cloneData;
  },

  // Vérifier si les paramètres sont valides
  validateSettings() {
    const errors = [];
    
    // Vérifier les marges
    const margins = this.layout.margins;
    if (margins.top + margins.bottom > 800) {
      errors.push('Les marges verticales sont trop grandes');
    }
    if (margins.left + margins.right > 600) {
      errors.push('Les marges horizontales sont trop grandes');
    }
    
    // Vérifier le logo
    if (this.printOptions.showLogo && !this.company.logo) {
      errors.push('Le logo est activé mais absent');
    }
    
    // Vérifier les couleurs
    const colorFields = ['primaryColor', 'secondaryColor', 'accentColor', 'textColor'];
    for (const field of colorFields) {
      const value = this.printOptions[field];
      if (value && !/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(value)) {
        errors.push(`Couleur invalide: ${field}`);
      }
    }
    
    return errors;
  },

  // Générer un résumé pour le PDF
  toPdfSummary() {
    return {
      company: {
        name: this.company.name,
        address: this.fullAddress,
        phone: this.company.phone,
        email: this.company.email,
        logo: this.company.logo,
        taxId: this.company.taxId
      },
      printOptions: {
        paperSize: this.printOptions.paperSize,
        orientation: this.printOptions.orientation,
        fontFamily: this.printOptions.fontFamily,
        language: this.printOptions.language,
        quality: this.printOptions.quality
      },
      layout: {
        margins: this.layout.margins,
        watermark: this.layout.watermark
      },
      hasLogo: this.hasLogo,
      isProtected: this.isProtected,
      version: this.metadata.version
    };
  },

  // Obtenir les paramètres pour le rendu HTML
  toRenderConfig() {
    return {
      company: this.company.toObject(),
      printOptions: this.printOptions.toObject(),
      layout: this.layout.toObject(),
      customTexts: this.customTexts.toObject(),
      defaultTerms: this.defaultTerms.toObject()
    };
  }
};

// ========================================
// 6. STATIC METHODS
// ========================================
printSettingsSchema.statics = {
  // Récupérer les paramètres par défaut
  async getDefault() {
    let settings = await this.findOne({ 'metadata.isDefault': true });
    if (!settings) {
      settings = await this.create({
        metadata: { isDefault: true, isActive: true }
      });
    }
    return settings;
  },

  // Récupérer les paramètres actifs
  async getActive() {
    return this.find({ 'metadata.isActive': true }).sort({ createdAt: -1 });
  },

  // Changer les paramètres par défaut
  async setDefault(id) {
    await this.updateMany(
      { 'metadata.isDefault': true },
      { 'metadata.isDefault': false }
    );
    return this.findByIdAndUpdate(
      id,
      { 'metadata.isDefault': true },
      { new: true }
    );
  },

  // Recherche par tags
  async findByTag(tag) {
    return this.find({ 'metadata.tags': tag });
  },

  // Recherche par entreprise
  async findByCompany(companyName) {
    return this.find({ 
      'company.name': { $regex: companyName, $options: 'i' } 
    });
  },

  // Obtenir la dernière version
  async getLatestVersion() {
    return this.findOne().sort({ 'metadata.version': -1 });
  }
};

// ========================================
// 7. MIDDLEWARE (PRE/SAVE)
// ========================================
printSettingsSchema.pre('save', async function(next) {
  // S'assurer qu'il n'y a qu'un seul paramètre par défaut
  if (this.metadata.isDefault) {
    await this.constructor.updateMany(
      { 
        _id: { $ne: this._id },
        'metadata.isDefault': true 
      },
      { 'metadata.isDefault': false }
    );
  }
  
  // Incrémenter la version si ce n'est pas un nouveau document
  if (!this.isNew) {
    this.metadata.version = (this.metadata.version || 0) + 1;
  }
  
  // Valider le logo
  if (this.printOptions.showLogo && !this.company.logo) {
    this.printOptions.showLogo = false;
  }
  
  next();
});

// ========================================
// 8. MODEL
// ========================================
const PrintSettings = mongoose.model('PrintSettings', printSettingsSchema);

// ========================================
// 9. EXPORT
// ========================================
module.exports = PrintSettings;