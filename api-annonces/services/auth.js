const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { User, PasswordResetToken } = require('../models');
const { signToken } = require('../middleware/auth');
const { writeAuditLog } = require('../lib/audit');

async function login(req, res) {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: 'username and password required' });
    }
    const user = await User.scope('withPassword').findOne({ where: { username } });
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    if (user.twoFactorEnabled) {
      return res.status(200).json({
        twoFactorRequired: true,
        message: '2FA enabled: call POST /api/v1/auth/2fa/verify with temporaryToken (stub)',
      });
    }
    const token = signToken(user);
    await writeAuditLog({
      entityType: 'User',
      entityId: user.id,
      action: 'LOGIN',
      userId: user.id,
    });
    const json = user.toJSON();
    return res.status(200).json({ token, user: json });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
}

async function forgotPassword(req, res) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'email required' });
    }
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(200).json({ message: 'If the email exists, a reset link will be sent.' });
    }
    const raw = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(raw).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await PasswordResetToken.create({ userId: user.id, tokenHash, expiresAt });
    await writeAuditLog({
      entityType: 'User',
      entityId: user.id,
      action: 'PASSWORD_RESET_REQUESTED',
      userId: user.id,
    });
    return res.status(200).json({
      message: 'Reset token created (dev: return token once)',
      resetToken: raw,
    });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
}

async function resetPassword(req, res) {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ message: 'token and newPassword required' });
    }
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const row = await PasswordResetToken.findOne({ where: { tokenHash } });
    if (!row || row.expiresAt < new Date()) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }
    const user = await User.scope('withPassword').findByPk(row.userId);
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    await row.destroy();
    await writeAuditLog({
      entityType: 'User',
      entityId: user.id,
      action: 'PASSWORD_RESET_COMPLETED',
      userId: user.id,
    });
    return res.status(200).json({ message: 'Password updated' });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
}

async function setup2faStub(req, res) {
  return res.status(501).json({
    message: '2FA setup: intégrer OTP SMS/email (Twilio/SendGrid UE) — stub',
    doc: 'https://sequelize.org/docs/v6/',
  });
}

async function verify2faStub(req, res) {
  return res.status(501).json({
    message: '2FA verify stub — fournir code OTP',
  });
}

module.exports = {
  login,
  forgotPassword,
  resetPassword,
  setup2faStub,
  verify2faStub,
};
