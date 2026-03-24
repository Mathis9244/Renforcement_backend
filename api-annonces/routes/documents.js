const express = require('express');
const router = express.Router();
const { requireAuth, requireRoles } = require('../middleware/auth');
const { ROLES } = require('../constants/roles');
const documentsService = require('../services/documents');

const uploadRoles = [
  ROLES.CHARGE_CLIENTELE,
  ROLES.GESTIONNAIRE_PORTEFEUILLE,
];

router.use(requireAuth);

router.post(
  '/claims/:claimId/documents',
  requireRoles(...uploadRoles),
  documentsService.addClaimDocument
);
router.patch(
  '/documents/:id/validate',
  requireRoles(ROLES.GESTIONNAIRE_PORTEFEUILLE),
  documentsService.validateDocument
);

module.exports = router;
