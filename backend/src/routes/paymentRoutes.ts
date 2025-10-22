import { Router } from "express";
import {
  initiatePayment,
  generatePaymentOtp,
  verifyOtp,
} from "../controllers/paymentController";
import { authenticateToken } from "../middleware/authMiddleware";

const router = Router();

// ----------------- Routes -----------------

// Generate OTP for payment (sandbox/testing or pre-authorization)
router.post("/generate-otp", authenticateToken, generatePaymentOtp);

// Initiate real Mobile Money payment via Flutterwave
router.post("/initiate", authenticateToken, initiatePayment);

// Verify OTP entered by user
router.post("/verify-otp", authenticateToken, verifyOtp);

// Optional webhook route for Flutterwave (if needed in future)
// router.post("/webhook", handleWebhook);

export default router;
