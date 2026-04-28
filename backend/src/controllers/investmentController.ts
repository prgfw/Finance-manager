import { Request, Response } from 'express';
import { fetchInvestmentData } from '../services/investmentService';

export const getInvestments = async (req: Request, res: Response) => {
  try {
    const symbolsQuery = req.query.symbols as string;
    
    let data;
    if (symbolsQuery) {
      // If client provides a comma-separated list of symbols
      const symbols = symbolsQuery.split(',').map(s => s.trim().toUpperCase());
      data = await fetchInvestmentData(symbols);
    } else {
      // Default dashboard symbols
      data = await fetchInvestmentData();
    }
    
    res.json(data);
  } catch (error: any) {
    console.error('Error in getInvestments controller:', error.message);
    res.status(500).json({ message: 'Failed to fetch investment data' });
  }
};
