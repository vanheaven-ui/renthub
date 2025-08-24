import { Router } from "express";
import { getBookingMessages } from "../controllers/messageController";
import { authenticateToken } from "../middleware/authMiddleware";

const router = Router();

router.get("/:bookingId", authenticateToken, getBookingMessages);

export default router;
