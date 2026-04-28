import Papa from 'papaparse';
import type { Expense } from '../store/expenseStore';
import { format, parseISO } from 'date-fns';

export const exportExpensesToCSV = (expenses: Expense[]) => {
  const data = expenses.map(e => ({
    Title: e.title,
    Type: e.type.toUpperCase(),
    Category: e.category,
    Amount: Number(e.amount || 0).toFixed(2),
    Date: format(parseISO(e.date), 'MMM dd, yyyy')
  }));

  // Handle different module resolution styles for papaparse
  const unparse = Papa.unparse || (Papa as any).default?.unparse;
  const csv = unparse(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `transactions_export_${format(new Date(), 'yyyyMMdd')}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
