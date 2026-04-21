const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

function loadAuthConfig() {
  const p = path.join(__dirname, '..', 'auth.json');
  if (!fs.existsSync(p)) {
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
}

let cachedTransporter = null;

function getTransporter() {
  if (cachedTransporter) return cachedTransporter;

  const cfg = loadAuthConfig();
  const smtp = cfg?.smtp;

  const host = process.env.SMTP_HOST || smtp?.host || 'app-assurmoi-mailhog';
  const port = Number(process.env.SMTP_PORT || smtp?.port || 1025);
  const secure = String(process.env.SMTP_SECURE || smtp?.secure || 'false') === 'true';

  const user = process.env.SMTP_USER || smtp?.auth?.user;
  const pass = process.env.SMTP_PASS || smtp?.auth?.pass;

  cachedTransporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: user && pass ? { user, pass } : undefined,
  });

  return cachedTransporter;
}

function getFrom() {
  const cfg = loadAuthConfig();
  const from = cfg?.from;
  const name = process.env.MAIL_FROM_NAME || from?.name || 'AssurMoi';
  const email = process.env.MAIL_FROM_EMAIL || from?.email || 'no-reply@assurmoi.fr';
  return { name, email };
}

function getResetBaseUrl() {
  const cfg = loadAuthConfig();
  return process.env.RESET_BASE_URL || cfg?.resetPassword?.baseUrl || 'http://localhost:5173';
}

async function sendResetPasswordEmail({ to, token }) {
  const transporter = getTransporter();
  const from = getFrom();

  const baseUrl = getResetBaseUrl();
  const resetUrl = `${String(baseUrl).replace(/\/+$/, '')}/reset-password?token=${encodeURIComponent(
    token
  )}`;

  return transporter.sendMail({
    from: `"${from.name}" <${from.email}>`,
    to,
    subject: 'Réinitialisation de votre mot de passe — AssurMoi',
    text: `Bonjour,\n\nPour réinitialiser votre mot de passe, ouvrez ce lien :\n${resetUrl}\n\nSi vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail.\n`,
  });
}

module.exports = {
  sendResetPasswordEmail,
};

