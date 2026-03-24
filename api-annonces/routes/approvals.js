const express = require('express');
const router = express.Router();
const { requireAuth, requireRoles } = require('../middleware/auth');
const { ROLES } = require('../constants/roles');
const approvalsService = require('../services/approvals');

router.use(requireAuth);
router.use(requireRoles(ROLES.GESTIONNAIRE_PORTEFEUILLE));

router.get('/pending', approvalsService.listPendingApprovals);
router.patch('/:id/decide', approvalsService.decideApproval);

module.exports = router;
