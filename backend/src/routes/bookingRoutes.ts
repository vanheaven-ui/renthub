import { Router } from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import { createBooking, getMyBookings } from '../controllers/bookingController';

const router = Router();

// Routes that require authentication
router.post('/', authenticateToken, createBooking);
router.get('/my-bookings', authenticateToken, getMyBookings);

export default router;