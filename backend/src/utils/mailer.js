import dns from "dns/promises";
import nodemailer from "nodemailer";

function hasSmtpConfig() {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS
  );
}

async function createTransporter() {
  if (!hasSmtpConfig()) {
    const err = new Error(
      "Email is not configured. Add SMTP_HOST, SMTP_USER, and SMTP_PASS in Render Environment"
    );
    err.statusCode = 503;
    throw err;
  }

  const host = process.env.SMTP_HOST.trim();
  const pass = process.env.SMTP_PASS.replace(/\s+/g, "");
  const port = Number(process.env.SMTP_PORT || 587);
  const secure = process.env.SMTP_SECURE === "true";

  let ipv4;
  try {
    const lookedUp = await dns.lookup(host, { family: 4 });
    ipv4 = lookedUp.address;
    console.log(`SMTP resolving ${host} -> ${ipv4} (IPv4)`);
  } catch (err) {
    const e = new Error(`Could not resolve SMTP host ${host} to IPv4: ${err.message}`);
    e.statusCode = 502;
    throw e;
  }

  return nodemailer.createTransport({
    host: ipv4,
    port,
    secure,
    auth: {
      user: process.env.SMTP_USER.trim(),
      pass,
    },
    tls: {
      servername: host,
    },
    connectionTimeout: 20000,
    greetingTimeout: 20000,
    socketTimeout: 20000,
  });
}

export async function sendOtpEmail(email, code) {
  const transporter = await createTransporter();
  const from = (process.env.MAIL_FROM || process.env.SMTP_USER).trim();

  try {
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
  } catch (err) {
    console.error("SMTP error:", err?.response || err?.message || err);
    const e = new Error(
      err?.response || err?.message || "Could not send email via SMTP"
    );
    e.statusCode = 502;
    throw e;
  }
}
