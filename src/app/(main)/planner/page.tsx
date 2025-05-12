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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { PlusCircle, Trash2, Activity, Sparkles, Loader2, ListChecks, AlertTriangleIcon, TargetIcon, Lightbulb } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getBudgetPlanAction } from "./actions";
import type { OptimizeBudgetInput, OptimizeBudgetOutput } from "@/ai/flows/budget-optimizer";
import { useCurrency } from "@/contexts/currency-context";
import { formatCurrency } from "@/lib/currency-utils";
import { Badge } from "@/components/ui/badge";

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
  currentSpending: z.array(spendingItemSchema).min(1, "At least one spending category is required"),
  financialGoals: z.array(goalItemSchema).min(1, "At least one financial goal is required"),
  currentSavingsRate: z.coerce.number().min(0).max(100, "Savings rate must be between 0 and 100"),
  riskTolerance: z.enum(["low", "medium", "high"], { required_error: "Risk tolerance is required" }),
  lifestyleEventsNotes: z.string().optional(),
});

type PlannerFormData = z.infer<typeof plannerSchema>;


const chartConfigBase = {
  amount: { label: "Amount" }, 
} satisfies import("@/components/ui/chart").ChartConfig;


export default function BudgetPlannerPage() {
  const [plannerOutput, setPlannerOutput] = useState<OptimizeBudgetOutput | null>(null);
  const [isGenerating, startGenerationTransition] = useTransition();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  const { selectedCurrency } = useCurrency();

  useEffect(() => setMounted(true), []);


  const form = useForm<PlannerFormData>({
    resolver: zodResolver(plannerSchema),
    defaultValues: {
      monthlyIncome: 5000,
      currentSpending: [{ category: "Rent", amount: 1500 }, { category: "Groceries", amount: 400 }, {category: "Entertainment", amount: 200}],
      financialGoals: [{ goal: "Vacation Fund", targetAmount: 2000 }, {goal: "New Laptop", targetAmount: 1200}],
      currentSavingsRate: 10,
      riskTolerance: "medium",
      lifestyleEventsNotes: "",
    },
  });

  const { fields: spendingFields, append: appendSpending, remove: removeSpending } = useFieldArray({
    control: form.control,
    name: "currentSpending",
  });

  const { fields: goalFields, append: appendGoal, remove: removeGoal } = useFieldArray({
    control: form.control,
    name: "financialGoals",
  });

  const onSubmit = (data: PlannerFormData) => {
    startGenerationTransition(async () => {
      try {
        const inputForAI: OptimizeBudgetInput = {
          income: data.monthlyIncome,
          currentSpending: data.currentSpending.reduce((obj, item) => { obj[item.category] = item.amount; return obj; }, {} as Record<string, number>),
          financialGoals: data.financialGoals.reduce((obj, item) => { obj[item.goal] = item.targetAmount; return obj; }, {} as Record<string, number>),
          currentSavingsRate: data.currentSavingsRate,
          riskTolerance: data.riskTolerance,
          lifestyleEventsNotes: data.lifestyleEventsNotes || undefined,
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
  
  const optimizedSpendingChartData = plannerOutput?.optimizedSpending
    ? plannerOutput.optimizedSpending.map((item, index) => ({
        name: item.category, // Map category to name for the chart
        amount: item.amount,
        fill: `hsl(var(--chart-${(index % 5) + 1}))`
      }))
    : [];
  
  const chartTooltipFormatter = (value: unknown) => {
    if (typeof value === 'number') {
      return formatCurrency(value, selectedCurrency);
    }
    return String(value);
  };

   if (!mounted && !isGenerating && !plannerOutput) { 
     return <div className="container mx-auto py-8 animate-pulse">
       <div className="h-8 bg-muted rounded w-1/3 mb-2"></div>
       <div className="h-4 bg-muted rounded w-1/2 mb-8"></div>
       <div className="grid gap-8 lg:grid-cols-3">
          <Card className="lg:col-span-1 h-[600px] bg-muted"></Card>
          <Card className="lg:col-span-2 h-[600px] bg-muted"></Card>
       </div>
     </div>;
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-2 flex items-center gap-2"><Activity className="w-8 h-8 text-primary"/> AI Budget Planner</h1>
      <p className="text-muted-foreground mb-8">Optimize your budget with AI-powered recommendations.</p>

      <div className="grid gap-8 lg:grid-cols-3">
        <Card className="lg:col-span-1 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader>
            <CardTitle>Your Financial Information</CardTitle>
            <CardDescription>Provide details for a personalized plan.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <Label htmlFor="monthlyIncome">Monthly Income ({selectedCurrency})</Label>
                <Input id="monthlyIncome" type="number" {...form.register("monthlyIncome")} />
                {form.formState.errors.monthlyIncome && <p className="text-sm text-destructive mt-1">{form.formState.errors.monthlyIncome.message}</p>}
              </div>

              <div>
                <Label>Monthly Spending ({selectedCurrency})</Label>
                {spendingFields.map((field, index) => (
                  <div key={field.id} className="flex gap-2 items-end mt-2">
                    <Input {...form.register(`currentSpending.${index}.category`)} placeholder="Category" className="flex-1"/>
                    <Input type="number" {...form.register(`currentSpending.${index}.amount`)} placeholder="Amount" className="w-28"/>
                    <Button type="button" variant="outline" size="icon" onClick={() => removeSpending(index)} className="hover:bg-destructive/10 hover:border-destructive hover:text-destructive"><Trash2 className="h-4 w-4"/></Button>
                  </div>
                ))}
                 {form.formState.errors.currentSpending?.root && <p className="text-sm text-destructive mt-1">{form.formState.errors.currentSpending.root.message}</p>}
                {form.formState.errors.currentSpending?.map((err, idx) => (
                    (err?.category || err?.amount) && <p key={idx} className="text-sm text-destructive mt-1">{err?.category?.message || err?.amount?.message}</p>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => appendSpending({ category: "", amount: 0 })} className="mt-2"><PlusCircle className="mr-2 h-4 w-4"/>Add Spending</Button>
              </div>
              
              <div>
                <Label>Financial Goals ({selectedCurrency})</Label>
                {goalFields.map((field, index) => (
                  <div key={field.id} className="flex gap-2 items-end mt-2">
                    <Input {...form.register(`financialGoals.${index}.goal`)} placeholder="Goal" className="flex-1"/>
                    <Input type="number" {...form.register(`financialGoals.${index}.targetAmount`)} placeholder="Target" className="w-36"/>
                    <Button type="button" variant="outline" size="icon" onClick={() => removeGoal(index)} className="hover:bg-destructive/10 hover:border-destructive hover:text-destructive"><Trash2 className="h-4 w-4"/></Button>
                  </div>
                ))}
                {form.formState.errors.financialGoals?.root && <p className="text-sm text-destructive mt-1">{form.formState.errors.financialGoals.root.message}</p>}
                 {form.formState.errors.financialGoals?.map((err, idx) => (
                    (err?.goal || err?.targetAmount) && <p key={idx} className="text-sm text-destructive mt-1">{err?.goal?.message || err?.targetAmount?.message}</p>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => appendGoal({ goal: "", targetAmount: 0 })} className="mt-2"><PlusCircle className="mr-2 h-4 w-4"/>Add Goal</Button>
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

        <Card className="lg:col-span-2 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader>
            <CardTitle>AI Generated Budget Plan</CardTitle>
            <CardDescription>Recommendations to optimize your finances.</CardDescription>
          </CardHeader>
          <CardContent>
            {isGenerating && (
              <div className="flex flex-col items-center justify-center h-64">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">FinGenie is crafting your personalized plan...</p>
              </div>
            )}
            {!isGenerating && !plannerOutput && (
              <div className="text-center py-10">
                  <Sparkles className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Fill out the form and click "Generate Budget Plan" to see your AI-powered recommendations.</p>
              </div>
            )}
            {plannerOutput && !isGenerating && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-xl font-semibold mb-2 flex items-center gap-2"><Lightbulb className="w-5 h-5 text-yellow-500"/>Summary & Advice</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed bg-muted p-4 rounded-lg">{plannerOutput.summary}</p>
                </div>
                <div className="bg-gradient-to-r from-primary/10 to-accent/10 p-4 rounded-lg shadow">
                  <h3 className="text-lg font-semibold mb-1">Recommended Savings Rate</h3>
                  <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">{plannerOutput.recommendedSavingsRate.toFixed(1)}%</p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-3">Adjusted Spending Plan ({selectedCurrency})</h3>
                   {optimizedSpendingChartData.length > 0 ? (
                    <ChartContainer config={chartConfigBase} className="w-full h-[350px] min-h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={optimizedSpendingChartData} layout="vertical" margin={{ left: 25, right: 25, top:5, bottom:5 }}>
                            <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                            <XAxis type="number" dataKey="amount" tickFormatter={(value) => chartTooltipFormatter(value)} axisLine={false} tickLine={false} fontSize="10px"/>
                            <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} strokeDasharray="0" width={100} fontSize="10px"/>
                            <ChartTooltip 
                                cursor={{fill: 'hsl(var(--muted))', radius: 5}} 
                                content={
                                    <ChartTooltipContent 
                                        formatter={(value, name) => [chartTooltipFormatter(value), name as string]} 
                                        itemStyle={{fontSize: '10px'}}
                                        labelStyle={{fontSize: '10px', fontWeight: 'bold'}}
                                    />
                                } 
                            />
                            <Bar dataKey="amount" radius={[0, 5, 5, 0]} barSize={15}>
                                {optimizedSpendingChartData.map((entry) => (
                                    <Cell key={`cell-${entry.name}`} fill={entry.fill} className="focus:outline-none focus:ring-1 focus:ring-ring focus:ring-offset-1"/>
                                ))}
                            </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                    ) : (
                        <p className="text-sm text-muted-foreground">No spending adjustments provided by AI or an error occurred.</p>
                    )}
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-3">Investment Allocation</h3>
                  {plannerOutput.investmentSuggestions && plannerOutput.investmentSuggestions.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Asset Class</TableHead>
                          <TableHead>Percentage</TableHead>
                          <TableHead>Rationale</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {plannerOutput.investmentSuggestions.map((item, index) => (
                          <TableRow key={index} className="hover:bg-muted/50">
                            <TableCell className="font-medium">{item.assetClass}</TableCell>
                            <TableCell className="font-medium">{item.percentage.toFixed(1)}%</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{item.rationale || "-"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-sm text-muted-foreground">No specific investment allocation provided by AI or an error occurred.</p>
                  )}
                </div>

                {plannerOutput.actionableSteps && plannerOutput.actionableSteps.length > 0 && (
                     <div>
                        <h3 className="text-xl font-semibold mb-3 flex items-center gap-2"><ListChecks className="w-5 h-5 text-blue-500"/> Actionable Steps</h3>
                        <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
                            {plannerOutput.actionableSteps.map((step, index) => (
                                <li key={index}>{step}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {plannerOutput.goalAchievementAnalysis && plannerOutput.goalAchievementAnalysis.length > 0 && (
                  <div>
                    <h3 className="text-xl font-semibold mb-3 flex items-center gap-2"><TargetIcon className="w-5 h-5 text-green-500"/> Goal Achievement Analysis</h3>
                     <Accordion type="single" collapsible className="w-full">
                      {plannerOutput.goalAchievementAnalysis.map((goal, index) => (
                        <AccordionItem value={`goal-${index}`} key={index}>
                          <AccordionTrigger className="text-base hover:no-underline">
                            {goal.goalName}
                          </AccordionTrigger>
                          <AccordionContent className="space-y-2 text-sm">
                            <p><strong>Current Allocation:</strong> {formatCurrency(goal.currentAllocation, selectedCurrency)}</p>
                            <p><strong>Recommended Allocation:</strong> {formatCurrency(goal.recommendedAllocation, selectedCurrency)}</p>
                            {goal.timeToAchieveMonths !== undefined && <p><strong>Est. Time to Achieve:</strong> {goal.timeToAchieveMonths} months</p>}
                            {goal.notes && <p className="mt-1 text-muted-foreground italic"><strong>Notes:</strong> {goal.notes}</p>}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </div>
                )}

                {plannerOutput.warningsOrConsiderations && plannerOutput.warningsOrConsiderations.length > 0 && (
                     <div>
                        <h3 className="text-xl font-semibold mb-3 flex items-center gap-2"><AlertTriangleIcon className="w-5 h-5 text-orange-500"/> Warnings & Considerations</h3>
                        <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
                            {plannerOutput.warningsOrConsiderations.map((warning, index) => (
                                <li key={index}>{warning}</li>
                            ))}
                        </ul>
                    </div>
                )}

              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

