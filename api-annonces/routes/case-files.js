const express = require('express');
const router = express.Router();
const { requireAuth, requireRoles } = require('../middleware/auth');
const { ROLES } = require('../constants/roles');
const caseFilesService = require('../services/caseFiles');

const staffCases = [
  ROLES.CHARGE_SUIVI,
  ROLES.GESTIONNAIRE_PORTEFEUILLE,
];

router.use(requireAuth);

router.get('/', requireRoles(...staffCases), caseFilesService.listCaseFiles);
router.get('/:id', requireRoles(...staffCases), caseFilesService.getCaseFile);
router.patch(
  '/:id/assign',
  requireRoles(ROLES.GESTIONNAIRE_PORTEFEUILLE),
  caseFilesService.assignCaseFile
);
router.post(
  '/:id/transition',
  requireRoles(ROLES.CHARGE_SUIVI, ROLES.GESTIONNAIRE_PORTEFEUILLE),
  caseFilesService.transitionCaseFile
);
router.post(
  '/:id/esign',
  requireRoles(...staffCases),
  caseFilesService.esignStub
);

module.exports = router;
