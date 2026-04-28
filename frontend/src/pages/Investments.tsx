import { useState, useEffect, useRef } from 'react';
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { LineChart, Search, TrendingUp, TrendingDown, RefreshCcw } from 'lucide-react';
import { useCurrencyStore } from '../store/currencyStore';
import api from '../utils/api';
import toast from 'react-hot-toast';

interface HistoricalData {
  day: string;
  price: number;
}

interface Asset {
  id: string;
  symbol: string;
  name: string;
  type: string;
  price: number;
  change: number;
  data: HistoricalData[];
}

const Investments = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { format, convert } = useCurrencyStore();
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchInvestments = async (symbols?: string) => {
    try {
      const endpoint = symbols ? `/investments?symbols=${symbols}` : '/investments';
      const { data } = await api.get(endpoint);
      setAssets(data);
    } catch (error: any) {
      console.error('Failed to fetch investments:', error);
      toast.error('Failed to load investment data');
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchInvestments();
    setRefreshing(false);
  };

  useEffect(() => {
    // Initial fetch
    fetchInvestments().finally(() => setLoading(false));

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchInvestments();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    // Clear previous timeout
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    
    // Set a timeout to debounce API requests when typing symbols
    searchTimeoutRef.current = setTimeout(() => {
      if (value.trim()) {
        fetchInvestments(value);
      } else {
        fetchInvestments(); // reset to default
      }
    }, 800);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            Investments
            <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-full uppercase tracking-wider font-bold">Live Data</span>
          </h1>
          <p className="text-gray-400 mt-1.5 font-medium">Track your stocks and mutual funds</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-grow sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <input 
              type="text" 
              placeholder="Search symbol (e.g. MSFT)" 
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#2A2A35] bg-[#1A1A25] text-white focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>
          <button 
            onClick={handleRefresh}
            className={`p-2.5 rounded-xl border border-[#2A2A35] bg-[#1A1A25] text-gray-400 hover:text-white transition-colors ${refreshing ? 'animate-spin text-emerald-400' : ''}`}
          >
            <RefreshCcw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64 gap-4 flex-col">
          <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p style={{ color: '#6B7280', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em' }}>FETCHING LIVE MARKETS</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {assets.map(asset => (
            <div key={asset.id} className="bg-[#1c1c24] border border-[#2A2A35] rounded-3xl p-6 shadow-lg hover:border-[#3A3A45] transition-all group">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-[#2A2A35] flex items-center justify-center font-bold text-white shadow-inner border border-white/5">
                    {asset.symbol.substring(0, 2)}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-white leading-tight">{asset.symbol}</h3>
                    <p className="text-sm text-gray-500 font-medium">{asset.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  {/* Important: convert the USD stock price to selected currency */}
                  <p className="text-xl font-bold text-white">{format(convert(asset.price))}</p>
                  <div className={`flex items-center justify-end gap-1 text-sm font-bold ${asset.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {asset.change >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                    {Math.abs(asset.change).toFixed(2)}%
                  </div>
                </div>
              </div>

              <div className="h-32 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsLineChart data={asset.data}>
                    <XAxis dataKey="day" hide />
                    <YAxis domain={['auto', 'auto']} hide />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1A1A25', borderColor: '#2A2A35', borderRadius: '12px' }}
                      itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                      labelStyle={{ display: 'none' }}
                      formatter={(value: number) => [format(convert(value)), 'Price']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="price" 
                      stroke={asset.change >= 0 ? '#10b981' : '#ef4444'} 
                      strokeWidth={3}
                      dot={false}
                      activeDot={{ r: 6, fill: '#1A1A25', stroke: asset.change >= 0 ? '#10b981' : '#ef4444', strokeWidth: 2 }}
                    />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </div>
            </div>
          ))}

          {assets.length === 0 && (
            <div className="col-span-full py-16 text-center text-gray-500">
              <LineChart className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p className="font-medium text-white mb-1">No assets found</p>
              <p>Try searching for a valid stock symbol (e.g. MSFT, GOOGL).</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Investments;
