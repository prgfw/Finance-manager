import axios from 'axios';

// The symbols we track by default if no search is provided
const DEFAULT_SYMBOLS = ['AAPL', 'TSLA', 'VOO', 'VTI'];

export const fetchInvestmentData = async (symbols = DEFAULT_SYMBOLS) => {
  try {
    const results = await Promise.all(
      symbols.map(async (symbol) => {
        try {
          // Using Yahoo Finance REST API v8 for historical & quote data
          // This endpoint doesn't strictly require an API key and is highly reliable for our auto-refresh
          const response = await axios.get(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=30d`, {
            headers: {
              // A generic user agent helps prevent simple blocks
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
            }
          });

          const result = response.data.chart.result[0];
          const meta = result.meta;
          const quote = result.indicators.quote[0];
          const timestamps = result.timestamp || [];
          
          // Current price
          const price = meta.regularMarketPrice;
          
          // Calculate percentage change based on previous close
          const previousClose = meta.previousClose;
          const change = previousClose ? ((price - previousClose) / previousClose) * 100 : 0;
          
          // Format historical data
          const historicalData = [];
          for (let i = 0; i < timestamps.length; i++) {
            if (quote.close[i] !== null) {
              const date = new Date(timestamps[i] * 1000);
              historicalData.push({
                day: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                price: Number(quote.close[i].toFixed(2))
              });
            }
          }

          // Generate friendly name
          const nameMap: Record<string, string> = {
            'AAPL': 'Apple Inc.',
            'TSLA': 'Tesla Inc.',
            'VOO': 'Vanguard S&P 500 ETF',
            'VTI': 'Vanguard Total Stock',
          };

          return {
            id: symbol,
            symbol,
            name: nameMap[symbol] || symbol,
            type: symbol.length > 3 ? 'Stock' : 'Mutual Fund',
            price: Number(price.toFixed(2)),
            change: Number(change.toFixed(2)),
            data: historicalData
          };
        } catch (err: any) {
          console.error(`Error fetching data for ${symbol}:`, err.message);
          return null; // Return null for failed fetches, filter them out later
        }
      })
    );

    return results.filter(Boolean); // Remove nulls
  } catch (error) {
    console.error('Failed to fetch investments:', error);
    throw new Error('Failed to fetch investment data');
  }
};
