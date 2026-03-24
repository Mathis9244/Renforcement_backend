const express = require('express');
const router = express.Router();
const { requireAuth, requireRoles } = require('../middleware/auth');
const { ROLES } = require('../constants/roles');
const auditService = require('../services/audit');

router.use(requireAuth);
router.use(requireRoles(ROLES.GESTIONNAIRE_PORTEFEUILLE));

router.get('/logs', auditService.listAuditLogs);

module.exports = router;
