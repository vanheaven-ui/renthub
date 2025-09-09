import { Router } from "express";
import { getUserById } from "../controllers/userController";

const router = Router();

// Public route to get a user's profile by ID
router.get("/:userId", getUserById);

export default router;
