const nodemailer = require('nodemailer');

const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, CONTACT_TO_EMAIL } = process.env;

const isConfigured = Boolean(SMTP_HOST && SMTP_USER && SMTP_PASS);

let transporter = null;
if (isConfigured) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 587,
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS }
  });
} else {
  console.warn('SMTP is not configured — contact form emails will not be sent (submissions still saved to the admin dashboard). See .env.example.');
}

async function sendContactNotification({ name, email, message }) {
  if (!transporter) return { sent: false };

  const to = CONTACT_TO_EMAIL || SMTP_USER;

  await transporter.sendMail({
    from: `"Portfolio contact form" <${SMTP_USER}>`,
    to,
    replyTo: email,
    subject: `New project enquiry from ${name}`,
    text: `${message}\n\n—\n${name}\n${email}`
  });

  return { sent: true };
}

module.exports = { sendContactNotification, isConfigured };
