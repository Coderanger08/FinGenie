"use client";

import type { Dispatch, ReactNode, SetStateAction } from 'react';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { DEFAULT_CURRENCY, LOCAL_STORAGE_CURRENCY_KEY } from '@/lib/currency-utils';

interface CurrencyContextType {
  selectedCurrency: string;
  setSelectedCurrency: Dispatch<SetStateAction<string>>;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [selectedCurrency, setSelectedCurrency] = useState<string>(DEFAULT_CURRENCY);

  useEffect(() => {
    const storedCurrency = localStorage.getItem(LOCAL_STORAGE_CURRENCY_KEY);
    if (storedCurrency) {
      setSelectedCurrency(storedCurrency);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_CURRENCY_KEY, selectedCurrency);
  }, [selectedCurrency]);

  return (
    <CurrencyContext.Provider value={{ selectedCurrency, setSelectedCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency(): CurrencyContextType {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}
