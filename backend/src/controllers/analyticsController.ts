

import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import Expense from '../models/Expense';


export const getAnalytics = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const expenses = await Expense.find({ user: req.user._id });

    let totalIncome = 0;
    let totalSpent = 0;

   
    const categoryData: Record<string, number> = {};
    expenses.forEach(expense => {
      if (expense.type === 'income') {
        totalIncome += expense.amount;
      } else {
        totalSpent += expense.amount;
        categoryData[expense.category] = (categoryData[expense.category] || 0) + expense.amount;
      }
    });

    res.json({
      totalIncome,
      totalSpent,
      currentBalance: totalIncome - totalSpent,
      categoryData,
      totalExpenses: expenses.filter(e => e.type === 'expense').length,
      totalTransactions: expenses.length,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};
