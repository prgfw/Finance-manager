import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db';
import authRoutes from './routes/authRoutes';
import expenseRoutes from './routes/expenseRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import budgetRoutes from './routes/budgetRoutes';
import loanRoutes from './routes/loanRoutes';
import investmentRoutes from './routes/investmentRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/loans', loanRoutes);
app.use('/api/investments', investmentRoutes);

// Health Check Route
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'Server is running' });
});

// Start Server
app.listen(PORT, async () => {
  await connectDB();
  console.log(`Server is running on port ${PORT}`);
});
