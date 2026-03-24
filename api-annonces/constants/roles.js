const ROLES = {
  ADMIN: 'admin',
  GESTIONNAIRE_PORTEFEUILLE: 'gestionnaire_portefeuille',
  CHARGE_SUIVI: 'charge_suivi',
  CHARGE_CLIENTELE: 'charge_clientele',
  ASSURE: 'assure',
};

const ALL_STAFF_ROLES = [
  ROLES.ADMIN,
  ROLES.GESTIONNAIRE_PORTEFEUILLE,
  ROLES.CHARGE_SUIVI,
  ROLES.CHARGE_CLIENTELE,
];

module.exports = { ROLES, ALL_STAFF_ROLES };
