
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Settings as SettingsIcon, DollarSign } from "lucide-react";

const currencies = [
  { value: "USD", label: "USD - United States Dollar" },
  { value: "EUR", label: "EUR - Euro" },
  { value: "GBP", label: "GBP - British Pound Sterling" },
  { value: "JPY", label: "JPY - Japanese Yen" },
  { value: "CAD", label: "CAD - Canadian Dollar" },
  { value: "AUD", label: "AUD - Australian Dollar" },
  { value: "INR", label: "INR - Indian Rupee" },
];

const LOCAL_STORAGE_CURRENCY_KEY = "financeAppPreferredCurrency";

export default function SettingsPage() {
  const [selectedCurrency, setSelectedCurrency] = useState<string>("USD");
  const { toast } = useToast();

  useEffect(() => {
    const storedCurrency = localStorage.getItem(LOCAL_STORAGE_CURRENCY_KEY);
    if (storedCurrency && currencies.some(c => c.value === storedCurrency)) {
      setSelectedCurrency(storedCurrency);
    }
  }, []);

  const handleCurrencyChange = (value: string) => {
    setSelectedCurrency(value);
    localStorage.setItem(LOCAL_STORAGE_CURRENCY_KEY, value);
    toast({
      title: "Preference Updated",
      description: `Preferred currency set to ${value}.`,
    });
  };

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-2xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon className="h-6 w-6 text-primary" />
            Settings
          </CardTitle>
          <CardDescription>Manage your application preferences.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="currency-select" className="flex items-center gap-1 text-base font-medium">
              <DollarSign className="h-5 w-5 text-muted-foreground"/>
              Preferred Currency
            </Label>
            <Select value={selectedCurrency} onValueChange={handleCurrencyChange}>
              <SelectTrigger id="currency-select" className="w-full">
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                {currencies.map((currency) => (
                  <SelectItem key={currency.value} value={currency.value}>
                    {currency.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Choose the currency to be used across the application. This setting is saved locally in your browser.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
