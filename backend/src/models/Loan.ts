import mongoose from 'mongoose';

export interface ILoan extends mongoose.Document {
  user: mongoose.Schema.Types.ObjectId;
  name: string;
  principal: number;
  interestRate: number;
  timePeriod: number;
  interestType: 'simple' | 'compound';
  totalInterest: number;
  totalPayable: number;
}

const loanSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    name: { type: String, required: true },
    principal: { type: Number, required: true },
    interestRate: { type: Number, required: true },
    timePeriod: { type: Number, required: true }, // in years
    interestType: { type: String, enum: ['simple', 'compound'], required: true },
    totalInterest: { type: Number, required: true },
    totalPayable: { type: Number, required: true },
  },
  { timestamps: true }
);

const Loan = mongoose.model<ILoan>('Loan', loanSchema);
export default Loan;
