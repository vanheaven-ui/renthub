import { Router } from "express";
import { authenticateToken } from "../middleware/authMiddleware";
import {
  createBooking,
  getMyBookings,
  getBookingByListing,
} from "../controllers/bookingController";

const router = Router();

// Routes that require authentication
router.post("/", authenticateToken, createBooking);
router.get("/my-bookings", authenticateToken, getMyBookings);
// GET /bookings/by-listing/:listingId?userId=xxx
router.get("/by-listing/:listingId", authenticateToken, getBookingByListing);

export default router;
