import dns from "dns/promises";
import nodemailer from "nodemailer";

async function sendWithBrevo(email, code) {
  const apiKey = process.env.BREVO_API_KEY?.trim();
  if (!apiKey) return null;

  const senderEmail = (process.env.MAIL_FROM || process.env.SMTP_USER || "")
    .trim()
    .replace(/^.*<([^>]+)>.*$/, "$1");

  if (!senderEmail) {
    throw Object.assign(
      new Error("Set MAIL_FROM to your verified Brevo sender email"),
      { statusCode: 503 }
    );
  }

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify({
      sender: { email: senderEmail, name: "SnippetVault" },
      to: [{ email }],
      subject: "Your SnippetVault login code",
      htmlContent: `
        <div style="font-family: sans-serif; line-height: 1.5; color: #0b1f1c;">
          <h2>SnippetVault</h2>
          <p>Your login code is:</p>
          <p style="font-size: 28px; letter-spacing: 6px; font-weight: 700; color: #0f6b4c;">${code}</p>
          <p>This code expires in 10 minutes. If you did not request this, ignore this email.</p>
        </div>
      `,
      textContent: `Your SnippetVault verification code is ${code}. It expires in 10 minutes.`,
    }),
  });

  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw Object.assign(
      new Error(payload.message || `Brevo email failed (${res.status})`),
      { statusCode: 502 }
    );
  }

  console.log(`OTP email sent via Brevo to ${email}`);
  return { channel: "brevo" };
}

async function sendWithSmtp(email, code) {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return null;
  }

  const host = process.env.SMTP_HOST.trim();
  const pass = process.env.SMTP_PASS.replace(/\s+/g, "");
  const { address: ipv4 } = await dns.lookup(host, { family: 4 });

  const transporter = nodemailer.createTransport({
    host: ipv4,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER.trim(),
      pass,
    },
    tls: { servername: host },
    connectionTimeout: 12000,
    greetingTimeout: 12000,
    socketTimeout: 12000,
  });

  const from = (process.env.MAIL_FROM || process.env.SMTP_USER).trim();
  await transporter.sendMail({
    from,
    to: email,
    subject: "Your SnippetVault login code",
    text: `Your SnippetVault verification code is ${code}. It expires in 10 minutes.`,
    html: `
      <div style="font-family: sans-serif; line-height: 1.5; color: #0b1f1c;">
        <h2>SnippetVault</h2>
        <p>Your login code is:</p>
        <p style="font-size: 28px; letter-spacing: 6px; font-weight: 700; color: #0f6b4c;">${code}</p>
        <p>This code expires in 10 minutes. If you did not request this, ignore this email.</p>
      </div>
    `,
  });

  console.log(`OTP email sent via SMTP to ${email}`);
  return { channel: "smtp" };
}

export async function sendOtpEmail(email, code) {
  if (process.env.BREVO_API_KEY?.trim()) {
    return sendWithBrevo(email, code);
  }

  try {
    const smtp = await sendWithSmtp(email, code);
    if (smtp) return smtp;
  } catch (err) {
    console.error("SMTP failed:", err.message);
    throw Object.assign(
      new Error(
        "SMTP failed on this host. Set BREVO_API_KEY on Render for real email delivery."
      ),
      { statusCode: 502 }
    );
  }

  throw Object.assign(
    new Error("Set BREVO_API_KEY in Render Environment to send OTP emails"),
    { statusCode: 503 }
  );
}
