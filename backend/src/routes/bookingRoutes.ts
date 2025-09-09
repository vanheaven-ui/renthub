import { Router } from "express";
import { authenticateToken } from "../middleware/authMiddleware";
import {
  createBooking,
  getMyBookings,
  getBookingByListing,
  updateBookingStatus,
  getBookingById,
} from "../controllers/bookingController";

const router = Router();

router.post("/", authenticateToken, createBooking);
router.get("/my-bookings", authenticateToken, getMyBookings);
router.get("/by-listing/:listingId", authenticateToken, getBookingByListing);
router.get("/:id", authenticateToken, getBookingById);

// PATCH /bookings/:id/status
router.patch("/:id/status", authenticateToken, updateBookingStatus);

export default router;
