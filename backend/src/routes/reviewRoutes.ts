import { Router } from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import { createReview, getListingReviews } from '../controllers/reviewController';

const router = Router();

router.post('/', authenticateToken, createReview);
router.get('/:listingId', getListingReviews);

export default router;