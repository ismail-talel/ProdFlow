const jwt = require('jsonwebtoken');
const { User } = require('../models/User');
const { UserRoles } = require('../models/UserRoles');

const auth = async (req, res, next) => {
  let token;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Non authentifié.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'Token invalide.' });
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Token invalide ou expiré.' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé. Rôle insuffisant pour cette action.'
      });
    }
    next();
  };
};


const admin = authorize(UserRoles.SUPER_ADMIN, UserRoles.ADMIN_MAGASIN);


const productManage = authorize(
  UserRoles.SUPER_ADMIN,
  UserRoles.ADMIN_MAGASIN,
  UserRoles.RESPONSABLE_RECEPTION,
  UserRoles.EXPEDITION_MAGASIN
);


const orderCreate = authorize(
  UserRoles.SUPER_ADMIN,
  UserRoles.ADMIN_MAGASIN,
  UserRoles.RESPONSABLE_RECEPTION
);


const orderConfirmModify = authorize(
  UserRoles.SUPER_ADMIN,
  UserRoles.ADMIN_MAGASIN,
  UserRoles.RESPONSABLE_RECEPTION,
  UserRoles.EXPEDITION_MAGASIN
);


const reception = authorize(
  UserRoles.SUPER_ADMIN,
  UserRoles.ADMIN_MAGASIN,
  UserRoles.RESPONSABLE_RECEPTION
);


const expedition = authorize(
  UserRoles.SUPER_ADMIN,
  UserRoles.ADMIN_MAGASIN,
  UserRoles.EXPEDITION_MAGASIN
);

const superAdmin = authorize(UserRoles.SUPER_ADMIN);

module.exports = {
  auth,
  protect: auth,
  authorize,
  admin,
  productManage,
  orderCreate,
  orderConfirmModify,
  reception,
  expedition,
  superAdmin,
  UserRoles
};
