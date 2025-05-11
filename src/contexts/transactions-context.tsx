
"use client";

import type { Dispatch, ReactNode, SetStateAction } from 'react';
import React, { createContext, useContext, useState, useCallback } from 'react';
import type { Transaction } from '@/types';
import { format } from 'date-fns';

interface TransactionsContextType {
  transactions: Transaction[];
  addTransaction: (transactionData: Omit<Transaction, 'id' | 'date'> & { date: Date }) => void;
  setTransactions: Dispatch<SetStateAction<Transaction[]>>; // Allow direct setting if needed for advanced cases
}

const TransactionsContext = createContext<TransactionsContextType | undefined>(undefined);

const initialMockTransactions: Transaction[] = [
  { id: "1", description: "Salary Deposit", amount: 5000, date: "2024-07-01", type: "Income", category: "Salary" },
  { id: "2", description: "Groceries", amount: 150, date: "2024-07-02", type: "Expense", category: "Food" },
  { id: "3", description: "Rent", amount: 1200, date: "2024-07-01", type: "Expense", category: "Housing" },
  { id: "4", description: "Internet Bill", amount: 60, date: "2024-07-03", type: "Expense", category: "Utilities" },
  { id: "5", description: "Freelance Project", amount: 750, date: "2024-07-05", type: "Income", category: "Freelance" },
];


export function TransactionsProvider({ children }: { children: ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>(initialMockTransactions);

  const addTransaction = useCallback((transactionData: Omit<Transaction, 'id' | 'date'> & { date: Date }) => {
    const newTransaction: Transaction = {
      id: Date.now().toString(),
      ...transactionData,
      date: format(transactionData.date, "yyyy-MM-dd"),
    };
    setTransactions((prevTransactions) => [newTransaction, ...prevTransactions]);
  }, []);

  return (
    <TransactionsContext.Provider value={{ transactions, addTransaction, setTransactions }}>
      {children}
    </TransactionsContext.Provider>
  );
}

export function useTransactions(): TransactionsContextType {
  const context = useContext(TransactionsContext);
  if (context === undefined) {
    throw new Error('useTransactions must be used within a TransactionsProvider');
  }
  return context;
}
