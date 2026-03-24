const { Op } = require('sequelize');
const {
  Claim,
  CaseFile,
  ClaimDocument,
  User,
} = require('../models');
const { ROLES } = require('../constants/roles');
const { SCENARIO, getInitialState } = require('../constants/caseWorkflow');
const { generateCaseNumber } = require('../lib/caseNumber');
const { writeAuditLog } = require('../lib/audit');

const REQUIRED_DOC_TYPES = [
  'attestation_assurance',
  'carte_grise',
  'piece_identite_conducteur',
];

function normalizeLiability(body) {
  const accepted = Boolean(body.liabilityAccepted);
  if (!accepted) {
    return { liabilityAccepted: false, liabilityPercent: 0 };
  }
  const p = Number(body.liabilityPercent);
  if (p !== 50 && p !== 100) {
    return { error: 'liabilityPercent must be 50 or 100 when liabilityAccepted is true' };
  }
  return { liabilityAccepted: true, liabilityPercent: p };
}

async function listClaims(req, res) {
  try {
    const where = {};
    if (req.user.role === ROLES.CHARGE_CLIENTELE) {
      where.createdById = req.user.id;
    }
    const claims = await Claim.findAll({
      where,
      include: [
        { model: User, as: 'creator', attributes: ['id', 'username', 'email', 'role'] },
        { model: CaseFile, as: 'caseFile' },
      ],
      order: [['id', 'DESC']],
    });
    return res.status(200).json({ claims });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
}

async function getClaim(req, res) {
  try {
    const claim = await Claim.findByPk(req.params.id, {
      include: [
        { model: User, as: 'creator', attributes: ['id', 'username', 'email', 'role'] },
        { model: CaseFile, as: 'caseFile' },
        { model: ClaimDocument, as: 'documents' },
      ],
    });
    if (!claim) {
      return res.status(404).json({ message: 'Claim not found' });
    }
    if (
      req.user.role === ROLES.CHARGE_CLIENTELE &&
      claim.createdById !== req.user.id
    ) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    return res.status(200).json({ claim });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
}

async function createClaim(req, res) {
  try {
    const required = [
      'vehicleRegistration',
      'driverFirstName',
      'driverLastName',
      'callAt',
      'accidentAt',
      'contextText',
    ];
    for (const k of required) {
      if (req.body[k] === undefined || req.body[k] === '') {
        return res.status(400).json({ message: `Field required: ${k}` });
      }
    }
    const liab = normalizeLiability(req.body);
    if (liab.error) {
      return res.status(400).json({ message: liab.error });
    }
    const payload = {
      vehicleRegistration: req.body.vehicleRegistration,
      driverFirstName: req.body.driverFirstName,
      driverLastName: req.body.driverLastName,
      driverIsInsured: req.body.driverIsInsured !== false,
      callAt: req.body.callAt,
      accidentAt: req.body.accidentAt,
      contextText: req.body.contextText,
      liabilityAccepted: liab.liabilityAccepted,
      liabilityPercent: liab.liabilityPercent,
      status: 'draft',
      createdById: req.user.id,
    };
    const claim = await Claim.create(payload);
    await writeAuditLog({
      entityType: 'Claim',
      entityId: claim.id,
      action: 'CLAIM_CREATED',
      userId: req.user.id,
      metadata: { status: claim.status },
    });
    return res.status(201).json({ claim });
  } catch (e) {
    return res.status(400).json({ message: e.message });
  }
}

async function updateClaim(req, res) {
  try {
    const claim = await Claim.findByPk(req.params.id);
    if (!claim) {
      return res.status(404).json({ message: 'Claim not found' });
    }
    if (claim.status !== 'draft') {
      return res.status(400).json({ message: 'Only draft claims can be updated' });
    }
    const canEdit =
      req.user.role === ROLES.GESTIONNAIRE_PORTEFEUILLE ||
      req.user.role === ROLES.ADMIN ||
      (req.user.role === ROLES.CHARGE_CLIENTELE && claim.createdById === req.user.id);
    if (!canEdit) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    const allowed = [
      'vehicleRegistration',
      'driverFirstName',
      'driverLastName',
      'driverIsInsured',
      'callAt',
      'accidentAt',
      'contextText',
      'liabilityAccepted',
      'liabilityPercent',
    ];
    const patch = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        patch[key] = req.body[key];
      }
    }
    const liab = normalizeLiability({ ...claim.toJSON(), ...patch });
    if (liab.error) {
      return res.status(400).json({ message: liab.error });
    }
    await claim.update({
      ...patch,
      liabilityAccepted: liab.liabilityAccepted,
      liabilityPercent: liab.liabilityPercent,
    });
    await writeAuditLog({
      entityType: 'Claim',
      entityId: claim.id,
      action: 'CLAIM_UPDATED',
      userId: req.user.id,
    });
    return res.status(200).json({ claim });
  } catch (e) {
    return res.status(400).json({ message: e.message });
  }
}

async function completeClaim(req, res) {
  try {
    const claim = await Claim.findByPk(req.params.id, {
      include: [{ model: ClaimDocument, as: 'documents' }],
    });
    if (!claim) {
      return res.status(404).json({ message: 'Claim not found' });
    }
    if (claim.status !== 'draft') {
      return res.status(400).json({ message: 'Claim already completed' });
    }
    const canComplete =
      req.user.role === ROLES.GESTIONNAIRE_PORTEFEUILLE ||
      req.user.role === ROLES.ADMIN ||
      (req.user.role === ROLES.CHARGE_CLIENTELE && claim.createdById === req.user.id);
    if (!canComplete) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    const scenario = req.body.scenario;
    if (scenario !== SCENARIO.REPARABLE && scenario !== SCENARIO.TOTAL_LOSS) {
      return res.status(400).json({
        message: `scenario must be "${SCENARIO.REPARABLE}" or "${SCENARIO.TOTAL_LOSS}"`,
      });
    }
    const types = new Set((claim.documents || []).map((d) => d.docType));
    const missing = REQUIRED_DOC_TYPES.filter((t) => !types.has(t));
    if (missing.length) {
      return res.status(400).json({
        message: 'Missing required documents',
        missing,
      });
    }
    const existing = await CaseFile.findOne({ where: { claimId: claim.id } });
    if (existing) {
      return res.status(400).json({ message: 'Case file already exists' });
    }
    const caseNumber = generateCaseNumber();
    const initialState = getInitialState();
    const caseFile = await CaseFile.create({
      caseNumber,
      claimId: claim.id,
      scenario,
      currentState: initialState,
      assignedToId: req.body.assignedToId || null,
      createdById: req.user.id,
    });
    await claim.update({ status: 'complete' });
    await writeAuditLog({
      entityType: 'Claim',
      entityId: claim.id,
      action: 'CLAIM_COMPLETED',
      userId: req.user.id,
      metadata: { caseFileId: caseFile.id, caseNumber },
    });
    await writeAuditLog({
      entityType: 'CaseFile',
      entityId: caseFile.id,
      action: 'CASE_FILE_CREATED',
      userId: req.user.id,
    });
    return res.status(201).json({ claim, caseFile });
  } catch (e) {
    return res.status(400).json({ message: e.message });
  }
}

module.exports = {
  listClaims,
  getClaim,
  createClaim,
  updateClaim,
  completeClaim,
};
