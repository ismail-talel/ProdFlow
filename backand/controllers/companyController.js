const fs = require('fs');
const path = require('path');
const multer = require('multer');
const CompanyService = require('../services/companyService');

const logoDir = path.join(__dirname, '../uploads/logo');
if (!fs.existsSync(logoDir)) {
  fs.mkdirSync(logoDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, logoDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.png';
    cb(null, `company-logo-${Date.now()}${ext}`);
  }
});

const upload = multer({
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
  upload(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
};

/** GET /company — société active (celle utilisée par l'app / BC) */
exports.getActiveCompany = async (req, res, next) => {
  try {
    const company = await CompanyService.getActive();
    res.json({ success: true, data: company });
  } catch (error) {
    next(error);
  }
};

/** GET /companies — liste */
exports.getCompanies = async (req, res, next) => {
  try {
    const companies = await CompanyService.findAll();
    res.json({ success: true, count: companies.length, data: companies });
  } catch (error) {
    next(error);
  }
};

/** GET /companies/:id */
exports.getCompanyById = async (req, res, next) => {
  try {
    const company = await CompanyService.findById(req.params.id);
    res.json({ success: true, data: company });
  } catch (error) {
    next(error);
  }
};

/** POST /companies */
exports.createCompany = async (req, res, next) => {
  try {
    const company = await CompanyService.create(req.body, req.user);
    res.status(201).json({
      success: true,
      message: 'Société créée avec succès',
      data: company
    });
  } catch (error) {
    next(error);
  }
};

/** PUT /company — mise à jour de la société active */
exports.updateActiveCompany = async (req, res, next) => {
  try {
    const company = await CompanyService.updateActive(req.body, req.user);
    res.json({
      success: true,
      message: 'Informations société mises à jour',
      data: company
    });
  } catch (error) {
    next(error);
  }
};

/** PUT /companies/:id */
exports.updateCompany = async (req, res, next) => {
  try {
    const company = await CompanyService.update(req.params.id, req.body, req.user);
    res.json({
      success: true,
      message: 'Société mise à jour',
      data: company
    });
  } catch (error) {
    next(error);
  }
};

/** POST /company/logo — logo de la société active */
exports.uploadActiveLogo = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Fichier logo requis (champ: logo)'
      });
    }

    const logoPath = `/uploads/logo/${req.file.filename}`;
    const company = await CompanyService.setActiveLogo(
      logoPath,
      {
        logoWidth: req.body.logoWidth,
        logoHeight: req.body.logoHeight
      },
      req.user
    );

    res.json({
      success: true,
      message: 'Logo société téléversé avec succès',
      data: {
        logo: logoPath,
        logoUrl: logoPath,
        company
      }
    });
  } catch (error) {
    next(error);
  }
};

/** POST /companies/:id/logo */
exports.uploadCompanyLogo = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Fichier logo requis (champ: logo)'
      });
    }

    const logoPath = `/uploads/logo/${req.file.filename}`;
    const company = await CompanyService.setLogo(
      req.params.id,
      logoPath,
      {
        logoWidth: req.body.logoWidth,
        logoHeight: req.body.logoHeight
      },
      req.user
    );

    res.json({
      success: true,
      message: 'Logo téléversé avec succès',
      data: { logo: logoPath, company }
    });
  } catch (error) {
    next(error);
  }
};

/** DELETE /companies/:id — désactivé en mode mono-société */
exports.deleteCompany = async (req, res, next) => {
  try {
    await CompanyService.delete(req.params.id);
    res.json({ success: true, message: 'Société supprimée' });
  } catch (error) {
    next(error);
  }
};
