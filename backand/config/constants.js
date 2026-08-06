const { UserRoles } = require('../models/UserRoles');

module.exports = {
  UserRoles,

  OrderStatus: {
    PENDING: 'en_attente_verification',
    CONFIRMED: 'confirme'
  },

  MESSAGES: {
    UNAUTHORIZED: 'Non authentifié',
    FORBIDDEN: 'Accès refusé',
    NOT_FOUND: 'Ressource non trouvée',
    SERVER_ERROR: 'Erreur interne du serveur'
  }
};
