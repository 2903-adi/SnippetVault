import { Otp } from "../models/Otp.js";
import { User } from "../models/User.js";
import { sendOtpEmail } from "../utils/mailer.js";
import { signToken } from "../middleware/auth.js";

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function isValidEmail(email) {
  return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export async function requestOtp(req, res, next) {
  try {
    const email = req.body.email?.trim().toLowerCase();

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        error: "A valid email is required",
      });
    }

    const code = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await Otp.deleteMany({ email });
    await Otp.create({ email, code, expiresAt });

    try {
      const result = await sendOtpEmail(email, code);
      return res.json({
        success: true,
        data: {
          message: "OTP sent to your email",
          email,
          channel: result.channel,
        },
      });
    } catch (mailErr) {
      console.error("Failed to send OTP email:", mailErr.message);
      return res.json({
        success: true,
        data: {
          message:
            "Email could not be sent from the server (SMTP blocked on free hosting). Use the code below.",
          email,
          devOtp: code,
        },
      });
    }
  } catch (err) {
    next(err);
  }
}

export async function verifyOtp(req, res, next) {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const code = req.body.code?.trim();

    if (!isValidEmail(email) || !code) {
      return res.status(400).json({
        success: false,
        error: "Email and OTP code are required",
      });
    }

    const otp = await Otp.findOne({ email, code });

    if (!otp || otp.expiresAt <= new Date()) {
      return res.status(400).json({
        success: false,
        error: "Invalid or expired OTP",
      });
    }

    await Otp.deleteMany({ email });

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        email,
        name: email.split("@")[0],
      });
    }

    const token = signToken(user);

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getMe(req, res) {
  res.json({
    success: true,
    data: {
      id: req.user._id,
      email: req.user.email,
      name: req.user.name,
    },
  });
}
