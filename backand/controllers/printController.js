const fs = require('fs');
const path = require('path');
const multer = require('multer');
const PDFService = require('../services/pdfService');
const PrintSettings = require('../models/PrintSettings');
const { Order } = require('../models');

const logoDir = path.join(__dirname, '../uploads/logo');
if (!fs.existsSync(logoDir)) {
  fs.mkdirSync(logoDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, logoDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.png';
    cb(null, `company-logo${ext}`);
  }
});

const uploadLogo = multer({
  storage,
  limits: { fileSize: 3 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!/^image\/(png|jpe?g|gif|webp)$/i.test(file.mimetype)) {
      return cb(new Error('Format logo invalide (PNG, JPG, GIF, WEBP)'));
    }
    cb(null, true);
  }
}).single('logo');

exports.uploadLogoMiddleware = (req, res, next) => {
  uploadLogo(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
};

exports.getSettings = async (req, res, next) => {
  try {
    const settings = await PDFService.getPrintSettings();
    res.json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
};

exports.updateSettings = async (req, res, next) => {
  try {
    let settings = await PrintSettings.findOne();

    if (!settings) {
      settings = new PrintSettings(req.body);
    } else {
      if (req.body.company) {
        settings.company = { ...settings.company.toObject?.() || settings.company, ...req.body.company };
      }
      if (req.body.printOptions) {
        settings.printOptions = {
          ...settings.printOptions.toObject?.() || settings.printOptions,
          ...req.body.printOptions
        };
      }
      if (req.body.defaultTerms) {
        settings.defaultTerms = {
          ...settings.defaultTerms.toObject?.() || settings.defaultTerms,
          ...req.body.defaultTerms
        };
      }
      if (req.body.layout) {
        settings.layout = { ...settings.layout.toObject?.() || settings.layout, ...req.body.layout };
      }
      if (req.body.customTexts) {
        settings.customTexts = {
          ...settings.customTexts.toObject?.() || settings.customTexts,
          ...req.body.customTexts
        };
      }
    }

    settings.updatedBy = req.user._id;
    if (settings.metadata) {
      settings.metadata.updatedBy = req.user._id;
    }
    await settings.save();

    res.json({
      success: true,
      message: "Paramètres d'impression mis à jour",
      data: settings
    });
  } catch (error) {
    next(error);
  }
};

exports.uploadCompanyLogo = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Fichier logo requis (champ: logo)'
      });
    }

    const logoPath = `/uploads/logo/${req.file.filename}`;
    let settings = await PrintSettings.findOne();

    if (!settings) {
      settings = await PDFService.getPrintSettings();
    }

    settings.company.logo = logoPath;
    if (req.body.logoWidth) settings.company.logoWidth = Number(req.body.logoWidth);
    if (req.body.logoHeight) settings.company.logoHeight = Number(req.body.logoHeight);
    settings.updatedBy = req.user._id;
    await settings.save();

    // Synchroniser aussi l'entité Société
    try {
      const CompanyService = require('../services/companyService');
      await CompanyService.setActiveLogo(
        logoPath,
        {
          logoWidth: req.body.logoWidth,
          logoHeight: req.body.logoHeight
        },
        req.user
      );
    } catch (_) {
      /* ignore sync errors */
    }

    res.json({
      success: true,
      message: 'Logo société téléversé avec succès',
      data: {
        logo: logoPath,
        logoUrl: logoPath,
        settings
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.printOrder = async (req, res, next) => {
  try {
    const options = {
      ...(req.body?.options || {}),
      paperSize: req.query.paperSize || req.body?.options?.paperSize,
      orientation: req.query.orientation || req.body?.options?.orientation,
      fontFamily: req.query.fontFamily || req.body?.options?.fontFamily,
      fontSize: req.query.fontSize ? Number(req.query.fontSize) : req.body?.options?.fontSize,
      copyCount: req.query.copyCount ? Number(req.query.copyCount) : req.body?.options?.copyCount
    };

    const result = await PDFService.generateOrderPDF(req.params.id, options);

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Commande non trouvée' });
    }

    order.pdfPath = result.filePath;
    order.printCount = (order.printCount || 0) + 1;
    order.lastPrintedAt = new Date();

    order.addHistory({
      action: 'IMPRESSION',
      user: req.user,
      description: 'Impression du bon de commande professionnel',
      details: {
        additionalInfo: {
          copyCount: options.copyCount || 1,
          paperSize: options.paperSize || 'A4',
          fileName: result.fileName
        }
      }
    });

    await order.save();

    res.json({
      success: true,
      message: 'Bon de commande généré avec succès',
      data: {
        pdfUrl: result.url,
        fileName: result.fileName,
        filePath: result.filePath
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.downloadPDF = async (req, res, next) => {
  try {
    let order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Commande non trouvée' });
    }

    // Régénérer si absent
    if (!order.pdfPath || !fs.existsSync(order.pdfPath)) {
      const result = await PDFService.generateOrderPDF(req.params.id);
      order.pdfPath = result.filePath;
      await order.save();
    }

    res.download(order.pdfPath, `bon-commande-${order.orderNumber}.pdf`);
  } catch (error) {
    next(error);
  }
};
