import express from 'express';
import { getBudgets, upsertBudget, deleteBudget } from '../controllers/budgetController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.route('/').get(protect, getBudgets).post(protect, upsertBudget);
router.route('/:id').delete(protect, deleteBudget);

export default router;
