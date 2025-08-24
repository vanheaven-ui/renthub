import { Router } from "express";
import { register, login, logout } from "../controllers/authController";
import {
  loginLimiter,
  registerLimiter,
} from "../middleware/rateLimitMiddleware";

const router = Router();

router.post("/register", registerLimiter, register);
router.post("/login", loginLimiter, login);
router.post("/logout", logout);

export default router;
