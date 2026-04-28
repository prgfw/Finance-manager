import express from 'express';
import { getLoans, createLoan, deleteLoan } from '../controllers/loanController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.route('/').get(protect, getLoans).post(protect, createLoan);
router.route('/:id').delete(protect, deleteLoan);

export default router;
