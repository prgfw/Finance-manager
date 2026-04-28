import { Request, Response } from 'express';
import User from '../models/User';

// @desc    Update user base currency
// @route   PUT /api/auth/currency
// @access  Private
export const updateCurrency = async (req: Request, res: Response): Promise<void> => {
  try {
    const { currency } = req.body;
    
    if (!currency) {
      res.status(400).json({ message: 'Currency is required' });
      return;
    }

    const user = await User.findByIdAndUpdate(
      (req as any).user._id,
      { baseCurrency: currency },
      { new: true }
    ).select('-password');

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};
