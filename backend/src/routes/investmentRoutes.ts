import express from 'express';
import { getInvestments } from '../controllers/investmentController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

// Fetch live investment data (requires auth)
router.get('/', protect, getInvestments);

export default router;
