import express from 'express';
import { registerUser, loginUser } from '../controllers/authController';
import { updateCurrency } from '../controllers/userController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.put('/currency', protect, updateCurrency);

export default router;
