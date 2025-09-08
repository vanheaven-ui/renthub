// routes/messageRoutes.ts
import { Router } from "express";
import {
  getBookingMessages,
  sendMessage,
  getUnreadMessages,
  markMessagesAsRead,
  getUnreadMessagesBatch,
  getOnlineStatus,
} from "../controllers/messageController";
import { authenticateToken } from "../middleware/authMiddleware";

const router = Router();

// fetch all messages for a booking
router.get("/:bookingId", authenticateToken, getBookingMessages);

// send a new message
router.post("/", authenticateToken, sendMessage);

// get unread messages count for current user in a booking
router.get("/:bookingId/unread", authenticateToken, getUnreadMessages);

// mark messages as read
router.patch("/:bookingId/read", authenticateToken, markMessagesAsRead);

router.post("/unread/batch", authenticateToken, getUnreadMessagesBatch);

router.get("/online-status/:userId", authenticateToken, getOnlineStatus);

export default router;
