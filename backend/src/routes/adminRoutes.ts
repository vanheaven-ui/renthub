import { Router } from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import { authenticateAdmin } from '../middleware/adminAuthMiddleware';
import {
  getAllListings,
  updateListingStatus,
  deleteListing,
  getAllUsers,
} from '../controllers/adminController';

const router = Router();

// Protect all admin routes with both middleware
router.use(authenticateToken, authenticateAdmin);

router.get('/listings', getAllListings);
router.put('/listings/:id', updateListingStatus);
router.delete('/listings/:id', deleteListing);

router.get('/users', getAllUsers);

export default router;