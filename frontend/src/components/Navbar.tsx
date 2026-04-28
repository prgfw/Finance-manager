import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useCurrencyStore } from '../store/currencyStore';
import {
  LayoutDashboard,
  Receipt,
  CalendarDays,
  Target,
  Banknote,
  LineChart,
  LogOut,
  TrendingUp,
  ChevronDown
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { label: 'Dashboard',    icon: LayoutDashboard, path: '/' },
  { label: 'Transactions', icon: Receipt,         path: '/expenses' },
  { label: 'Budgets',      icon: Target,          path: '/budgets' },
  { label: 'Loans',        icon: Banknote,        path: '/loans' },
  { label: 'Investments',  icon: LineChart,       path: '/investments' },
  { label: 'Calendar',     icon: CalendarDays,    path: '/calendar' },
];

const Sidebar = () => {
  const { user, logout } = useAuthStore();
  const { selectedCurrency, setCurrency, currencies } = useCurrencyStore();
  const navigate = useNavigate();
  const [showCurrency, setShowCurrency] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside
      className="fixed top-0 left-0 h-screen w-56 flex flex-col z-30"
      style={{ background: '#1c1c24', borderRight: '1px solid #2A2A35' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 px-5 py-6">
        <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
          <TrendingUp className="h-4 w-4 text-emerald-400" />
        </div>
        <span className="text-white font-black tracking-tight text-lg">FinanceFlow</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto no-scrollbar">
        {navItems.map(({ label, icon: Icon, path }) => (
          <NavLink
            key={path}
            to={path}
            end={path === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                isActive
                  ? 'bg-[#2A2A35] text-emerald-400'
                  : 'text-gray-400 hover:text-white hover:bg-[#2A2A35]'
              }`
            }
          >
            <Icon className="h-4 w-4 flex-shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Currency Selector */}
      <div className="px-3 py-3 border-t border-[#1E1E2A]">
        <div className="relative">
          <button
            onClick={() => setShowCurrency(s => !s)}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-[#1A1A25] border border-[#252530] text-xs text-gray-300 font-bold hover:bg-[#21212E] transition-colors"
          >
            <span>{selectedCurrency.symbol} {selectedCurrency.code}</span>
            <ChevronDown className={`h-3 w-3 transition-transform ${showCurrency ? 'rotate-180' : ''}`} />
          </button>
          {showCurrency && (
            <div className="absolute bottom-12 left-0 right-0 bg-[#1A1A25] border border-[#252530] rounded-xl overflow-hidden shadow-xl z-50">
              {currencies.map(c => (
                <button
                  key={c.code}
                  onClick={() => { setCurrency(c.code); setShowCurrency(false); }}
                  className={`w-full text-left px-3 py-2 text-xs font-semibold transition-colors ${selectedCurrency.code === c.code ? 'text-emerald-400 bg-emerald-500/10' : 'text-gray-300 hover:bg-white/5'}`}
                >
                  {c.symbol} {c.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* User + Logout */}
      <div className="px-3 py-4 border-t border-[#1E1E2A]">
        <div className="flex items-center gap-3 mb-3 px-1">
          <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 text-xs font-black flex-shrink-0">
            {(user?.name || '').charAt(0).toUpperCase()}
          </div>
          <div className="overflow-hidden">
            <p className="text-white text-xs font-bold truncate">{user?.name}</p>
            <p className="text-gray-500 text-[10px] truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <LogOut className="h-3.5 w-3.5" /> Sign Out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
