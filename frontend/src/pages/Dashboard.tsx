import { useEffect, useState, useMemo } from 'react';
import api from '../utils/api';
import { useExpenseStore, type Expense } from '../store/expenseStore';
import { useCurrencyStore } from '../store/currencyStore';
import { TrendingUp, TrendingDown, Wallet, Receipt, Plus, Flame, Target, AlertCircle } from 'lucide-react';
import { format, subDays, parseISO } from 'date-fns';
import { useBudgetStore } from '../store/budgetStore';
import { useLoanStore } from '../store/loanStore';
import { useAuthStore } from '../store/authStore';
import LineChart from '../components/charts/LineChart';
import PieChart from '../components/charts/PieChart';
import BarChart from '../components/charts/BarChart';
import AddTransactionModal from '../components/AddTransactionModal';

interface DashboardData {
  totalIncome: number;
  totalSpent: number;
  currentBalance: number;
  categoryData: Record<string, number>;
  totalExpenses: number;
  totalTransactions: number;
}

const Dashboard = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const { expenses, setExpenses } = useExpenseStore();
  const { format: formatCurrency, convert } = useCurrencyStore();
  const { budgets, setBudgets } = useBudgetStore();
  const { loans, setLoans } = useLoanStore();
  const { user } = useAuthStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'income' | 'expense'>('income');

  const openModal = (type: 'income' | 'expense') => {
    setModalType(type);
    setIsModalOpen(true);
  };


  const refreshData = async () => {
    try {
      const [analyticsRes, expensesRes, budgetsRes, loansRes] = await Promise.allSettled([
        api.get('/analytics'),
        api.get('/expenses'),
        api.get('/budgets'),
        api.get('/loans'),
      ]);

      if (analyticsRes.status === 'fulfilled') setData(analyticsRes.value.data);
      if (expensesRes.status === 'fulfilled') setExpenses(expensesRes.value.data);
      if (budgetsRes.status === 'fulfilled') setBudgets(budgetsRes.value.data);
      if (loansRes.status === 'fulfilled') setLoans(loansRes.value.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data', error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        await refreshData();
      } catch (error) {
        console.error('Failed to fetch dashboard data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [setExpenses]);


  const lineChartData = useMemo(() => {
    const last12Days = Array.from({ length: 12 }, (_, i) => {
      const d = subDays(new Date(), 11 - i);
      return format(d, 'yyyy-MM-dd');
    });
    const incomeValues = last12Days.map(dateStr =>
      convert(expenses.filter((e: Expense) => e.type === 'income' && format(parseISO(e.date), 'yyyy-MM-dd') === dateStr).reduce((s: number, e: Expense) => s + e.amount, 0))
    );
    const expenseValues = last12Days.map(dateStr =>
      convert(expenses.filter((e: Expense) => e.type === 'expense' && format(parseISO(e.date), 'yyyy-MM-dd') === dateStr).reduce((s: number, e: Expense) => s + e.amount, 0))
    );
    return { labels: last12Days.map(d => format(parseISO(d), 'dd MMM')), income: incomeValues, expenses: expenseValues };
  }, [expenses, convert]);

  const pieChartData = useMemo(() => {
    const categories = data ? Object.entries(data.categoryData) : [];
    return { labels: categories.map(([n]) => n), values: categories.map(([, v]) => convert(v)) };
  }, [data, convert]);

  const barChartData = useMemo(() => {
    const last10Days = Array.from({ length: 10 }, (_, i) => format(subDays(new Date(), 9 - i), 'yyyy-MM-dd'));
    return {
      labels: last10Days.map(d => format(parseISO(d), 'dd')),
      values: last10Days.map(dateStr =>
        convert(expenses.filter((e: Expense) => e.type === 'expense' && format(parseISO(e.date), 'yyyy-MM-dd') === dateStr).reduce((s: number, e: Expense) => s + e.amount, 0))
      ),
    };
  }, [expenses, convert]);

  const savingsPercent = data?.totalIncome ? Math.round((data.currentBalance / data.totalIncome) * 100) : 0;
  const burnPercent = data?.totalIncome ? Math.round((data.totalSpent / data.totalIncome) * 100) : 0;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh] gap-4 flex-col">
        <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p style={{ color: '#6B7280', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em' }}>SYNCING FINANCIALS</p>
      </div>
    );
  }

  return (
    <div>
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-white mb-1">
            Hello {user?.name ? user.name.split(' ')[0] : 'there'}!
          </h1>
          <h2 className="text-3xl font-black" style={{ color: '#22C55E' }}>Manage your finances.</h2>
          <p className="mt-2 text-sm" style={{ color: '#6B7280', maxWidth: 480 }}>
            Your income, expenses, and balance tracked in real time. Add income to get started.
          </p>
        </div>
        <button
          onClick={() => {
            import('../utils/export').then(module => {
              try {
                module.exportExpensesToCSV(expenses);
                import('react-hot-toast').then(toast => toast.default.success('Export downloaded!'));
              } catch (e: any) {
                console.error(e);
                import('react-hot-toast').then(toast => toast.default.error('Export failed: ' + e.message));
              }
            }).catch(e => {
              console.error(e);
              import('react-hot-toast').then(toast => toast.default.error('Failed to load export module'));
            });
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-80 border"
          style={{ background: '#1c1c24', color: '#fff', borderColor: '#2A2A35' }}
        >
          Export CSV
        </button>
      </div>

      {/* Stat Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 mb-6">
        {/* Balance */}
        <div className="vm-stat-card col-span-2 md:col-span-1 flex flex-col justify-between" style={{ background: '#1c1c24' }}>
          <div className="flex items-center justify-between mb-3">
            <span style={{ color: '#86efac', fontSize: 10, fontWeight: 800, letterSpacing: '0.1em' }}>BALANCE</span>
            <Wallet className="h-4 w-4" style={{ color: '#22C55E' }} />
          </div>
          <p className="text-2xl font-black text-white truncate">{formatCurrency(data?.currentBalance || 0)}</p>
        </div>

        {/* Total Income */}
        <div className="vm-stat-card flex flex-col justify-between" style={{ background: '#1c1c24' }}>
          <div className="flex items-center justify-between mb-3">
            <span style={{ color: '#93c5fd', fontSize: 10, fontWeight: 800, letterSpacing: '0.1em' }}>INCOME</span>
            <TrendingUp className="h-4 w-4" style={{ color: '#60A5FA' }} />
          </div>
          <p className="text-xl font-black text-white truncate">{formatCurrency(data?.totalIncome || 0)}</p>
        </div>

        {/* Total Expenses */}
        <div className="vm-stat-card flex flex-col justify-between" style={{ background: '#1c1c24' }}>
          <div className="flex items-center justify-between mb-3">
            <span style={{ color: '#d8b4fe', fontSize: 10, fontWeight: 800, letterSpacing: '0.1em' }}>EXPENSES</span>
            <TrendingDown className="h-4 w-4" style={{ color: '#A855F7' }} />
          </div>
          <p className="text-xl font-black text-white truncate">{formatCurrency(data?.totalSpent || 0)}</p>
        </div>

        {/* Transactions */}
        <div className="vm-stat-card flex flex-col justify-between" style={{ background: '#1c1c24' }}>
          <div className="flex items-center justify-between mb-3">
            <span style={{ color: '#fdba74', fontSize: 10, fontWeight: 800, letterSpacing: '0.1em' }}>TRANSACTIONS</span>
            <Receipt className="h-4 w-4" style={{ color: '#F97316' }} />
          </div>
          <p className="text-xl font-black text-white">{data?.totalTransactions || 0}</p>
        </div>

        {/* Savings % */}
        <div className="vm-stat-card flex flex-col justify-between" style={{ background: '#1c1c24' }}>
          <div className="flex items-center justify-between mb-3">
            <span style={{ color: '#67e8f9', fontSize: 10, fontWeight: 800, letterSpacing: '0.1em' }}>SAVINGS</span>
            <Flame className="h-4 w-4" style={{ color: '#22D3EE' }} />
          </div>
          <p className="text-xl font-black text-white">{savingsPercent}%</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-3 mb-8">
        <button
          onClick={() => openModal('income')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all hover:opacity-80"
          style={{ background: '#22C55E22', color: '#22C55E', border: '1px solid #22C55E44' }}
        >
          <TrendingUp className="h-3.5 w-3.5" /> Add Income
        </button>
        <button
          onClick={() => openModal('expense')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all hover:opacity-80"
          style={{ background: '#A855F722', color: '#A855F7', border: '1px solid #A855F744' }}
        >
          <TrendingDown className="h-3.5 w-3.5" /> Add Expense
        </button>
      </div>

      {/* Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT: Charts + Transactions */}
        <div className="lg:col-span-2 space-y-6">

          {/* Income vs Expenses Line Chart */}
          <div className="vm-card">
            <div className="flex justify-between items-center mb-5">
              <div>
                <h3 className="text-white font-black text-base">Income vs Expenses</h3>
                <p style={{ color: '#6B7280', fontSize: 10, fontWeight: 700 }}>LAST 12 DAYS</p>
              </div>
            </div>
            <div style={{ height: 220 }}>
              <LineChart data={lineChartData} title="Income vs Expenses" />
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="vm-card">
            <div className="flex justify-between items-center mb-5">
              <div>
                <h3 className="text-white font-black text-base">Recent Transactions</h3>
                <p style={{ color: '#6B7280', fontSize: 10, fontWeight: 700 }}>LATEST ACTIVITY</p>
              </div>
              <button
                onClick={() => openModal('expense')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:opacity-80"
                style={{ background: '#252530', color: '#A855F7' }}
              >
                <Plus className="h-3 w-3" /> Add
              </button>
            </div>
            <div className="space-y-2">
              {expenses.length === 0 ? (
                <div className="text-center py-10" style={{ color: '#6B7280' }}>
                  <p className="text-sm font-semibold">No transactions yet</p>
                  <p className="text-xs mt-1">Add your salary income to get started</p>
                </div>
              ) : (
                expenses.slice(0, 6).map((exp: Expense, i: number) => (
                  <div key={i} className="flex items-center justify-between px-3 py-2.5 rounded-xl transition-all" style={{ background: '#1E1E2A' }}>
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0"
                        style={{ 
                          background: exp.type === 'income' ? '#22C55E22' : '#A855F722',
                          color: exp.type === 'income' ? '#22C55E' : '#A855F7'
                        }}
                      >
                        {exp.type === 'income' ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                      </div>
                      <div>
                        <p className="text-white text-xs font-bold">{exp.title}</p>
                        <p style={{ color: '#6B7280', fontSize: 10 }}>{exp.category} · {format(parseISO(exp.date), 'MMM dd')}</p>
                      </div>
                    </div>
                    <span className="text-sm font-black" style={{ color: exp.type === 'income' ? '#22C55E' : '#fff' }}>
                      {exp.type === 'income' ? '+' : '-'}{formatCurrency(exp.amount)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* RIGHT: Finance Tracker Panel */}
        <div className="space-y-6">

          {/* Finance Tracker */}
          <div className="vm-card">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4" style={{ color: '#22C55E' }} />
              <h3 className="text-white font-black text-sm">Finance Tracker</h3>
            </div>
            <p style={{ color: '#6B7280', fontSize: 11 }} className="mb-5">Monitor your spending and reach your financial goals.</p>
            <div className="grid grid-cols-3 gap-2 mb-5">
              <div className="text-center p-2 rounded-xl" style={{ background: '#22C55E22', border: '1px solid #22C55E33' }}>
                <p className="text-white font-black text-sm truncate">{formatCurrency(data?.currentBalance || 0)}</p>
                <p style={{ color: '#22C55E', fontSize: 9, fontWeight: 700 }}>Balance</p>
              </div>
              <div className="text-center p-2 rounded-xl" style={{ background: '#60A5FA22', border: '1px solid #60A5FA33' }}>
                <p className="text-white font-black text-sm truncate">{formatCurrency(data?.totalIncome || 0)}</p>
                <p style={{ color: '#60A5FA', fontSize: 9, fontWeight: 700 }}>Income</p>
              </div>
              <div className="text-center p-2 rounded-xl" style={{ background: '#F9731622', border: '1px solid #F9731633' }}>
                <p className="text-white font-black text-sm truncate">{formatCurrency(data?.totalSpent || 0)}</p>
                <p style={{ color: '#F97316', fontSize: 9, fontWeight: 700 }}>Expenses</p>
              </div>
            </div>

            {/* Bar chart inside tracker */}
            <div style={{ height: 120 }} className="mb-4">
              <BarChart data={barChartData} title="Daily Expenses" />
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="vm-card">
            <h3 className="text-white font-black text-sm mb-1">Categories</h3>
            <p style={{ color: '#6B7280', fontSize: 11 }} className="mb-4">Expense distribution</p>
            <div style={{ height: 180 }}>
              <PieChart data={pieChartData} />
            </div>
          </div>

          {/* Budget Progress (Smart Alerts) */}
          <div className="vm-card">
            <h3 className="text-white font-black text-sm mb-1 flex items-center gap-2"><Target className="h-4 w-4 text-emerald-400"/> Budgets Limit</h3>
            <p style={{ color: '#6B7280', fontSize: 11 }} className="mb-4">Top spending vs limits</p>
            <div className="space-y-4">
              {budgets.length === 0 ? (
                <p className="text-xs" style={{ color: '#6B7280' }}>No budgets set. Create one to get smart alerts.</p>
              ) : (
                budgets.slice(0, 3).map(b => {
                  const spent = data?.categoryData?.[b.category] || 0;
                  const limit = b.monthlyLimit;
                  const percent = Math.min(Math.round((spent / limit) * 100), 100);
                  const isOver = spent > limit;
                  return (
                    <div key={b._id}>
                      <div className="flex justify-between mb-1.5">
                        <span className="text-xs font-semibold" style={{ color: isOver ? '#EF4444' : '#9CA3AF' }}>{b.category} {isOver && <AlertCircle className="inline h-3 w-3 ml-1"/>}</span>
                        <span className="text-white text-xs font-bold">{formatCurrency(spent)} / {formatCurrency(limit)}</span>
                      </div>
                      <div className="h-1.5 rounded-full" style={{ background: '#252530' }}>
                        <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${percent}%`, background: isOver ? '#EF4444' : '#22C55E' }} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Loan Summary */}
          {loans.length > 0 && (
            <div className="vm-card">
              <h3 className="text-white font-black text-sm mb-4">Loan Overview</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl" style={{ background: '#1E1E2A', border: '1px solid #252530' }}>
                  <p style={{ color: '#6B7280', fontSize: 10, fontWeight: 700 }}>ACTIVE LOANS</p>
                  <p className="text-white font-black text-lg">{loans.length}</p>
                </div>
                <div className="p-3 rounded-xl" style={{ background: '#1E1E2A', border: '1px solid #252530' }}>
                  <p style={{ color: '#6B7280', fontSize: 10, fontWeight: 700 }}>TOTAL PAYABLE</p>
                  <p className="text-white font-black text-lg truncate">{formatCurrency(loans.reduce((acc, l) => acc + l.totalPayable, 0))}</p>
                </div>
              </div>
            </div>
          )}

          {/* Insights */}
          <div className="vm-card">
            <h3 className="text-white font-black text-sm mb-4">Insights</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1.5">
                  <span style={{ color: '#9CA3AF', fontSize: 11 }}>Savings Rate</span>
                  <span className="text-white text-xs font-bold">{savingsPercent}%</span>
                </div>
                <div className="h-1.5 rounded-full" style={{ background: '#252530' }}>
                  <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${Math.max(0, Math.min(savingsPercent, 100))}%`, background: '#22C55E' }} />
                </div>
                <p style={{ color: '#6B7280', fontSize: 10 }} className="mt-1 italic">You saved {formatCurrency(data?.currentBalance || 0)} this month</p>
              </div>
              <div>
                <div className="flex justify-between mb-1.5">
                  <span style={{ color: '#9CA3AF', fontSize: 11 }}>Burn Rate</span>
                  <span className="text-white text-xs font-bold">{burnPercent}%</span>
                </div>
                <div className="h-1.5 rounded-full" style={{ background: '#252530' }}>
                  <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${Math.max(0, Math.min(burnPercent, 100))}%`, background: '#F97316' }} />
                </div>
                <p style={{ color: '#6B7280', fontSize: 10 }} className="mt-1 italic">You spent {burnPercent}% of your salary</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AddTransactionModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          refreshData();
        }}
        initialType={modalType}
      />
    </div>
  );
};

export default Dashboard;
