const { AuditLog } = require('../models');

async function writeAuditLog({ entityType, entityId, action, userId, metadata }) {
  const metaStr =
    metadata === undefined || metadata === null
      ? null
      : typeof metadata === 'string'
        ? metadata
        : JSON.stringify(metadata);
  await AuditLog.create({
    entityType,
    entityId: String(entityId),
    action,
    userId: userId ?? null,
    metadata: metaStr,
  });
}

module.exports = { writeAuditLog };
