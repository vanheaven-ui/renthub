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

const router = Router({ mergeParams: true });

// Get all messages for a booking
router.get("/:bookingId/messages", authenticateToken, getBookingMessages);

// Send a message for a booking
router.post("/:bookingId/messages", authenticateToken, sendMessage);

// Get unread messages for a booking
router.get("/:bookingId/messages/unread", authenticateToken, getUnreadMessages);

// Mark messages as read
router.patch(
  "/:bookingId/messages/read",
  authenticateToken,
  markMessagesAsRead
);

// Batch unread messages (optional)
router.post(
  "/unread/batch",
  authenticateToken,
  getUnreadMessagesBatch
);

// Online status
router.get("/online-status/:userId", authenticateToken, getOnlineStatus);

export default router;
