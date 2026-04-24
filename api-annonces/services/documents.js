const { ClaimDocument, Claim } = require('../models');
const { ROLES } = require('../constants/roles');
const { writeAuditLog } = require('../lib/audit');
const formidable = require('formidable');
const path = require('path');
const fs = require('fs');

const ALLOWED_TYPES = new Set([
  'attestation_assurance',
  'carte_grise',
  'piece_identite_conducteur',
  'other',
]);

function ensureUploadsDir() {
  const dir = path.join(__dirname, '..', 'uploads');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function isMultipart(req) {
  const ct = String(req.headers['content-type'] || '');
  return ct.includes('multipart/form-data');
}

function sanitizeFileName(name) {
  return String(name || 'upload')
    .replace(/[^\w.\-]+/g, '_')
    .slice(0, 120);
}

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

    let docType;
    let fileUrl;
    let caseFileId;

    if (isMultipart(req)) {
      const uploadsDir = ensureUploadsDir();
      const form = formidable({
        multiples: false,
        uploadDir: uploadsDir,
        keepExtensions: true,
        maxFileSize: 25 * 1024 * 1024, // 25MB
      });

      const { fields, files } = await new Promise((resolve, reject) => {
        form.parse(req, (err, fields, files) => {
          if (err) return reject(err);
          return resolve({ fields, files });
        });
      });

      docType = Array.isArray(fields.docType) ? fields.docType[0] : fields.docType;
      caseFileId = Array.isArray(fields.caseFileId) ? fields.caseFileId[0] : fields.caseFileId;

      const file = files.file
        ? (Array.isArray(files.file) ? files.file[0] : files.file)
        : null;

      if (!docType || !file) {
        return res.status(400).json({ message: 'docType and file are required' });
      }

      const original = sanitizeFileName(file.originalFilename || file.newFilename);
      const ext = path.extname(original) || path.extname(file.filepath) || '';
      const finalName = `${Date.now()}_${Math.random().toString(16).slice(2)}${ext}`;
      const finalPath = path.join(uploadsDir, finalName);
      await fs.promises.rename(file.filepath, finalPath);

      fileUrl = `/uploads/${finalName}`;
    } else {
      const body = req.body || {};
      docType = body.docType;
      fileUrl = body.fileUrl;
      caseFileId = body.caseFileId;
      if (!docType || !fileUrl) {
        return res.status(400).json({ message: 'docType and fileUrl required' });
      }
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
