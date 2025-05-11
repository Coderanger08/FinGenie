"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PiggyBankIcon, PlusCircle, AlertTriangle, Tag, CircleDollarSign, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Budget, Transaction } from "@/types"; // Assuming transactions are available for spending calculation
import { Badge } from "@/components/ui/badge";

// Mocked transactions for budget calculation for now
const mockTransactions: Transaction[] = [
    { id: "1", description: "Groceries", amount: 75, date: "2024-07-10", type: "Expense", category: "Food" },
    { id: "2", description: "Movie Tickets", amount: 30, date: "2024-07-12", type: "Expense", category: "Entertainment" },
    { id: "3", description: "Lunch", amount: 15, date: "2024-07-15", type: "Expense", category: "Food" },
];


const budgetSchema = z.object({
  categoryName: z.string().min(2, "Category name must be at least 2 characters"),
  spendingLimit: z.coerce.number().positive("Spending limit must be a positive number"),
});

type BudgetFormData = z.infer<typeof budgetSchema>;

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const { toast } = useToast();

  const form = useForm<BudgetFormData>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      categoryName: "",
      spendingLimit: 0,
    },
  });

  const onSubmit = (data: BudgetFormData) => {
    // In a real app, currentSpending would be calculated based on actual transactions
    // For this mock, we'll find matching transactions
    const currentSpending = mockTransactions
        .filter(t => t.category.toLowerCase() === data.categoryName.toLowerCase() && t.type === "Expense")
        .reduce((sum, t) => sum + t.amount, 0);

    const newBudget: Budget = {
      id: Date.now().toString(),
      ...data,
      currentSpending: currentSpending,
    };
    setBudgets((prev) => [newBudget, ...prev]);
    toast({
      title: "Budget Created",
      description: `Budget for ${data.categoryName} with a limit of $${data.spendingLimit} created.`,
    });
    form.reset();
  };

  return (
    <div className="container mx-auto py-8">
      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Create New Budget</CardTitle>
              <CardDescription>Set a spending limit for a category.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div>
                  <Label htmlFor="categoryName" className="flex items-center gap-1 mb-1"><Tag className="w-4 h-4"/>Category Name</Label>
                  <Input id="categoryName" {...form.register("categoryName")} placeholder="e.g., Food, Entertainment" />
                  {form.formState.errors.categoryName && <p className="text-sm text-destructive mt-1">{form.formState.errors.categoryName.message}</p>}
                </div>

                <div>
                  <Label htmlFor="spendingLimit" className="flex items-center gap-1 mb-1"><CircleDollarSign className="w-4 h-4"/>Spending Limit</Label>
                  <Input id="spendingLimit" type="number" step="1" {...form.register("spendingLimit")} placeholder="0" />
                  {form.formState.errors.spendingLimit && <p className="text-sm text-destructive mt-1">{form.formState.errors.spendingLimit.message}</p>}
                </div>
                
                <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                  Create Budget
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Your Budgets</CardTitle>
              <CardDescription>Track your spending against your budget limits.</CardDescription>
            </CardHeader>
            <CardContent>
              {budgets.length === 0 ? (
                <div className="text-center py-10">
                    <PiggyBankIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No budgets created yet.</p>
                    <p className="text-sm text-muted-foreground">Create a budget to start tracking your spending.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {budgets.map((budget) => {
                    const progress = Math.min((budget.currentSpending / budget.spendingLimit) * 100, 100);
                    const isOverLimit = budget.currentSpending > budget.spendingLimit;
                    const isApproachingLimit = progress >= 80 && !isOverLimit;

                    return (
                      <Card key={budget.id} className="shadow-md">
                        <CardHeader>
                          <CardTitle className="flex justify-between items-center">
                            <span>{budget.categoryName}</span>
                            <Badge variant={isOverLimit ? "destructive" : "secondary"}>
                              Limit: ${budget.spendingLimit.toFixed(2)}
                            </Badge>
                          </CardTitle>
                          <CardDescription>
                            Spent: ${budget.currentSpending.toFixed(2)}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <Progress value={progress} className={isOverLimit ? "bg-destructive" : (isApproachingLimit ? "bg-yellow-400" : "")} aria-label={`${budget.categoryName} budget progress`} />
                          <div className="mt-2 text-sm text-muted-foreground">
                            {progress.toFixed(0)}% of budget used
                          </div>
                        </CardContent>
                        {(isOverLimit || isApproachingLimit) && (
                          <CardFooter>
                            <Alert variant={isOverLimit ? "destructive" : "default"} className={isApproachingLimit && !isOverLimit ? "border-yellow-500 text-yellow-700 [&>svg]:text-yellow-500" : ""}>
                              <AlertTriangle className="h-4 w-4" />
                              <AlertTitle>
                                {isOverLimit ? "Budget Exceeded" : "Approaching Limit"}
                              </AlertTitle>
                              <AlertDescription>
                                {isOverLimit 
                                  ? `You've exceeded your budget for ${budget.categoryName} by $${(budget.currentSpending - budget.spendingLimit).toFixed(2)}.`
                                  : `You're close to your spending limit for ${budget.categoryName}.`}
                              </AlertDescription>
                            </Alert>
                          </CardFooter>
                        )}
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
