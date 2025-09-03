import { Router } from "express";
import { register, login, logout, getMe } from "../controllers/authController";
import { authenticateToken } from "../middleware/authMiddleware";
import {
  loginLimiter,
  registerLimiter,
} from "../middleware/rateLimitMiddleware";

const router = Router();

// Public Routes
router.post("/register", registerLimiter, register);
router.post("/login", loginLimiter, login);

// Protected Routes (These require a valid token)
router.get("/me", authenticateToken, getMe);
router.post("/logout", authenticateToken, logout);

export default router;
