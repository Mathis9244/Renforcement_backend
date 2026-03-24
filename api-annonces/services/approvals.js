const {
  Approval,
  CaseFile,
  CaseTransition,
} = require('../models');
const { findTransition, isManagerRole } = require('../constants/caseWorkflow');
const { writeAuditLog } = require('../lib/audit');

async function listPendingApprovals(req, res) {
  try {
    if (!isManagerRole(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    const rows = await Approval.findAll({
      where: { status: 'pending' },
      include: [{ model: CaseFile, as: 'caseFile' }],
      order: [['id', 'ASC']],
    });
    return res.status(200).json({ approvals: rows });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
}

async function decideApproval(req, res) {
  try {
    if (!isManagerRole(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    const { decision } = req.body;
    if (!['approved', 'rejected'].includes(decision)) {
      return res.status(400).json({ message: 'decision must be approved or rejected' });
    }
    const approval = await Approval.findByPk(req.params.id, {
      include: [{ model: CaseFile, as: 'caseFile' }],
    });
    if (!approval || approval.status !== 'pending') {
      return res.status(404).json({ message: 'Pending approval not found' });
    }
    if (decision === 'rejected') {
      await approval.update({
        status: 'rejected',
        approverId: req.user.id,
      });
      await writeAuditLog({
        entityType: 'Approval',
        entityId: approval.id,
        action: 'APPROVAL_REJECTED',
        userId: req.user.id,
      });
      return res.status(200).json({ approval });
    }
    const cf = approval.caseFile;
    const fromState = cf.currentState;
    const toState = approval.stepKey;
    const edge = findTransition(cf.scenario, fromState, toState);
    if (!edge || !edge.requiresManagerApproval) {
      return res.status(400).json({ message: 'Invalid approval target state' });
    }
    await cf.sequelize.transaction(async (t) => {
      await cf.update({ currentState: toState }, { transaction: t });
      await CaseTransition.create(
        {
          caseFileId: cf.id,
          fromState,
          toState,
          userId: req.user.id,
          comment: 'Approved by manager',
        },
        { transaction: t }
      );
      await approval.update(
        { status: 'approved', approverId: req.user.id },
        { transaction: t }
      );
    });
    await writeAuditLog({
      entityType: 'CaseFile',
      entityId: cf.id,
      action: 'CASE_TRANSITION_APPROVED',
      userId: req.user.id,
      metadata: { fromState, toState, approvalId: approval.id },
    });
    const updated = await CaseFile.findByPk(cf.id);
    return res.status(200).json({ caseFile: updated, approval });
  } catch (e) {
    return res.status(400).json({ message: e.message });
  }
}

module.exports = {
  listPendingApprovals,
  decideApproval,
};
