import { Router } from "express";
import { requestOtp, verifyOtp, getMe } from "../controllers/authController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.post("/otp/request", requestOtp);
router.post("/otp/verify", verifyOtp);
router.get("/me", requireAuth, getMe);

export default router;
