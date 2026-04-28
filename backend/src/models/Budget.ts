import mongoose from 'mongoose';

export interface IBudget extends mongoose.Document {
  user: mongoose.Schema.Types.ObjectId;
  category: string;
  monthlyLimit: number;
}

const budgetSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    category: { type: String, required: true },
    monthlyLimit: { type: Number, required: true },
  },
  { timestamps: true }
);

// Ensure a user can only have one budget per category
budgetSchema.index({ user: 1, category: 1 }, { unique: true });

const Budget = mongoose.model<IBudget>('Budget', budgetSchema);
export default Budget;
