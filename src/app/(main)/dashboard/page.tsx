
"use client";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { BarChart, PieChart, Pie, Bar, XAxis, YAxis, CartesianGrid, Cell } from 'recharts';
import { ArrowUpRight, ArrowDownRight, AlertTriangle, DollarSign, TrendingUp } from "lucide-react";
import type { Transaction, Budget } from "@/types";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState, useMemo } from "react";
import { useCurrency } from "@/contexts/currency-context";
import { formatCurrency } from "@/lib/currency-utils";
import { useTransactions } from "@/contexts/transactions-context"; // Import useTransactions
import { parseISO } from "date-fns";
import { cn } from "@/lib/utils";

// Mocked budgets for budget alerts, can be moved to context or fetched if needed elsewhere
const mockBudgets: Budget[] = [
  { id: "1", categoryName: "Food", spendingLimit: 400, currentSpending: 0 }, // currentSpending will be updated
  { id: "2", categoryName: "Entertainment", spendingLimit: 200, currentSpending: 0 },
  { id: "3", categoryName: "Utilities", spendingLimit: 150, currentSpending: 0 },
];

const chartConfigBase = {
  value: { label: "Amount" }, // Base color will be applied per bar by fill property
} satisfies import("@/components/ui/chart").ChartConfig;


export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const { selectedCurrency } = useCurrency();
  const { transactions } = useTransactions(); // Use transactions from context

  useEffect(() => setMounted(true), []);

  const totalIncome = useMemo(() => transactions.filter(t => t.type === 'Income').reduce((sum, t) => sum + t.amount, 0), [transactions]);
  const totalExpenses = useMemo(() => transactions.filter(t => t.type === 'Expense').reduce((sum, t) => sum + t.amount, 0), [transactions]);
  const currentBalance = useMemo(() => totalIncome - totalExpenses, [totalIncome, totalExpenses]);
  
  // Mocked savings data - this could also come from context or state if dynamic
  const savingsGoalAmount = 10000;
  const currentSavings = 2500; 
  const savingsProgress = (currentSavings / savingsGoalAmount) * 100;
  const projectedBalance = currentBalance + (totalIncome * 0.1); // Simple projection

  const spendingDataRaw = useMemo(() => {
    const spendingByCategory: Record<string, number> = {};
    transactions
      .filter(t => t.type === 'Expense')
      .forEach(t => {
        spendingByCategory[t.category] = (spendingByCategory[t.category] || 0) + t.amount;
      });
    return Object.entries(spendingByCategory).map(([name, value], index) => ({
      name,
      value,
      fill: `hsl(var(--chart-${(index % 5) + 1}))`,
    }));
  }, [transactions]);

  const incomeDataRaw = useMemo(() => {
    const incomeByCategory: Record<string, number> = {};
    transactions
      .filter(t => t.type === 'Income')
      .forEach(t => {
        incomeByCategory[t.category] = (incomeByCategory[t.category] || 0) + t.amount;
      });
    return Object.entries(incomeByCategory).map(([name, value], index) => ({
      name,
      value,
      fill: `hsl(var(--chart-${(index % 5) + 1}))`,
    }));
  }, [transactions]);

  const chartConfigSpending = useMemo(() => {
    const config: import("@/components/ui/chart").ChartConfig = { value: { label: "Spending" } };
    spendingDataRaw.forEach(item => {
      config[item.name] = { label: item.name, color: item.fill };
    });
    return config;
  }, [spendingDataRaw]);

  const chartConfigIncome = useMemo(() => {
    const config: import("@/components/ui/chart").ChartConfig = { value: { label: "Income" } };
    incomeDataRaw.forEach(item => {
      config[item.name] = { label: item.name, color: item.fill };
    });
    return config;
  }, [incomeDataRaw]);

  const updatedMockBudgets = useMemo(() => {
    return mockBudgets.map(budget => {
      const spent = transactions
        .filter(t => t.type === 'Expense' && t.category.toLowerCase() === budget.categoryName.toLowerCase())
        .reduce((sum, t) => sum + t.amount, 0);
      return { ...budget, currentSpending: spent };
    });
  }, [transactions, mockBudgets]);


  if (!mounted) {
    // TODO: Add a loading skeleton here
    return null; 
  }

  const chartTooltipFormatter = (value: unknown) => {
    if (typeof value === 'number') {
      return formatCurrency(value, selectedCurrency);
    }
    return String(value);
  };
  
  const pieChartTooltipFormatter = (value: number, name: string) => {
    return [formatCurrency(value, selectedCurrency), name];
  };

  const cardHoverEffect = "transition-all duration-300 ease-in-out hover:shadow-xl hover:-translate-y-1";

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Financial Dashboard</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card className={cardHoverEffect}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(currentBalance, selectedCurrency)}</div>
            <p className="text-xs text-muted-foreground">
              Based on recorded transactions
            </p>
          </CardContent>
        </Card>
        <Card className={cardHoverEffect}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalIncome, selectedCurrency)}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
        <Card className={cardHoverEffect}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <ArrowDownRight className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalExpenses, selectedCurrency)}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
        <Card className={cardHoverEffect}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projected Balance</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(projectedBalance, selectedCurrency)}</div>
            <p className="text-xs text-muted-foreground">Next month estimate</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <Card className={cardHoverEffect}>
          <CardHeader>
            <CardTitle>Spending Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {spendingDataRaw.length > 0 ? (
              <ChartContainer config={chartConfigSpending} className="mx-auto aspect-square max-h-[300px]">
                <PieChart>
                  <ChartTooltip 
                    content={
                      <ChartTooltipContent 
                        hideLabel 
                        formatter={(value, name) => pieChartTooltipFormatter(value as number, name as string)}
                      />
                    } 
                  />
                  <Pie data={spendingDataRaw} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                    {spendingDataRaw.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <ChartLegend content={<ChartLegendContent nameKey="name"/>} />
                </PieChart>
              </ChartContainer>
            ) : (
              <p className="text-muted-foreground text-center py-10">No spending data available for the chart.</p>
            )}
          </CardContent>
        </Card>
        <Card className={cardHoverEffect}>
          <CardHeader>
            <CardTitle>Income Sources</CardTitle>
          </CardHeader>
          <CardContent>
            {incomeDataRaw.length > 0 ? (
               <ChartContainer config={chartConfigIncome} className="w-full h-[300px]">
                <BarChart accessibilityLayer data={incomeDataRaw} layout="vertical" margin={{ left: 20, right: 30 }}>
                  <CartesianGrid horizontal={false} />
                  <XAxis type="number" tickFormatter={(value) => chartTooltipFormatter(value)} />
                  <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} width={80} />
                  <ChartTooltip 
                    cursor={false} 
                    content={
                      <ChartTooltipContent 
                        hideLabel 
                        formatter={(value) => chartTooltipFormatter(value)} 
                      />
                    }
                  />
                  <Bar dataKey="value" radius={5}>
                      {incomeDataRaw.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                   <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                </BarChart>
              </ChartContainer>
            ) : (
                 <p className="text-muted-foreground text-center py-10">No income data available for the chart.</p>
            )}
          </CardContent>
        </Card>
      </div>
      
      <Card className={`${cardHoverEffect} mb-8`}>
        <CardHeader>
          <CardTitle>Savings Goals</CardTitle>
          <CardDescription>Your progress towards your financial goals.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-2 flex justify-between">
            <span>Save for Vacation</span>
            <span className="text-muted-foreground">{formatCurrency(currentSavings, selectedCurrency)} / {formatCurrency(savingsGoalAmount, selectedCurrency)}</span>
          </div>
          <Progress value={savingsProgress} aria-label={`${savingsProgress}% towards vacation goal`} />
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <Card className={cardHoverEffect}>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            {transactions.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.slice(0, 5).map((transaction) => (
                    <TableRow key={transaction.id} className="transition-colors hover:bg-muted/30">
                      <TableCell className="font-medium">{transaction.description}</TableCell>
                      <TableCell><Badge variant="outline">{transaction.category}</Badge></TableCell>
                      <TableCell className={`text-right ${transaction.type === 'Income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {transaction.type === 'Income' ? '+' : '-'}{formatCurrency(transaction.amount, selectedCurrency)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
               <p className="text-muted-foreground text-center py-10">No recent transactions.</p>
            )}
          </CardContent>
        </Card>

        <Card className={cardHoverEffect}>
          <CardHeader>
            <CardTitle>Budget Alerts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {updatedMockBudgets.filter(b => b.spendingLimit > 0 && (b.currentSpending / b.spendingLimit) > 0.8).map(budget => (
              <Alert key={budget.id} variant={(budget.currentSpending / budget.spendingLimit) >= 1 ? "destructive" : "default"}
                className={cn(
                  "transition-all duration-300 ease-in-out",
                  (budget.currentSpending / budget.spendingLimit) >= 0.8 && (budget.currentSpending / budget.spendingLimit) < 1 
                  ? "border-yellow-500 text-yellow-700 dark:text-yellow-400 [&>svg]:text-yellow-500 dark:[&>svg]:text-yellow-400 hover:shadow-md" 
                  : "hover:shadow-md"
                )}
              >
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>
                  { (budget.currentSpending / budget.spendingLimit) >= 1 
                    ? `Over Budget: ${budget.categoryName}`
                    : `Nearing Limit: ${budget.categoryName}`
                  }
                </AlertTitle>
                <AlertDescription>
                  You've spent {formatCurrency(budget.currentSpending, selectedCurrency)} of your {formatCurrency(budget.spendingLimit, selectedCurrency)} budget for {budget.categoryName}.
                </AlertDescription>
              </Alert>
            ))}
            {updatedMockBudgets.filter(b => b.spendingLimit > 0 && (b.currentSpending / b.spendingLimit) > 0.8).length === 0 && (
              <p className="text-sm text-muted-foreground">No budget alerts at the moment. Great job!</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

