"use client";

import { useState, useEffect, useTransition } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CalendarIcon, FileText, CircleDollarSign, Tag, ListFilter, PlusCircle, Loader2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import type { Transaction } from "@/types";
import { getAiCategorySuggestionAction } from "./actions";
import { Badge } from "@/components/ui/badge";

const transactionSchema = z.object({
  description: z.string().min(3, "Description must be at least 3 characters"),
  amount: z.coerce.number().positive("Amount must be a positive number"),
  date: z.date({ required_error: "Date is required" }),
  type: z.enum(["Income", "Expense"], { required_error: "Type is required" }),
  category: z.string().min(1, "Category is required"),
});

type TransactionFormData = z.infer<typeof transactionSchema>;

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [isSuggesting, startSuggestionTransition] = useTransition();
  const { toast } = useToast();

  const form = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      description: "",
      amount: 0,
      date: new Date(),
      type: "Expense",
      category: "",
    },
  });

  const descriptionWatch = useWatch({ control: form.control, name: "description" });

  useEffect(() => {
    if (descriptionWatch && descriptionWatch.length >= 3) {
      startSuggestionTransition(async () => {
        try {
          const result = await getAiCategorySuggestionAction({ transactionDescription: descriptionWatch });
          setAiSuggestions(result.suggestedCategories.map(sc => sc.category).slice(0,3));
        } catch (error) {
          console.error("Failed to get AI suggestions", error);
          setAiSuggestions([]);
        }
      });
    } else {
      setAiSuggestions([]);
    }
  }, [descriptionWatch]);

  const onSubmit = (data: TransactionFormData) => {
    const newTransaction: Transaction = {
      id: Date.now().toString(),
      ...data,
      date: format(data.date, "yyyy-MM-dd"),
    };
    setTransactions((prev) => [newTransaction, ...prev]);
    toast({
      title: "Transaction Added",
      description: `${data.description} for $${data.amount} was successfully added.`,
      variant: "default",
    });
    form.reset();
    setAiSuggestions([]);
  };

  return (
    <div className="container mx-auto py-8">
      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Add New Transaction</CardTitle>
              <CardDescription>Fill in the details of your transaction.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div>
                  <Label htmlFor="description" className="flex items-center gap-1 mb-1"><FileText className="w-4 h-4"/>Description</Label>
                  <Input id="description" {...form.register("description")} placeholder="e.g., Groceries, Salary" />
                  {form.formState.errors.description && <p className="text-sm text-destructive mt-1">{form.formState.errors.description.message}</p>}
                  {isSuggesting && <p className="text-sm text-muted-foreground mt-1 flex items-center"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Suggesting categories...</p>}
                  {aiSuggestions.length > 0 && !isSuggesting && (
                    <div className="mt-2 space-x-2">
                      <span className="text-sm text-muted-foreground">Suggestions:</span>
                      {aiSuggestions.map(suggestion => (
                        <Button key={suggestion} type="button" variant="outline" size="sm" onClick={() => form.setValue("category", suggestion)}>
                          {suggestion}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="amount" className="flex items-center gap-1 mb-1"><CircleDollarSign className="w-4 h-4"/>Amount</Label>
                  <Input id="amount" type="number" step="0.01" {...form.register("amount")} placeholder="0.00" />
                  {form.formState.errors.amount && <p className="text-sm text-destructive mt-1">{form.formState.errors.amount.message}</p>}
                </div>

                <div>
                  <Label htmlFor="date" className="flex items-center gap-1 mb-1"><CalendarIcon className="w-4 h-4"/>Date</Label>
                  <Controller
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    )}
                  />
                  {form.formState.errors.date && <p className="text-sm text-destructive mt-1">{form.formState.errors.date.message}</p>}
                </div>

                <div>
                  <Label htmlFor="type" className="flex items-center gap-1 mb-1"><ListFilter className="w-4 h-4"/>Type</Label>
                  <Controller
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger id="type">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Income">Income</SelectItem>
                          <SelectItem value="Expense">Expense</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {form.formState.errors.type && <p className="text-sm text-destructive mt-1">{form.formState.errors.type.message}</p>}
                </div>

                <div>
                  <Label htmlFor="category" className="flex items-center gap-1 mb-1"><Tag className="w-4 h-4"/>Category</Label>
                  <Input id="category" {...form.register("category")} placeholder="e.g., Food, Utilities" />
                  {form.formState.errors.category && <p className="text-sm text-destructive mt-1">{form.formState.errors.category.message}</p>}
                </div>
                
                <Button type="submit" className="w-full" disabled={form.formState.isSubmitting || isSuggesting}>
                  {form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                  Add Transaction
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>View and manage your past transactions.</CardDescription>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                 <div className="text-center py-10">
                    <CreditCard className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No transactions yet.</p>
                    <p className="text-sm text-muted-foreground">Add a transaction to get started.</p>
                </div>
              ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>{format(parseISO(transaction.date), "MMM d, yyyy")}</TableCell>
                      <TableCell className="font-medium">{transaction.description}</TableCell>
                      <TableCell><Badge variant="secondary">{transaction.category}</Badge></TableCell>
                      <TableCell>
                        <Badge variant={transaction.type === 'Income' ? 'default' : 'destructive'} 
                               className={cn(transaction.type === 'Income' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600', 'text-white')}>
                          {transaction.type}
                        </Badge>
                      </TableCell>
                      <TableCell className={cn("text-right", transaction.type === 'Income' ? 'text-green-600' : 'text-red-600')}>
                        {transaction.type === 'Income' ? '+' : '-'}${transaction.amount.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
