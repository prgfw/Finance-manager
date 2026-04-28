import { useState, useEffect } from 'react';
import api from '../utils/api';
import { useBudgetStore, type Budget } from '../store/budgetStore';
import { Target, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCurrencyStore } from '../store/currencyStore';

const CATEGORIES = ['Food', 'Transport', 'Utilities', 'Entertainment', 'Shopping', 'Health', 'Other'];

const Budgets = () => {
  const { budgets, setBudgets, upsertBudget, removeBudget } = useBudgetStore();
  const { selectedCurrency, format: formatCurrency, toBase } = useCurrencyStore();
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [monthlyLimit, setMonthlyLimit] = useState('');

  useEffect(() => {
    const fetchBudgets = async () => {
      try {
        const { data } = await api.get('/budgets');
        setBudgets(data);
      } catch (error) {
        console.error('Failed to fetch budgets', error);
      } finally {
        setLoading(false);
      }
    };
    fetchBudgets();
  }, [setBudgets]);

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const amountInUSD = toBase(Number(monthlyLimit));
      const { data } = await api.post('/budgets', { category, monthlyLimit: amountInUSD });
      upsertBudget(data);
      setShowModal(false);
      toast.success('Budget saved successfully');
      setMonthlyLimit('');
    } catch (error) {
      toast.error('Failed to save budget');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this budget?')) return;
    try {
      await api.delete(`/budgets/${id}`);
      removeBudget(id);
      toast.success('Budget removed');
    } catch (error) {
      toast.error('Failed to delete budget');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Budgets</h1>
          <p className="text-gray-400 mt-1.5 font-medium">Set monthly limits to stay on track</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-2xl font-semibold transition-all flex items-center gap-2 active:scale-95 shadow-lg shadow-emerald-500/20"
        >
          <Plus className="h-5 w-5" />
          Add Budget
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-12 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div></div>
        ) : budgets.length > 0 ? (
          budgets.map((budget: Budget) => (
            <div key={budget._id} className="bg-[#1c1c24] border border-[#2A2A35] rounded-3xl p-6 shadow-sm hover:border-[#3A3A45] transition-colors relative group">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-[#2A2A35] rounded-2xl">
                  <Target className="h-6 w-6 text-emerald-400" />
                </div>
                <button 
                  onClick={() => handleDelete(budget._id)}
                  className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
              <h3 className="text-xl font-bold text-white mb-1">{budget.category}</h3>
              <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Monthly Limit</p>
              <p className="text-3xl font-black text-white">{formatCurrency(budget.monthlyLimit)}</p>
            </div>
          ))
        ) : (
          <div className="col-span-full bg-[#1c1c24] border border-[#2A2A35] rounded-3xl p-16 text-center text-gray-400">
            <Target className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p className="text-lg font-medium text-white mb-2">No budgets set</p>
            <p>Start tracking by setting your first monthly limit.</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#1c1c24] rounded-3xl shadow-2xl max-w-md w-full p-8 animate-slide-up border border-[#2A2A35]">
            <h2 className="text-2xl font-bold text-white mb-6">Set Budget Limit</h2>
            <form onSubmit={handleSaveBudget} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Category</label>
                <select className="w-full px-4 py-3 rounded-xl border border-[#2A2A35] bg-[#1A1A25] text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-colors appearance-none" value={category} onChange={e => setCategory(e.target.value)}>
                  {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Monthly Limit ({selectedCurrency.symbol})</label>
                <input type="number" required min="1" className="w-full px-4 py-3 rounded-xl border border-[#2A2A35] bg-[#1A1A25] text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-colors" value={monthlyLimit} onChange={e => setMonthlyLimit(e.target.value)} placeholder="500" />
              </div>
              <div className="pt-6 flex justify-end gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-3 text-sm font-semibold text-gray-400 hover:text-white hover:bg-[#2A2A35] rounded-xl transition-colors">
                  Cancel
                </button>
                <button type="submit" className="px-6 py-3 text-sm font-semibold text-white bg-emerald-500 hover:bg-emerald-600 rounded-xl shadow-md transition-all active:scale-95">
                  Save Budget
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Budgets;
