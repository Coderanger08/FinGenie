"use client";

import { useState, useTransition, useEffect } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip, Legend as RechartsLegend, Cell } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { PlusCircle, Trash2, Activity, Sparkles, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { PlannerOutputData } from "@/types";
import { getBudgetPlanAction } from "./actions";
import type { AdjustBudgetInput } from "@/ai/flows/budget-adjustment-planner";


const spendingItemSchema = z.object({
  category: z.string().min(1, "Category is required"),
  amount: z.coerce.number().min(0, "Amount must be non-negative"),
});

const goalItemSchema = z.object({
  goal: z.string().min(1, "Goal is required"),
  targetAmount: z.coerce.number().min(0, "Target amount must be non-negative"),
});

const plannerSchema = z.object({
  monthlyIncome: z.coerce.number().positive("Monthly income must be positive"),
  spending: z.array(spendingItemSchema).min(1, "At least one spending category is required"),
  goals: z.array(goalItemSchema).min(1, "At least one financial goal is required"),
  currentSavingsRate: z.coerce.number().min(0).max(100, "Savings rate must be between 0 and 100"),
  riskTolerance: z.enum(["low", "medium", "high"], { required_error: "Risk tolerance is required" }),
  lifestyleEventsNotes: z.string().optional(),
});

type PlannerFormData = z.infer<typeof plannerSchema>;


const chartConfig = {
  amount: { label: "Amount", color: "hsl(var(--chart-1))" },
} satisfies import("@/components/ui/chart").ChartConfig;


export default function BudgetPlannerPage() {
  const [plannerOutput, setPlannerOutput] = useState<PlannerOutputData | null>(null);
  const [isGenerating, startGenerationTransition] = useTransition();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);


  const form = useForm<PlannerFormData>({
    resolver: zodResolver(plannerSchema),
    defaultValues: {
      monthlyIncome: 5000,
      spending: [{ category: "Rent", amount: 1500 }, { category: "Groceries", amount: 400 }],
      goals: [{ goal: "Vacation Fund", targetAmount: 2000 }],
      currentSavingsRate: 10,
      riskTolerance: "medium",
      lifestyleEventsNotes: "",
    },
  });

  const { fields: spendingFields, append: appendSpending, remove: removeSpending } = useFieldArray({
    control: form.control,
    name: "spending",
  });

  const { fields: goalFields, append: appendGoal, remove: removeGoal } = useFieldArray({
    control: form.control,
    name: "goals",
  });

  const onSubmit = (data: PlannerFormData) => {
    startGenerationTransition(async () => {
      try {
        const inputForAI: AdjustBudgetInput = {
          income: data.monthlyIncome,
          spending: data.spending.reduce((obj, item) => { obj[item.category] = item.amount; return obj; }, {} as Record<string, number>),
          goals: data.goals.reduce((obj, item) => { obj[item.goal] = item.targetAmount; return obj; }, {} as Record<string, number>),
          savingsRate: data.currentSavingsRate,
          riskTolerance: data.riskTolerance,
          lifestyleEventsNotes: data.lifestyleEventsNotes || "No specific lifestyle events noted.",
        };
        const result = await getBudgetPlanAction(inputForAI);
        setPlannerOutput(result);
        toast({
          title: "Budget Plan Generated",
          description: "Your personalized budget plan is ready.",
        });
      } catch (error) {
        console.error("Failed to generate budget plan", error);
        toast({
          title: "Error Generating Plan",
          description: "Could not generate budget plan. Please try again.",
          variant: "destructive",
        });
      }
    });
  };
  
  const adjustedSpendingChartData = plannerOutput?.adjustedSpending 
    ? Object.entries(plannerOutput.adjustedSpending).map(([name, value], index) => ({ 
        name, 
        amount: value,
        fill: `hsl(var(--chart-${(index % 5) + 1}))` // Cycle through chart colors
      })) 
    : [];

  if (!mounted && plannerOutput) { // Prevent chart rendering server-side if data is present
     return null;
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-2 flex items-center gap-2"><Activity className="w-8 h-8 text-primary"/> AI Budget Planner</h1>
      <p className="text-muted-foreground mb-8">Optimize your budget with AI-powered recommendations.</p>

      <div className="grid gap-8 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Your Financial Information</CardTitle>
            <CardDescription>Provide details for a personalized plan.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <Label htmlFor="monthlyIncome">Monthly Income ($)</Label>
                <Input id="monthlyIncome" type="number" {...form.register("monthlyIncome")} />
                {form.formState.errors.monthlyIncome && <p className="text-sm text-destructive mt-1">{form.formState.errors.monthlyIncome.message}</p>}
              </div>

              <div>
                <Label>Monthly Spending</Label>
                {spendingFields.map((field, index) => (
                  <div key={field.id} className="flex gap-2 items-end mt-2">
                    <Input {...form.register(`spending.${index}.category`)} placeholder="Category" className="flex-1"/>
                    <Input type="number" {...form.register(`spending.${index}.amount`)} placeholder="Amount" className="w-28"/>
                    <Button type="button" variant="outline" size="icon" onClick={() => removeSpending(index)}><Trash2 className="h-4 w-4"/></Button>
                  </div>
                ))}
                {form.formState.errors.spending && <p className="text-sm text-destructive mt-1">{form.formState.errors.spending.message || form.formState.errors.spending.root?.message}</p>}
                <Button type="button" variant="outline" size="sm" onClick={() => appendSpending({ category: "", amount: 0 })} className="mt-2"><PlusCircle className="mr-2 h-4 w-4"/>Add Spending Category</Button>
              </div>
              
              <div>
                <Label>Financial Goals</Label>
                {goalFields.map((field, index) => (
                  <div key={field.id} className="flex gap-2 items-end mt-2">
                    <Input {...form.register(`goals.${index}.goal`)} placeholder="Goal" className="flex-1"/>
                    <Input type="number" {...form.register(`goals.${index}.targetAmount`)} placeholder="Target Amount" className="w-36"/>
                    <Button type="button" variant="outline" size="icon" onClick={() => removeGoal(index)}><Trash2 className="h-4 w-4"/></Button>
                  </div>
                ))}
                {form.formState.errors.goals && <p className="text-sm text-destructive mt-1">{form.formState.errors.goals.message || form.formState.errors.goals.root?.message}</p>}
                <Button type="button" variant="outline" size="sm" onClick={() => appendGoal({ goal: "", targetAmount: 0 })} className="mt-2"><PlusCircle className="mr-2 h-4 w-4"/>Add Financial Goal</Button>
              </div>

              <div>
                <Label htmlFor="currentSavingsRate">Current Savings Rate (%)</Label>
                <Input id="currentSavingsRate" type="number" {...form.register("currentSavingsRate")} />
                {form.formState.errors.currentSavingsRate && <p className="text-sm text-destructive mt-1">{form.formState.errors.currentSavingsRate.message}</p>}
              </div>

              <div>
                <Label htmlFor="riskTolerance">Risk Tolerance</Label>
                 <Controller
                    control={form.control}
                    name="riskTolerance"
                    render={({ field }) => (
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger id="riskTolerance">
                            <SelectValue placeholder="Select risk tolerance" />
                            </SelectTrigger>
                            <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            </SelectContent>
                        </Select>
                    )}
                />
                {form.formState.errors.riskTolerance && <p className="text-sm text-destructive mt-1">{form.formState.errors.riskTolerance.message}</p>}
              </div>

              <div>
                <Label htmlFor="lifestyleEventsNotes">Life Events Notes (Optional)</Label>
                <Textarea id="lifestyleEventsNotes" {...form.register("lifestyleEventsNotes")} placeholder="e.g., planning a wedding, new job" />
              </div>
              
              <Button type="submit" className="w-full" disabled={isGenerating}>
                {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                Generate Budget Plan
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>AI Generated Budget Plan</CardTitle>
            <CardDescription>Recommendations to optimize your finances.</CardDescription>
          </CardHeader>
          <CardContent>
            {isGenerating && (
              <div className="flex flex-col items-center justify-center h-64">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">Generating your personalized plan...</p>
              </div>
            )}
            {!isGenerating && !plannerOutput && (
              <div className="text-center py-10">
                  <Sparkles className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Fill out the form and click "Generate Budget Plan" to see your AI-powered recommendations.</p>
              </div>
            )}
            {plannerOutput && !isGenerating && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Summary</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">{plannerOutput.summary}</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Recommended Savings Rate</h3>
                  <p className="text-2xl font-bold text-accent">{plannerOutput.recommendedSavingsRate}%</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Adjusted Spending</h3>
                   {adjustedSpendingChartData.length > 0 ? (
                    <ChartContainer config={chartConfig} className="w-full h-[300px]">
                        <BarChart data={adjustedSpendingChartData} layout="vertical" margin={{ left: 20, right: 20 }}>
                            <CartesianGrid horizontal={false} />
                            <XAxis type="number" dataKey="amount" />
                            <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} strokeWidth={0} width={100} />
                            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                            <Bar dataKey="amount" radius={5}>
                                {adjustedSpendingChartData.map((entry) => (
                                    <Cell key={`cell-${entry.name}`} fill={entry.fill} />
                                ))}
                            </Bar>
                            <ChartLegend content={<ChartLegendContent />} />
                        </BarChart>
                    </ChartContainer>
                    ) : (
                        <p className="text-sm text-muted-foreground">No spending adjustments provided.</p>
                    )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Investment Allocation</h3>
                  {plannerOutput.investmentAllocation.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Asset Class</TableHead>
                          <TableHead className="text-right">Percentage</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {plannerOutput.investmentAllocation.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>{item.assetClass}</TableCell>
                            <TableCell className="text-right">{item.percentage}%</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-sm text-muted-foreground">No specific investment allocation provided.</p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
