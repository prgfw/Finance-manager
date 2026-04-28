import { type ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import { useAuthStore } from './store/authStore';

import Dashboard from './pages/Dashboard';
import Expenses from './pages/Expenses';
import CalendarPage from './pages/CalendarPage';
import Budgets from './pages/Budgets';
import Loans from './pages/Loans';
import Investments from './pages/Investments';
import Auth from './pages/Auth';

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const user = useAuthStore(state => state.user);
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

import { ThemeProvider } from './context/ThemeContext';
import { Toaster } from 'react-hot-toast';
import { useCurrencyStore } from './store/currencyStore';
import { useEffect } from 'react';

function App() {
  const fetchRates = useCurrencyStore(state => state.fetchRates);

  useEffect(() => {
    fetchRates();
  }, [fetchRates]);

  return (
    <ThemeProvider>
      <Toaster position="top-right" />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Auth />} />
          <Route path="/register" element={<Auth />} />
          
          <Route path="/" element={<Layout />}>
            <Route index element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="expenses" element={<ProtectedRoute><Expenses /></ProtectedRoute>} />
            <Route path="calendar" element={<ProtectedRoute><CalendarPage /></ProtectedRoute>} />
            <Route path="budgets" element={<ProtectedRoute><Budgets /></ProtectedRoute>} />
            <Route path="loans" element={<ProtectedRoute><Loans /></ProtectedRoute>} />
            <Route path="investments" element={<ProtectedRoute><Investments /></ProtectedRoute>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
