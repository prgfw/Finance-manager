import { Request, Response } from 'express';
import Budget from '../models/Budget';

// @desc    Get user budgets
// @route   GET /api/budgets
// @access  Private
export const getBudgets = async (req: Request, res: Response): Promise<void> => {
  try {
    const budgets = await Budget.find({ user: (req as any).user._id });
    res.json(budgets);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Create or update a budget
// @route   POST /api/budgets
// @access  Private
export const upsertBudget = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, monthlyLimit } = req.body;
    const userId = (req as any).user._id;

    let budget = await Budget.findOne({ user: userId, category });
    if (budget) {
      budget.monthlyLimit = monthlyLimit;
      await budget.save();
    } else {
      budget = await Budget.create({ user: userId, category, monthlyLimit });
    }

    res.status(200).json(budget);
  } catch (error) {
    res.status(500).json({ message: 'Failed to save budget' });
  }
};

// @desc    Delete a budget
// @route   DELETE /api/budgets/:id
// @access  Private
export const deleteBudget = async (req: Request, res: Response): Promise<void> => {
  try {
    const budget = await Budget.findById(req.params.id);

    if (!budget) {
      res.status(404).json({ message: 'Budget not found' });
      return;
    }

    if (budget.user.toString() !== (req as any).user._id.toString()) {
      res.status(401).json({ message: 'Not authorized' });
      return;
    }

    await budget.deleteOne();
    res.json({ message: 'Budget removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};
