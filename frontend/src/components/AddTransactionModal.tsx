import { useState, type FormEvent } from 'react';
import api from '../utils/api';
import { useExpenseStore } from '../store/expenseStore';
import { useCurrencyStore } from '../store/currencyStore';
import { useBudgetStore } from '../store/budgetStore';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';

const EXPENSE_CATEGORIES = ['Food', 'Transport', 'Utilities', 'Entertainment', 'Shopping', 'Health', 'Other'];
const INCOME_CATEGORIES = ['Salary', 'Bank Balance', 'Freelance', 'Business', 'Bonus', 'Other'];

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: 'income' | 'expense';
}

const AddTransactionModal = ({ isOpen, onClose, initialType = 'expense' }: AddTransactionModalProps) => {
  const { expenses, addExpense } = useExpenseStore();
  const { selectedCurrency, toBase } = useCurrencyStore();
  const budgets = useBudgetStore(state => state.budgets);

  const [type, setType] = useState<'income' | 'expense'>(initialType);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(initialType === 'income' ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  // Ensure category resets cleanly if shifting types
  const handleTypeChange = (newType: 'income' | 'expense') => {
    setType(newType);
    setCategory(newType === 'income' ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0]);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const amountInUSD = toBase(Number(amount));
      const { data } = await api.post('/expenses', { type, title, amount: amountInUSD, category, date });
      addExpense(data);

      if (type === 'expense') {
        const budget = budgets.find(b => b.category === category);
        if (budget) {
          const currentSpent = expenses
            .filter(exp => exp.type === 'expense' && exp.category === category)
            .reduce((sum, exp) => sum + exp.amount, 0);
          
          if (currentSpent + amountInUSD > budget.monthlyLimit) {
            toast.error(`Alert: You have exceeded your budget limit for ${category}!`, {
              icon: '⚠️',
              duration: 5000,
            });
          }
        }
      }

      toast.success('Transaction added');
      onClose();
      // Reset form
      setTitle(''); setAmount(''); setDate(new Date().toISOString().split('T')[0]);
    } catch (error) {
      toast.error('Failed to add transaction');
      console.error('Failed to add transaction', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 dark:bg-black/80">
      <div className="bg-white dark:bg-[#1E1E2A] rounded-xl shadow-lg max-w-md w-full p-8 border border-gray-100 dark:border-[#2A2A35] relative">
        
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <X className="h-6 w-6" />
        </button>

        <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-6">New Transaction</h2>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Type Toggle */}
          <div className="flex bg-gray-100 dark:bg-[#262626] p-1 rounded-xl mb-6">
            <button 
              type="button"
              onClick={() => handleTypeChange('expense')}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${type === 'expense' ? 'bg-white dark:bg-[#1F1F1F] text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
            >
              Expense
            </button>
            <button 
              type="button"
              onClick={() => handleTypeChange('income')}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${type === 'income' ? 'bg-white dark:bg-[#2A2A35] text-emerald-600 dark:text-emerald-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
            >
              Income
            </button>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Description</label>
            <input 
              type="text" 
              required 
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-[#262626] focus:ring-2 focus:ring-purple-500 dark:bg-[#151515] dark:text-white outline-none transition-colors" 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              placeholder={type === 'income' ? "Monthly Salary, Freelance project..." : "Grocery run, Uber ride..."} 
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">
              Amount ({selectedCurrency.symbol})
            </label>
            <input 
              type="number" 
              step="0.01" 
              min="0" 
              required 
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-[#262626] focus:ring-2 focus:ring-purple-500 dark:bg-[#151515] dark:text-white outline-none transition-colors" 
              value={amount} 
              onChange={e => setAmount(e.target.value)} 
              placeholder="0.00" 
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Category</label>
            <select 
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-[#262626] focus:ring-2 focus:ring-purple-500 dark:bg-[#151515] dark:text-white outline-none transition-colors appearance-none" 
              value={category} 
              onChange={e => setCategory(e.target.value)}
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Date</label>
            <input 
              type="date" 
              required 
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-[#262626] focus:ring-2 focus:ring-purple-500 dark:bg-[#151515] dark:text-white outline-none transition-colors" 
              value={date} 
              onChange={e => setDate(e.target.value)} 
            />
          </div>

          <div className="pt-6 flex justify-end gap-3">
            <button 
              type="button" 
              onClick={onClose} 
              disabled={loading}
              className="px-6 py-3 text-[10px] uppercase font-black tracking-widest text-gray-400 border border-gray-200 dark:border-[#262626] hover:bg-gray-100 dark:hover:bg-[#262626] rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className={`px-6 py-3 text-[10px] uppercase font-black tracking-widest text-white rounded-xl transition-all flex items-center gap-2 ${type === 'income' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-purple-600 hover:bg-purple-700'}`}
            >
              {loading ? 'Saving...' : 'Save Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTransactionModal;
