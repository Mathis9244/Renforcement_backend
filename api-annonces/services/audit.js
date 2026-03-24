const { AuditLog, User } = require('../models');
const { isManagerRole } = require('../constants/caseWorkflow');

async function listAuditLogs(req, res) {
  try {
    if (!isManagerRole(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    const limit = Math.min(Number(req.query.limit) || 100, 500);
    const logs = await AuditLog.findAll({
      include: [{ model: User, as: 'user', attributes: ['id', 'username', 'role'] }],
      order: [['id', 'DESC']],
      limit,
    });
    return res.status(200).json({ logs });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
}

module.exports = { listAuditLogs };
