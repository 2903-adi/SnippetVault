import nodemailer from "nodemailer";

function hasSmtpConfig() {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS
  );
}

export function createTransporter() {
  if (!hasSmtpConfig()) {
    const err = new Error(
      "Email is not configured. Add SMTP_HOST, SMTP_USER, and SMTP_PASS to backend/.env"
    );
    err.statusCode = 503;
    throw err;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export async function sendOtpEmail(email, code) {
  const transporter = createTransporter();
  const from =
    process.env.MAIL_FROM ||
    `SnippetVault <${process.env.SMTP_USER}>`;

  await transporter.verify();

  const info = await transporter.sendMail({
    from,
    to: email,
    subject: "Your SnippetVault login code",
    text: `Your SnippetVault verification code is ${code}. It expires in 10 minutes.`,
    html: `
      <div style="font-family: sans-serif; line-height: 1.5; color: #0b1f1c;">
        <h2 style="margin: 0 0 12px;">SnippetVault</h2>
        <p>Your login code is:</p>
        <p style="font-size: 28px; letter-spacing: 6px; font-weight: 700; color: #0f6b4c;">${code}</p>
        <p>This code expires in 10 minutes. If you did not request this, ignore this email.</p>
      </div>
    `,
  });

  console.log(`OTP email sent to ${email} (messageId: ${info.messageId})`);
  return info;
}
