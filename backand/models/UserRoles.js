const UserRoles = {
  SUPER_ADMIN: 'super_admin',
  ADMIN_MAGASIN: 'admin_magasin',
  RESPONSABLE_RECEPTION: 'responsable_reception',
  EXPEDITION_MAGASIN: 'expedition_magasin'
};

const RoleList = Object.values(UserRoles);

const RoleLabels = {
  [UserRoles.SUPER_ADMIN]: 'Super Administrateur',
  [UserRoles.ADMIN_MAGASIN]: 'Responsable Magasin',
  [UserRoles.RESPONSABLE_RECEPTION]: 'Responsable Réception',
  [UserRoles.EXPEDITION_MAGASIN]: 'Magasin Expédition'
};

module.exports = { UserRoles, RoleList, RoleLabels };
