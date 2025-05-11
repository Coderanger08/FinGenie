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
import { useEffect, useState } from "react";
import { useCurrency } from "@/contexts/currency-context";
import { formatCurrency } from "@/lib/currency-utils";

const mockTransactions: Transaction[] = [
  { id: "1", description: "Salary Deposit", amount: 5000, date: "2024-07-01", type: "Income", category: "Salary" },
  { id: "2", description: "Groceries", amount: 150, date: "2024-07-02", type: "Expense", category: "Food" },
  { id: "3", description: "Rent", amount: 1200, date: "2024-07-01", type: "Expense", category: "Housing" },
  { id: "4", description: "Internet Bill", amount: 60, date: "2024-07-03", type: "Expense", category: "Utilities" },
  { id: "5", description: "Freelance Project", amount: 750, date: "2024-07-05", type: "Income", category: "Freelance" },
];

const mockBudgets: Budget[] = [
  { id: "1", categoryName: "Food", spendingLimit: 400, currentSpending: 150 },
  { id: "2", categoryName: "Entertainment", spendingLimit: 200, currentSpending: 50 },
  { id: "3", categoryName: "Utilities", spendingLimit: 150, currentSpending: 60 },
];

// Raw data for charts (values are numbers)
const spendingDataRaw = [
  { name: 'Food', value: 150, fill: "hsl(var(--chart-1))" },
  { name: 'Housing', value: 1200, fill: "hsl(var(--chart-2))" },
  { name: 'Utilities', value: 60, fill: "hsl(var(--chart-3))" },
  { name: 'Other', value: 200, fill: "hsl(var(--chart-4))" },
];

const incomeDataRaw = [
  { name: 'Salary', value: 5000, fill: "hsl(var(--chart-1))" },
  { name: 'Freelance', value: 750, fill: "hsl(var(--chart-2))" },
];

const chartConfigSpending = {
  value: { label: "Spending" },
  Food: { label: "Food", color: "hsl(var(--chart-1))" },
  Housing: { label: "Housing", color: "hsl(var(--chart-2))" },
  Utilities: { label: "Utilities", color: "hsl(var(--chart-3))" },
  Other: { label: "Other", color: "hsl(var(--chart-4))" },
} satisfies import("@/components/ui/chart").ChartConfig;

const chartConfigIncome = {
  value: { label: "Income" },
  Salary: { label: "Salary", color: "hsl(var(--chart-1))" },
  Freelance: { label: "Freelance", color: "hsl(var(--chart-2))" },
} satisfies import("@/components/ui/chart").ChartConfig;


export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const { selectedCurrency } = useCurrency();

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return null; 
  }

  const totalIncome = mockTransactions.filter(t => t.type === 'Income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = mockTransactions.filter(t => t.type === 'Expense').reduce((sum, t) => sum + t.amount, 0);
  const currentBalance = totalIncome - totalExpenses;
  const savingsGoalAmount = 10000;
  const currentSavings = 2500; // Mocked
  const savingsProgress = (currentSavings / savingsGoalAmount) * 100;

  const projectedBalance = totalIncome - totalExpenses + (totalIncome * 0.1);

  const chartTooltipFormatter = (value: unknown) => {
    if (typeof value === 'number') {
      return formatCurrency(value, selectedCurrency);
    }
    return String(value);
  };
  
  const pieChartTooltipFormatter = (value: number, name: string) => {
    return [formatCurrency(value, selectedCurrency), name];
  };


  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Financial Dashboard</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalIncome, selectedCurrency)}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <ArrowDownRight className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalExpenses, selectedCurrency)}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
        <Card>
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
        <Card>
          <CardHeader>
            <CardTitle>Spending Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
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
                <ChartLegend content={<ChartLegendContent />} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Income Sources</CardTitle>
          </CardHeader>
          <CardContent>
             <ChartContainer config={chartConfigIncome} className="w-full h-[300px]">
              <BarChart accessibilityLayer data={incomeDataRaw} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid horizontal={false} />
                <XAxis type="number" hide tickFormatter={(value) => chartTooltipFormatter(value)} />
                <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} />
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
                 <ChartLegend content={<ChartLegendContent />} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
      
      <Card className="mb-8">
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
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockTransactions.slice(0, 5).map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-medium">{transaction.description}</TableCell>
                    <TableCell><Badge variant="outline">{transaction.category}</Badge></TableCell>
                    <TableCell className={`text-right ${transaction.type === 'Income' ? 'text-green-500' : 'text-red-500'}`}>
                      {transaction.type === 'Income' ? '+' : '-'}{formatCurrency(transaction.amount, selectedCurrency)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Budget Alerts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {mockBudgets.filter(b => (b.currentSpending / b.spendingLimit) > 0.8).map(budget => (
              <Alert key={budget.id} variant={(budget.currentSpending / budget.spendingLimit) >= 1 ? "destructive" : "default"}>
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
            {mockBudgets.filter(b => (b.currentSpending / b.spendingLimit) > 0.8).length === 0 && (
              <p className="text-sm text-muted-foreground">No budget alerts at the moment. Great job!</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
