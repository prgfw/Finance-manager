import { Request, Response } from 'express';
import Loan from '../models/Loan';

// @desc    Get user loans
// @route   GET /api/loans
// @access  Private
export const getLoans = async (req: Request, res: Response): Promise<void> => {
  try {
    const loans = await Loan.find({ user: (req as any).user._id }).sort({ createdAt: -1 });
    res.json(loans);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Create a loan
// @route   POST /api/loans
// @access  Private
export const createLoan = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, principal, interestRate, timePeriod, interestType } = req.body;

    let totalInterest = 0;
    let totalPayable = 0;

    if (interestType === 'simple') {
      totalInterest = (principal * interestRate * timePeriod) / 100;
      totalPayable = principal + totalInterest;
    } else {
      // Compound Interest: A = P(1 + r/n)^(nt). Assuming compounded annually for simplicity here: A = P(1 + r/100)^t
      totalPayable = principal * Math.pow((1 + interestRate / 100), timePeriod);
      totalInterest = totalPayable - principal;
    }

    const loan = await Loan.create({
      user: (req as any).user._id,
      name,
      principal,
      interestRate,
      timePeriod,
      interestType,
      totalInterest,
      totalPayable
    });

    res.status(201).json(loan);
  } catch (error) {
    res.status(500).json({ message: 'Failed to save loan' });
  }
};

// @desc    Delete a loan
// @route   DELETE /api/loans/:id
// @access  Private
export const deleteLoan = async (req: Request, res: Response): Promise<void> => {
  try {
    const loan = await Loan.findById(req.params.id);

    if (!loan) {
      res.status(404).json({ message: 'Loan not found' });
      return;
    }

    if (loan.user.toString() !== (req as any).user._id.toString()) {
      res.status(401).json({ message: 'Not authorized' });
      return;
    }

    await loan.deleteOne();
    res.json({ message: 'Loan removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};
