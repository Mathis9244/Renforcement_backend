const { ClaimDocument, Claim } = require('../models');
const { ROLES } = require('../constants/roles');
const { writeAuditLog } = require('../lib/audit');

const ALLOWED_TYPES = new Set([
  'attestation_assurance',
  'carte_grise',
  'piece_identite_conducteur',
  'other',
]);

async function addClaimDocument(req, res) {
  try {
    const claim = await Claim.findByPk(req.params.claimId);
    if (!claim) {
      return res.status(404).json({ message: 'Claim not found' });
    }
    if (
      req.user.role === ROLES.CHARGE_CLIENTELE &&
      claim.createdById !== req.user.id
    ) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    const { docType, fileUrl, caseFileId } = req.body;
    if (!docType || !fileUrl) {
      return res.status(400).json({ message: 'docType and fileUrl required' });
    }
    if (!ALLOWED_TYPES.has(docType)) {
      return res.status(400).json({
        message: `docType must be one of: ${[...ALLOWED_TYPES].join(', ')}`,
      });
    }
    const doc = await ClaimDocument.create({
      claimId: claim.id,
      caseFileId: caseFileId || null,
      docType,
      fileUrl,
      validationStatus: 'pending',
    });
    await writeAuditLog({
      entityType: 'ClaimDocument',
      entityId: doc.id,
      action: 'DOCUMENT_UPLOADED',
      userId: req.user.id,
      metadata: { claimId: claim.id, docType },
    });
    return res.status(201).json({ document: doc });
  } catch (e) {
    return res.status(400).json({ message: e.message });
  }
}

async function validateDocument(req, res) {
  try {
    const { status } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'status must be approved or rejected' });
    }
    const doc = await ClaimDocument.findByPk(req.params.id);
    if (!doc) {
      return res.status(404).json({ message: 'Document not found' });
    }
    await doc.update({
      validationStatus: status,
      validatedById: req.user.id,
    });
    await writeAuditLog({
      entityType: 'ClaimDocument',
      entityId: doc.id,
      action: 'DOCUMENT_VALIDATED',
      userId: req.user.id,
      metadata: { status },
    });
    return res.status(200).json({ document: doc });
  } catch (e) {
    return res.status(400).json({ message: e.message });
  }
}

module.exports = {
  addClaimDocument,
  validateDocument,
};
