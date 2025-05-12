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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { CalendarIcon, FileText, CircleDollarSign, Tag, ListFilter, PlusCircle, Loader2, CreditCardIcon, Edit, Trash2, GripVertical } from "lucide-react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import type { Transaction } from "@/types";
import { getAiCategorySuggestionAction } from "./actions";
import { Badge } from "@/components/ui/badge";
import { useCurrency } from "@/contexts/currency-context";
import { formatCurrency } from "@/lib/currency-utils";
import { useTransactions } from "@/contexts/transactions-context";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";


const transactionSchema = z.object({
  description: z.string().min(3, "Description must be at least 3 characters"),
  amount: z.coerce.number().positive("Amount must be a positive number"),
  date: z.date({ required_error: "Date is required" }),
  type: z.enum(["Income", "Expense"], { required_error: "Type is required" }),
  category: z.string().min(1, "Category is required"),
});

type TransactionFormData = z.infer<typeof transactionSchema>;

export default function TransactionsPage() {
  const { transactions, addTransaction, editTransaction, deleteTransaction } = useTransactions();
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [isSuggesting, startSuggestionTransition] = useTransition();
  const { toast } = useToast();
  const { selectedCurrency } = useCurrency();

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null);
  const [transactionToDeleteId, setTransactionToDeleteId] = useState<string | null>(null);


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
    if (descriptionWatch && descriptionWatch.length >= 3 && isFormModalOpen) {
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
  }, [descriptionWatch, startSuggestionTransition, isFormModalOpen]);

  const handleOpenAddModal = () => {
    setEditingTransactionId(null);
    form.reset({
      description: "",
      amount: 0,
      date: new Date(),
      type: "Expense",
      category: "",
    });
    setAiSuggestions([]);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (transaction: Transaction) => {
    setEditingTransactionId(transaction.id);
    form.reset({
      ...transaction,
      date: parseISO(transaction.date), // Convert string date back to Date object for Calendar
    });
    setAiSuggestions([]); // Clear suggestions initially for edit
    setIsFormModalOpen(true);
  };

  const handleDeleteClick = (transactionId: string) => {
    setTransactionToDeleteId(transactionId);
  };

  const confirmDelete = () => {
    if (transactionToDeleteId) {
      deleteTransaction(transactionToDeleteId);
      toast({
        title: "Transaction Deleted",
        description: "The transaction has been successfully deleted.",
      });
      setTransactionToDeleteId(null);
    }
  };
  

  const onSubmit = (data: TransactionFormData) => {
    if (editingTransactionId) {
      editTransaction(editingTransactionId, data);
      toast({
        title: "Transaction Updated",
        description: `${data.description} for ${formatCurrency(data.amount, selectedCurrency)} was successfully updated.`,
      });
    } else {
      addTransaction(data);
      toast({
        title: "Transaction Added",
        description: `${data.description} for ${formatCurrency(data.amount, selectedCurrency)} was successfully added.`,
      });
    }
    form.reset();
    setAiSuggestions([]);
    setIsFormModalOpen(false);
    setEditingTransactionId(null);
  };

  return (
    <div className="container mx-auto py-8">
      <Dialog open={isFormModalOpen} onOpenChange={setIsFormModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingTransactionId ? "Edit Transaction" : "Add New Transaction"}</DialogTitle>
            <CardDescription>Fill in the details of your transaction.</CardDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <div>
              <Label htmlFor="description" className="flex items-center gap-1 mb-1"><FileText className="w-4 h-4"/>Description</Label>
              <Input id="description" {...form.register("description")} placeholder="e.g., Groceries, Salary" />
              {form.formState.errors.description && <p className="text-sm text-destructive mt-1">{form.formState.errors.description.message}</p>}
              {isSuggesting && <p className="text-sm text-muted-foreground mt-1 flex items-center"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Suggesting categories...</p>}
              {aiSuggestions.length > 0 && !isSuggesting && (
                <div className="mt-2 space-x-1 space-y-1">
                  <span className="text-xs text-muted-foreground mr-1">Suggestions:</span>
                  {aiSuggestions.map(suggestion => (
                    <Button key={suggestion} type="button" variant="outline" size="sm" className="h-auto px-2 py-1 text-xs" onClick={() => form.setValue("category", suggestion, { shouldValidate: true })}>
                      {suggestion}
                    </Button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="amount" className="flex items-center gap-1 mb-1"><CircleDollarSign className="w-4 h-4"/>Amount ({selectedCurrency})</Label>
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
                  <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
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
            
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={form.formState.isSubmitting || isSuggesting}>
                {form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                {editingTransactionId ? "Save Changes" : "Add Transaction"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!transactionToDeleteId} onOpenChange={(isOpen) => !isOpen && setTransactionToDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the transaction.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setTransactionToDeleteId(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className={buttonVariants({variant: "destructive"})}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Transaction History</CardTitle>
            <CardDescription>View and manage your past transactions.</CardDescription>
          </div>
          <Button onClick={handleOpenAddModal} size="sm">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Transaction
          </Button>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
              <div className="text-center py-10 border-2 border-dashed border-muted rounded-lg">
                <CreditCardIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground font-semibold">No transactions yet.</p>
                <p className="text-sm text-muted-foreground mb-4">Add a transaction to get started.</p>
                <Button onClick={handleOpenAddModal}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add First Transaction
                </Button>
            </div>
          ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Amount ({selectedCurrency})</TableHead>
                <TableHead className="w-[50px] text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction) => (
                <TableRow key={transaction.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell>{format(parseISO(transaction.date), "MMM d, yyyy")}</TableCell>
                  <TableCell className="font-medium">{transaction.description}</TableCell>
                  <TableCell><Badge variant="secondary">{transaction.category}</Badge></TableCell>
                  <TableCell>
                    <Badge variant={transaction.type === 'Income' ? 'default' : 'destructive'} 
                            className={cn(transaction.type === 'Income' ? 'bg-green-500/80 hover:bg-green-500' : 'bg-red-500/80 hover:bg-red-500', 'text-white text-xs')}>
                      {transaction.type}
                    </Badge>
                  </TableCell>
                  <TableCell className={cn("text-right font-semibold", transaction.type === 'Income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400')}>
                    {transaction.type === 'Income' ? '+' : '-'}{formatCurrency(transaction.amount, selectedCurrency)}
                  </TableCell>
                  <TableCell className="text-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <GripVertical className="h-4 w-4" />
                           <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleOpenEditModal(transaction)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDeleteClick(transaction.id)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

