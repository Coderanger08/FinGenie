
export interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string; // Should be in YYYY-MM-DD format for DatePicker compatibility
  type: 'Income' | 'Expense';
  category: string; // Manual or accepted AI category
  aiSuggestedCategory?: string; // Pure AI suggestion before user confirmation
  aiConfidence?: number;
}

export interface Budget {
  id:string;
  categoryName: string;
  spendingLimit: number;
  currentSpending: number; // This would typically be calculated
}

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: number;
}

export interface PlannerOutputData {
  adjustedSpending: Record<string, number>;
  recommendedSavingsRate: number;
  investmentAllocation: Array<{ assetClass: string; percentage: number }>;
  summary: string;
}
