const express = require('express');
const router = express.Router();
const { requireAuth, requireRoles } = require('../middleware/auth');
const { ROLES } = require('../constants/roles');
const claimsService = require('../services/claims');

const staffClaims = [
  ROLES.CHARGE_CLIENTELE,
  ROLES.CHARGE_SUIVI,
  ROLES.GESTIONNAIRE_PORTEFEUILLE,
];

router.use(requireAuth);

router.get('/', requireRoles(...staffClaims), claimsService.listClaims);
router.get('/:id', requireRoles(...staffClaims), claimsService.getClaim);
router.post(
  '/',
  requireRoles(ROLES.CHARGE_CLIENTELE, ROLES.GESTIONNAIRE_PORTEFEUILLE),
  claimsService.createClaim
);
router.patch('/:id', requireRoles(...staffClaims), claimsService.updateClaim);
router.post(
  '/:id/complete',
  requireRoles(ROLES.CHARGE_CLIENTELE, ROLES.GESTIONNAIRE_PORTEFEUILLE),
  claimsService.completeClaim
);

module.exports = router;
