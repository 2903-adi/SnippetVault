import dns from "dns/promises";
import nodemailer from "nodemailer";

async function sendWithBrevo(email, code) {
  const apiKey = process.env.BREVO_API_KEY?.trim();
  if (!apiKey) return null;

  const senderEmail = (process.env.MAIL_FROM || process.env.SMTP_USER || "").trim();
  if (!senderEmail) {
    throw Object.assign(new Error("MAIL_FROM or SMTP_USER required for Brevo"), {
      statusCode: 503,
    });
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
          <p style="font-size: 28px; letter-spacing: 6px; font-weight: 700;">${code}</p>
          <p>This code expires in 10 minutes.</p>
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
  return payload;
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
  const info = await transporter.sendMail({
    from,
    to: email,
    subject: "Your SnippetVault login code",
    text: `Your SnippetVault verification code is ${code}. It expires in 10 minutes.`,
    html: `
      <div style="font-family: sans-serif; line-height: 1.5; color: #0b1f1c;">
        <h2>SnippetVault</h2>
        <p>Your login code is:</p>
        <p style="font-size: 28px; letter-spacing: 6px; font-weight: 700;">${code}</p>
        <p>This code expires in 10 minutes.</p>
      </div>
    `,
  });

  console.log(`OTP email sent via SMTP to ${email}`);
  return info;
}

export async function sendOtpEmail(email, code) {
  try {
    const brevo = await sendWithBrevo(email, code);
    if (brevo) return { channel: "brevo" };
  } catch (err) {
    console.error("Brevo failed:", err.message);
    if (!process.env.SMTP_HOST) throw err;
  }

  try {
    const smtp = await sendWithSmtp(email, code);
    if (smtp) return { channel: "smtp" };
  } catch (err) {
    console.error("SMTP failed:", err.message);
    throw Object.assign(
      new Error(err.message || "Could not send email"),
      { statusCode: 502 }
    );
  }

  throw Object.assign(
    new Error("No email provider configured. Set BREVO_API_KEY (recommended on Render) or SMTP_*"),
    { statusCode: 503 }
  );
}
