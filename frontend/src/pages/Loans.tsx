import { useState, useEffect } from 'react';
import api from '../utils/api';
import { useLoanStore, type Loan } from '../store/loanStore';
import { Banknote, Calculator, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const Loans = () => {
  const { loans, setLoans, addLoan, removeLoan } = useLoanStore();
  const [loading, setLoading] = useState(true);
  
  const [name, setName] = useState('');
  const [principal, setPrincipal] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [timePeriod, setTimePeriod] = useState('');
  const [interestType, setInterestType] = useState<'simple'|'compound'>('simple');
  
  const [calcResult, setCalcResult] = useState<{ totalInterest: number, totalPayable: number, emi: number } | null>(null);

  useEffect(() => {
    const fetchLoans = async () => {
      try {
        const { data } = await api.get('/loans');
        setLoans(data);
      } catch (error) {
        console.error('Failed to fetch loans', error);
      } finally {
        setLoading(false);
      }
    };
    fetchLoans();
  }, [setLoans]);

  const calculateLoan = () => {
    const P = Number(principal);
    const R = Number(interestRate);
    const T = Number(timePeriod);
    
    if(!P || !R || !T) return;
    
    let totalInterest = 0;
    let totalPayable = 0;

    if (interestType === 'simple') {
      totalInterest = (P * R * T) / 100;
      totalPayable = P + totalInterest;
    } else {
      totalPayable = P * Math.pow((1 + R / 100), T);
      totalInterest = totalPayable - P;
    }
    
    const months = T * 12;
    const emi = totalPayable / months;

    setCalcResult({ totalInterest, totalPayable, emi });
  };

  const handleSaveLoan = async () => {
    if(!name || !calcResult) return toast.error('Please enter a name and calculate first');
    try {
      const { data } = await api.post('/loans', { 
        name, 
        principal: Number(principal), 
        interestRate: Number(interestRate), 
        timePeriod: Number(timePeriod), 
        interestType 
      });
      addLoan(data);
      toast.success('Loan saved successfully');
      setName(''); setPrincipal(''); setInterestRate(''); setTimePeriod(''); setCalcResult(null);
    } catch (error) {
      toast.error('Failed to save loan');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this loan record?')) return;
    try {
      await api.delete(`/loans/${id}`);
      removeLoan(id);
      toast.success('Loan removed');
    } catch (error) {
      toast.error('Failed to delete loan');
    }
  };

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white tracking-tight">Loan Management</h1>
        <p className="text-gray-400 mt-1.5 font-medium">Calculate and track your active loans</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Calculator */}
        <div className="bg-[#1c1c24] border border-[#2A2A35] rounded-3xl p-6 sm:p-8 shadow-lg">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-indigo-500/10 rounded-2xl">
              <Calculator className="h-6 w-6 text-indigo-400" />
            </div>
            <h2 className="text-xl font-bold text-white">Loan Calculator</h2>
          </div>
          
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Loan Name</label>
              <input type="text" className="w-full px-4 py-3 rounded-xl border border-[#2A2A35] bg-[#1A1A25] text-white focus:ring-2 focus:ring-indigo-500 outline-none" value={name} onChange={e => setName(e.target.value)} placeholder="Car Loan, Education..." />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Principal Amount ($)</label>
                <input type="number" className="w-full px-4 py-3 rounded-xl border border-[#2A2A35] bg-[#1A1A25] text-white focus:ring-2 focus:ring-indigo-500 outline-none" value={principal} onChange={e => setPrincipal(e.target.value)} placeholder="10000" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Interest Rate (%)</label>
                <input type="number" step="0.1" className="w-full px-4 py-3 rounded-xl border border-[#2A2A35] bg-[#1A1A25] text-white focus:ring-2 focus:ring-indigo-500 outline-none" value={interestRate} onChange={e => setInterestRate(e.target.value)} placeholder="5.5" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Time Period (Years)</label>
                <input type="number" step="0.5" className="w-full px-4 py-3 rounded-xl border border-[#2A2A35] bg-[#1A1A25] text-white focus:ring-2 focus:ring-indigo-500 outline-none" value={timePeriod} onChange={e => setTimePeriod(e.target.value)} placeholder="5" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Interest Type</label>
                <select className="w-full px-4 py-3 rounded-xl border border-[#2A2A35] bg-[#1A1A25] text-white focus:ring-2 focus:ring-indigo-500 outline-none appearance-none" value={interestType} onChange={e => setInterestType(e.target.value as 'simple'|'compound')}>
                  <option value="simple">Simple</option>
                  <option value="compound">Compound</option>
                </select>
              </div>
            </div>
            
            <button onClick={calculateLoan} className="w-full mt-4 bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-indigo-500/20 transition-all active:scale-95">
              Calculate EMI
            </button>
            
            {calcResult && (
              <div className="mt-6 p-5 bg-[#1A1A25] border border-[#2A2A35] rounded-2xl animate-fade-in">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Total Interest</p>
                    <p className="text-lg font-bold text-red-400">${calcResult.totalInterest.toFixed(2)}</p>
                  </div>
                  <div className="border-l border-r border-[#2A2A35]">
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Total Payable</p>
                    <p className="text-lg font-bold text-white">${calcResult.totalPayable.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Monthly EMI</p>
                    <p className="text-lg font-bold text-indigo-400">${calcResult.emi.toFixed(2)}</p>
                  </div>
                </div>
                <button onClick={handleSaveLoan} className="w-full mt-5 bg-[#2A2A35] hover:bg-[#3A3A45] text-white font-semibold py-2.5 rounded-xl transition-colors text-sm">
                  Save to Profile
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Saved Loans */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white mb-4">Saved Loans</h2>
          {loading ? (
             <div className="py-12 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div></div>
          ) : loans.length > 0 ? (
            <div className="space-y-4">
              {loans.map(loan => (
                <div key={loan._id} className="bg-[#1c1c24] border border-[#2A2A35] rounded-2xl p-5 hover:border-[#3A3A45] transition-colors group relative">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-3">
                      <Banknote className="h-5 w-5 text-indigo-400" />
                      <h3 className="font-bold text-white">{loan.name}</h3>
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#2A2A35] text-gray-400">{loan.interestType}</span>
                    </div>
                    <button onClick={() => handleDelete(loan._id)} className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                    <div>
                      <p className="text-gray-500 mb-0.5">Principal</p>
                      <p className="text-white font-medium">${loan.principal.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-0.5">Total Payable</p>
                      <p className="text-white font-medium">${loan.totalPayable.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-0.5">Rate & Time</p>
                      <p className="text-white font-medium">{loan.interestRate}% for {loan.timePeriod} Yrs</p>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-0.5">Total Interest</p>
                      <p className="text-red-400 font-medium">${loan.totalInterest.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-[#1c1c24] border border-[#2A2A35] rounded-3xl p-12 text-center text-gray-400">
               <Banknote className="h-10 w-10 mx-auto mb-3 opacity-20" />
               <p className="font-medium text-white mb-1">No saved loans</p>
               <p className="text-sm">Use the calculator to add your first loan.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Loans;
