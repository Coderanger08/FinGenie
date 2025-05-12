
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
  currentSpending: number; // This will be calculated from transactions
}

export interface ChartDataPoint {
  name: string;
  value: number;
  fill?: string; // Optional: for specific color suggestions by AI
}
export interface ChartConfig {
  type: 'pie' | 'bar';
  data: ChartDataPoint[];
  title?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
}

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: number;
  chart?: ChartConfig; // Optional chart data
}
