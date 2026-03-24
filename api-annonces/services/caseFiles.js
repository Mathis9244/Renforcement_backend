const {
  CaseFile,
  Claim,
  CaseTransition,
  Approval,
  User,
} = require('../models');
const { ROLES } = require('../constants/roles');
const { findTransition, isManagerRole } = require('../constants/caseWorkflow');
const { writeAuditLog } = require('../lib/audit');

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
    if (edge.requiresManagerApproval && !isManagerRole(req.user.role)) {
      const existing = await Approval.findOne({
        where: { caseFileId: cf.id, stepKey: toState, status: 'pending' },
      });
      if (existing) {
        return res.status(202).json({
          message: 'Waiting for manager approval',
          approvalId: existing.id,
        });
      }
      const approval = await Approval.create({
        caseFileId: cf.id,
        stepKey: toState,
        requesterId: req.user.id,
        status: 'pending',
      });
      await writeAuditLog({
        entityType: 'CaseFile',
        entityId: cf.id,
        action: 'APPROVAL_REQUESTED',
        userId: req.user.id,
        metadata: { toState, approvalId: approval.id },
      });
      return res.status(202).json({
        message: 'Manager approval required before transition',
        approvalId: approval.id,
      });
    }
    await cf.sequelize.transaction(async (t) => {
      await cf.update({ currentState: toState }, { transaction: t });
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
      metadata: { fromState, toState },
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
