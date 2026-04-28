import { useState, useEffect, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../utils/api';
import { TrendingUp, ArrowRight, Loader2 } from 'lucide-react';

const Auth = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const loginFn = useAuthStore((state) => state.login);

  // Initialize state based on current route
  const [isLogin, setIsLogin] = useState(location.pathname === '/login');
  
  // Update URL and state when toggling
  const toggleMode = () => {
    const newIsLogin = !isLogin;
    setIsLogin(newIsLogin);
    navigate(newIsLogin ? '/login' : '/register', { replace: true });
    setError('');
  };

  // Sync state if navigation happens externally
  useEffect(() => {
    setIsLogin(location.pathname === '/login');
  }, [location.pathname]);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        const { data } = await api.post('/auth/login', { email, password });
        loginFn({ _id: data._id, name: data.name, email: data.email }, data.token);
      } else {
        const { data } = await api.post('/auth/register', { name, email, password });
        loginFn({ _id: data._id, name: data.name, email: data.email }, data.token);
      }
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || `Failed to ${isLogin ? 'login' : 'register'}. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-[#1E212B] text-white font-sans overflow-hidden">
      
      {/* LEFT SIDE - FORM */}
      <div className="w-full lg:w-1/2 flex flex-col p-8 sm:p-12 lg:p-16 relative z-10">
        
        {/* Top Nav */}
        <div className="flex items-center gap-8 mb-auto">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[#1E90FF]"></div>
            <span className="font-bold text-lg tracking-tight">FinanceFlow.</span>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-md w-full mx-auto my-auto animate-fade-in">
          
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-4">
            {isLogin ? "WELCOME BACK" : "START FOR FREE"}
          </p>
          
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
            {isLogin ? "Sign in to account" : "Create new account"}
            <span className="text-[#1E90FF]">.</span>
          </h1>
          
          <p className="text-sm font-medium text-gray-400 mb-10">
            {isLogin ? "Don't have an account? " : "Already A Member? "}
            <button onClick={toggleMode} className="text-[#1E90FF] font-bold hover:text-blue-400 transition-colors">
              {isLogin ? "Sign Up" : "Log In"}
            </button>
          </p>

          {error && (
            <div className="mb-6 px-4 py-3 rounded-xl text-sm font-bold bg-red-500/10 text-red-400 border border-red-500/20">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <div className="absolute top-2 left-4 text-[10px] text-gray-500 font-bold">First name</div>
                  <input required type="text" value={name.split(' ')[0] || ''} onChange={e => setName(e.target.value + ' ' + (name.split(' ')[1] || ''))} className="w-full bg-[#292D3E] border border-transparent focus:border-[#1E90FF] rounded-xl px-4 pt-6 pb-2 text-sm outline-none transition-all" />
                </div>
                <div className="flex-1 relative">
                  <div className="absolute top-2 left-4 text-[10px] text-gray-500 font-bold">Last name</div>
                  <input required type="text" value={name.split(' ')[1] || ''} onChange={e => setName((name.split(' ')[0] || '') + ' ' + e.target.value)} className="w-full bg-[#292D3E] border border-transparent focus:border-[#1E90FF] rounded-xl px-4 pt-6 pb-2 text-sm outline-none transition-all" />
                </div>
              </div>
            )}

            <div className="relative">
              <div className="absolute top-2 left-4 text-[10px] text-gray-500 font-bold">Email</div>
              <input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="michal.masiak@anywhere.co" className="w-full bg-[#292D3E] border border-transparent focus:border-[#1E90FF] rounded-xl px-4 pt-6 pb-2 text-sm outline-none transition-all placeholder-gray-600" />
            </div>

            <div className="relative">
              <div className="absolute top-2 left-4 text-[10px] text-[#1E90FF] font-bold">Password</div>
              <input required type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="w-full bg-[#292D3E] border border-[#1E90FF] rounded-xl px-4 pt-6 pb-2 text-sm outline-none transition-all shadow-[0_0_0_1px_rgba(30,144,255,0.3)]" />
            </div>

            <div className="pt-4">
              <button type="submit" disabled={loading} className="w-full py-3.5 bg-[#1E90FF] hover:bg-blue-500 rounded-full text-sm font-bold transition-all flex items-center justify-center disabled:opacity-50">
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (isLogin ? 'Sign In' : 'Create account')}
              </button>
            </div>
          </form>

        </div>

        <div className="mt-auto"></div>
      </div>

      {/* RIGHT SIDE - IMAGE */}
      <div className="hidden lg:block w-1/2 relative bg-[#1E212B]">
        {/* Abstract Topography SVG Overlay */}
        <div className="absolute inset-0 z-10 pointer-events-none opacity-20 mix-blend-overlay overflow-hidden">
           <svg width="100%" height="100%" viewBox="0 0 800 800" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M400 -100 C 500 100, 200 400, 400 900" stroke="white" strokeWidth="2" strokeDasharray="6 6" />
              <path d="M450 -100 C 550 150, 250 450, 450 900" stroke="white" strokeWidth="2" strokeDasharray="6 6" />
              <path d="M500 -100 C 600 200, 300 500, 500 900" stroke="white" strokeWidth="2" strokeDasharray="6 6" />
           </svg>
        </div>

        {/* Mountain Image Background */}
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center transition-all duration-1000"
          style={{ 
            backgroundImage: "url('/assets/auth-bg.png')",
            filter: "brightness(0.6) contrast(1.1) saturate(0.8)",
            maskImage: "linear-gradient(to right, transparent, black 15%)",
            WebkitMaskImage: "linear-gradient(to right, transparent, black 15%)"
          }}
        ></div>

        {/* Bottom Right Graphic (.AV.) */}
        <div className="absolute bottom-12 right-12 z-20 flex items-center gap-1 opacity-80">
          <div className="w-2 h-2 rounded-full bg-white"></div>
          <div className="w-1 h-6 bg-white transform rotate-45"></div>
          <div className="w-1 h-8 bg-white transform rotate-45"></div>
          <div className="w-1 h-4 bg-white transform rotate-45"></div>
        </div>
      </div>

    </div>
  );
};

export default Auth;
