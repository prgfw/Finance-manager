import { create } from 'zustand';

export interface Loan {
  _id: string;
  name: string;
  principal: number;
  interestRate: number;
  timePeriod: number;
  interestType: 'simple' | 'compound';
  totalInterest: number;
  totalPayable: number;
}

interface LoanState {
  loans: Loan[];
  setLoans: (loans: Loan[]) => void;
  addLoan: (loan: Loan) => void;
  removeLoan: (id: string) => void;
}

export const useLoanStore = create<LoanState>((set) => ({
  loans: [],
  setLoans: (loans) => set({ loans }),
  addLoan: (loan) => set((state) => ({ loans: [loan, ...state.loans] })),
  removeLoan: (id) => set((state) => ({ loans: state.loans.filter(l => l._id !== id) })),
}));
