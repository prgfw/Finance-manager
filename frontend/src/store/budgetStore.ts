import { create } from 'zustand';

export interface Budget {
  _id: string;
  category: string;
  monthlyLimit: number;
}

interface BudgetState {
  budgets: Budget[];
  setBudgets: (budgets: Budget[]) => void;
  upsertBudget: (budget: Budget) => void;
  removeBudget: (id: string) => void;
}

export const useBudgetStore = create<BudgetState>((set) => ({
  budgets: [],
  setBudgets: (budgets) => set({ budgets }),
  upsertBudget: (budget) => set((state) => {
    const exists = state.budgets.find(b => b.category === budget.category);
    if (exists) {
      return { budgets: state.budgets.map(b => b.category === budget.category ? budget : b) };
    }
    return { budgets: [...state.budgets, budget] };
  }),
  removeBudget: (id) => set((state) => ({ budgets: state.budgets.filter(b => b._id !== id) })),
}));
