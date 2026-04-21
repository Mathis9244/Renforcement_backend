const express = require('express');
const router = express.Router();
const { requireAuth, requireRoles } = require('../middleware/auth');
const { ROLES } = require('../constants/roles');
const documentsService = require('../services/documents');

const uploadRoles = [
  ROLES.CHARGE_CLIENTELE,
  ROLES.GESTIONNAIRE_PORTEFEUILLE,
];

// Ne pas faire router.use(requireAuth) ici : monté sur `/api/v1`, cela exigerait un JWT
// pour toutes les URLs sous ce préfixe (ex. GET /api/v1/docs/openapi.yaml).

router.post(
  '/claims/:claimId/documents',
  requireAuth,
  requireRoles(...uploadRoles),
  documentsService.addClaimDocument
);
router.patch(
  '/documents/:id/validate',
  requireAuth,
  requireRoles(ROLES.GESTIONNAIRE_PORTEFEUILLE),
  documentsService.validateDocument
);

module.exports = router;
