const {
  CaseFile,
  Claim,
  CaseTransition,
  Approval,
  User,
} = require('../models');
const { ROLES } = require('../constants/roles');
const { findTransition, isManagerRole, REQUIRED_FIELDS_BY_STATE } = require('../constants/caseWorkflow');
const { writeAuditLog } = require('../lib/audit');

function pickUpdatableFields(body) {
  const allowed = [
    'expertisePlannedAt',
    'expertiseDoneAt',
    'expertiseReportUrl',
    'expertiseDiagnostic',
    'interventionPlannedAt',
    'vehiclePickupPlannedAt',
    'vehiclePickupAt',
    'interventionStartAt',
    'interventionEndAt',
    'restitutionPlannedAt',
    'restitutionAt',
    'invoiceReceivedAt',
    'invoiceUrl',
    'paidAt',
    'thirdPartyPaid',
    'indemnisationEstimate',
    'insuredApproval',
    'insuredRibUrl',
    'indemnisationPaidAt',
    'closedAt',
  ];
  const out = {};
  for (const k of allowed) {
    if (body[k] !== undefined) out[k] = body[k];
  }
  return out;
}

function validateRequiredFieldsForState(toState, body) {
  const req = REQUIRED_FIELDS_BY_STATE[toState] || [];
  const missing = req.filter((k) => body[k] === undefined || body[k] === null || body[k] === '');
  if (missing.length) {
    return { ok: false, missing };
  }
  return { ok: true, missing: [] };
}

async function listCaseFiles(req, res) {
  try {
    const where = {};
    if (req.user.role === ROLES.CHARGE_SUIVI) {
      where.assignedToId = req.user.id;
    }
    const rows = await CaseFile.findAll({
      where,
      include: [
        { model: Claim, as: 'claim' },
        { model: User, as: 'assignee', attributes: ['id', 'username', 'email', 'role'] },
      ],
      order: [['id', 'DESC']],
    });
    return res.status(200).json({ caseFiles: rows });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
}

async function getCaseFile(req, res) {
  try {
    const cf = await CaseFile.findByPk(req.params.id, {
      include: [
        { model: Claim, as: 'claim' },
        { model: User, as: 'assignee', attributes: ['id', 'username', 'email', 'role'] },
        { model: CaseTransition, as: 'transitions', include: [{ model: User, as: 'user', attributes: ['id', 'username'] }] },
        { model: Approval, as: 'approvals' },
      ],
    });
    if (!cf) {
      return res.status(404).json({ message: 'Case file not found' });
    }
    if (
      req.user.role === ROLES.CHARGE_SUIVI &&
      cf.assignedToId !== req.user.id
    ) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    return res.status(200).json({ caseFile: cf });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
}

async function assignCaseFile(req, res) {
  try {
    const cf = await CaseFile.findByPk(req.params.id);
    if (!cf) {
      return res.status(404).json({ message: 'Case file not found' });
    }
    const { assignedToId } = req.body;
    if (!assignedToId) {
      return res.status(400).json({ message: 'assignedToId required' });
    }
    await cf.update({ assignedToId });
    await writeAuditLog({
      entityType: 'CaseFile',
      entityId: cf.id,
      action: 'CASE_ASSIGNED',
      userId: req.user.id,
      metadata: { assignedToId },
    });
    return res.status(200).json({ caseFile: cf });
  } catch (e) {
    return res.status(400).json({ message: e.message });
  }
}

async function transitionCaseFile(req, res) {
  try {
    const { toState, comment } = req.body;
    if (!toState) {
      return res.status(400).json({ message: 'toState required' });
    }
    const requiredCheck = validateRequiredFieldsForState(toState, req.body);
    if (!requiredCheck.ok) {
      return res.status(400).json({
        message: 'Missing required fields for this workflow step',
        missing: requiredCheck.missing,
      });
    }
    const cf = await CaseFile.findByPk(req.params.id);
    if (!cf) {
      return res.status(404).json({ message: 'Case file not found' });
    }
    if (
      req.user.role === ROLES.CHARGE_SUIVI &&
      cf.assignedToId !== req.user.id
    ) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    const fromState = cf.currentState;
    const edge = findTransition(cf.scenario, fromState, toState);
    if (!edge) {
      return res.status(400).json({ message: 'Invalid transition for this scenario' });
    }
    const patch = pickUpdatableFields(req.body);
    if (edge.requiresManagerApproval && !isManagerRole(req.user.role)) {
      const existing = await Approval.findOne({
        where: { caseFileId: cf.id, stepKey: toState, status: 'pending' },
      });
      if (existing) {
        if (Object.keys(patch).length) {
          await cf.update(patch);
        }
        return res.status(202).json({
          message: 'Waiting for manager approval',
          approvalId: existing.id,
        });
      }
      const approval = await cf.sequelize.transaction(async (t) => {
        if (Object.keys(patch).length) {
          await cf.update(patch, { transaction: t });
        }
        return await Approval.create(
          {
            caseFileId: cf.id,
            stepKey: toState,
            requesterId: req.user.id,
            status: 'pending',
          },
          { transaction: t }
        );
      });
      await writeAuditLog({
        entityType: 'CaseFile',
        entityId: cf.id,
        action: 'APPROVAL_REQUESTED',
        userId: req.user.id,
        metadata: { toState, approvalId: approval.id, fields: Object.keys(patch) },
      });
      return res.status(202).json({
        message: 'Manager approval required before transition',
        approvalId: approval.id,
      });
    }
    await cf.sequelize.transaction(async (t) => {
      await cf.update({ ...patch, currentState: toState }, { transaction: t });
      await CaseTransition.create(
        {
          caseFileId: cf.id,
          fromState,
          toState,
          userId: req.user.id,
          comment: comment || null,
        },
        { transaction: t }
      );
    });
    await writeAuditLog({
      entityType: 'CaseFile',
      entityId: cf.id,
      action: 'CASE_TRANSITION',
      userId: req.user.id,
      metadata: { fromState, toState, fields: Object.keys(patch) },
    });
    const updated = await CaseFile.findByPk(cf.id);
    return res.status(200).json({ caseFile: updated });
  } catch (e) {
    return res.status(400).json({ message: e.message });
  }
}

async function esignStub(req, res) {
  await writeAuditLog({
    entityType: 'CaseFile',
    entityId: req.params.id,
    action: 'ESIGN_STUB',
    userId: req.user.id,
    metadata: { provider: 'DocuSign_or_Yousign_EU_stub' },
  });
  return res.status(200).json({
    message:
      'Stub signature électronique — intégrer un fournisseur conforme RGPD (données UE/FR).',
    envelopeId: `stub-${req.params.id}-${Date.now()}`,
  });
}

module.exports = {
  listCaseFiles,
  getCaseFile,
  assignCaseFile,
  transitionCaseFile,
  esignStub,
};
