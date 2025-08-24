import { Router } from "express";
import { initiatePayment, handleWebhook } from '../controllers/paymentController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

router.post('/initiate', authenticateToken, initiatePayment);
router.post('/webhook', handleWebhook);

export default router;