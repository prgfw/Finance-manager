import { useEffect, useState, type FormEvent } from 'react';
import api from '../utils/api';
import { useExpenseStore, type Expense } from '../store/expenseStore';
import { Plus, Trash2, Search, TrendingUp, TrendingDown } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useCurrencyStore } from '../store/currencyStore';
import { useBudgetStore } from '../store/budgetStore';
import toast from 'react-hot-toast';

const EXPENSE_CATEGORIES = ['Food', 'Transport', 'Utilities', 'Entertainment', 'Shopping', 'Health', 'Other'];
const INCOME_CATEGORIES  = ['Salary', 'Bank Balance', 'Freelance', 'Business', 'Bonus', 'Other'];

const Expenses = () => {
  const { expenses, setExpenses, addExpense, removeExpense } = useExpenseStore();
  const { selectedCurrency, format: formatCurrency, toBase } = useCurrencyStore();
  const budgets = useBudgetStore(state => state.budgets);

  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');

  // Form state
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        const { data } = await api.get('/expenses');
        setExpenses(data);
      } catch (error) {
        console.error('Failed to fetch expenses', error);
      } finally {
        setLoading(false);
      }
    };
    fetchExpenses();
  }, [setExpenses]);

  const handleAddExpense = async (e: FormEvent) => {
    e.preventDefault();
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
      setShowModal(false);
      setTitle(''); setAmount(''); setDate(new Date().toISOString().split('T')[0]);
    } catch (error) {
      toast.error('Failed to add transaction');
      console.error('Failed to add expense', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this transaction?')) return;
    try {
      await api.delete(`/expenses/${id}`);
      removeExpense(id);
    } catch (error) {
      console.error('Failed to delete expense', error);
    }
  };

  const filtered = expenses.filter((exp: Expense) => {
    const matchSearch = exp.title.toLowerCase().includes(searchTerm.toLowerCase()) || exp.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = filterType === 'all' || exp.type === filterType;
    return matchSearch && matchType;
  });

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-white">Transactions</h1>
          <p style={{ color: '#6B7280', fontSize: 12 }}>Manage all your income and expenses</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-80"
          style={{ background: '#2A2A35', color: '#22C55E' }}
        >
          <Plus className="h-4 w-4" /> New Transaction
        </button>
      </div>

      {/* Controls */}
      <div className="vm-card mb-4 flex flex-col sm:flex-row gap-3 p-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: '#4B5563' }} />
          <input
            type="text"
            placeholder="Search by title or category..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm text-white outline-none transition-colors"
            style={{ background: '#1E1E2A', border: '1px solid #252530' }}
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'income', 'expense'] as const).map(t => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className="px-3 py-2 rounded-xl text-xs font-bold capitalize transition-all"
              style={{
                background: filterType === t ? '#2A2A35' : '#1E1E2A',
                color: filterType === t ? (t === 'income' ? '#22C55E' : t === 'expense' ? '#A855F7' : '#fff') : '#6B7280',
                border: '1px solid #2A2A35'
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="vm-card p-0 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid #252530' }}>
                  {['Transaction', 'Category', 'Date', 'Amount', ''].map(h => (
                    <th key={h} className="px-5 py-4 text-left" style={{ color: '#6B7280', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((expense: Expense) => (
                  <tr key={expense._id} className="group transition-colors border-b border-[#2A2A35] hover:bg-[#2A2A35]" >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ background: expense.type === 'income' ? '#22C55E22' : '#A855F722', color: expense.type === 'income' ? '#22C55E' : '#A855F7' }}
                        >
                          {expense.type === 'income' ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                        </div>
                        <span className="text-white text-sm font-semibold">{expense.title}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                        style={{ background: '#252530', color: '#9CA3AF' }}
                      >{expense.category}</span>
                    </td>
                    <td className="px-5 py-4 text-sm" style={{ color: '#6B7280' }}>
                      {format(parseISO(expense.date), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-5 py-4 text-sm font-black" style={{ color: expense.type === 'income' ? '#22C55E' : '#fff' }}>
                      {expense.type === 'income' ? '+' : '-'}{formatCurrency(expense.amount)}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => handleDelete(expense._id)}
                        className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                        style={{ color: '#6B7280' }}
                        onMouseEnter={e => (e.currentTarget.style.color = '#EF4444')}
                        onMouseLeave={e => (e.currentTarget.style.color = '#6B7280')}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16" style={{ color: '#6B7280' }}>
            <TrendingUp className="h-10 w-10 mb-3 opacity-30" />
            <p className="font-semibold text-sm">No transactions found</p>
            <p className="text-xs mt-1">Try a different search or add a new transaction</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="rounded-2xl w-full max-w-md p-7 animate-slide-up" style={{ background: '#16161F', border: '1px solid #252530' }}>
            <h2 className="text-xl font-black text-white mb-6">New Transaction</h2>
            <form onSubmit={handleAddExpense} className="space-y-4">
              {/* Toggle */}
              <div className="flex p-1 rounded-xl gap-1" style={{ background: '#252530' }}>
                {(['expense', 'income'] as const).map(t => (
                  <button
                    type="button" key={t}
                    onClick={() => { setType(t); setCategory(t === 'income' ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0]); }}
                    className="flex-1 py-2 text-sm font-bold rounded-lg capitalize transition-all"
                    style={{ background: type === t ? '#1F1F2E' : 'transparent', color: type === t ? (t === 'income' ? '#22C55E' : '#A855F7') : '#6B7280' }}
                  >{t}</button>
                ))}
              </div>

              {[
                { label: 'Description', id: 'title', type: 'text', value: title, onChange: (v: string) => setTitle(v), placeholder: type === 'income' ? 'Monthly Salary...' : 'Grocery run...' },
              ].map(f => (
                <div key={f.id}>
                  <label className="block text-xs font-bold mb-1.5" style={{ color: '#9CA3AF' }}>{f.label}</label>
                  <input required type={f.type} value={f.value} onChange={e => f.onChange(e.target.value)}
                    placeholder={f.placeholder}
                    className="w-full px-4 py-2.5 rounded-xl text-sm text-white outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                    style={{ background: '#1E1E2A', border: '1px solid #252530' }}
                  />
                </div>
              ))}

              <div>
                <label className="block text-xs font-bold mb-1.5" style={{ color: '#9CA3AF' }}>Amount ({selectedCurrency.symbol})</label>
                <input required type="number" step="0.01" min="0" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00"
                  className="w-full px-4 py-2.5 rounded-xl text-sm text-white outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                  style={{ background: '#1E1E2A', border: '1px solid #252530' }}
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1.5" style={{ color: '#9CA3AF' }}>Category</label>
                <select value={category} onChange={e => setCategory(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl text-sm text-white outline-none transition-all appearance-none"
                  style={{ background: '#1E1E2A', border: '1px solid #252530' }}
                >
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1.5" style={{ color: '#9CA3AF' }}>Date</label>
                <input required type="date" value={date} onChange={e => setDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl text-sm text-white outline-none transition-all"
                  style={{ background: '#1E1E2A', border: '1px solid #252530' }}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all"
                  style={{ background: '#252530', color: '#9CA3AF' }}
                >Cancel</button>
                <button type="submit"
                  className="flex-1 py-2.5 rounded-xl text-sm font-black transition-all"
                  style={{ background: type === 'income' ? '#22C55E' : '#A855F7', color: '#fff' }}
                >Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expenses;
