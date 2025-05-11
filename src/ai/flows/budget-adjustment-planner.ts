'use server';
/**
 * @fileOverview Provides AI-driven recommendations to adjust a user's budget for increased savings and improved financial health.
 *
 * - adjustBudget - An exported function that receives user's financial information and calls adjustBudgetFlow to provide budget adjustment recommendations.
 * - AdjustBudgetInput - The input type for the adjustBudget function.
 * - AdjustBudgetOutput - The return type for the adjustBudget function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AdjustBudgetInputSchema = z.object({
  income: z.number().describe('Monthly income.'),
  spending: z.record(z.number()).describe('Spending categories and amounts.'),
  goals: z.record(z.number()).describe('Financial goals and target amounts.'),
  savingsRate: z.number().describe('Current savings rate (percentage).'),
  riskTolerance: z.enum(['low', 'medium', 'high']).describe('Risk tolerance level.'),
  lifestyleEventsNotes: z.string().describe('Any significant lifestyle changes.'),
});
export type AdjustBudgetInput = z.infer<typeof AdjustBudgetInputSchema>;

const AdjustBudgetOutputSchema = z.object({
  adjustedSpending: z.record(z.number()).describe('Adjusted spending amounts by category.'),
  recommendedSavingsRate: z.number().describe('Recommended savings rate.'),
  investmentAllocation: z.array(z.object({
    assetClass: z.string(),
    percentage: z.number(),
  })).describe('Investment allocation strategy.'),
  summary: z.string().describe('Summary of the budget plan and recommendations.'),
});
export type AdjustBudgetOutput = z.infer<typeof AdjustBudgetOutputSchema>;

export async function adjustBudget(input: AdjustBudgetInput): Promise<AdjustBudgetOutput> {
  return adjustBudgetFlow(input);
}

const adjustBudgetPrompt = ai.definePrompt({
  name: 'adjustBudgetPrompt',
  input: {schema: AdjustBudgetInputSchema},
  output: {schema: AdjustBudgetOutputSchema},
  prompt: `You are a financial advisor providing personalized budget recommendations.

  Analyze the user's income, spending, goals, savings rate, risk tolerance and lifestyle events to provide specific advice on how to adjust their budget to increase savings and improve overall financial health.

  Here's the user's financial information:
  Monthly Income: {{{income}}}
  Spending Categories and Amounts: {{#each (keys spending)}}{{{this}}}: {{{lookup ../spending this}}} {{/each}}
  Financial Goals and Target Amounts: {{#each (keys goals)}}{{{this}}}: {{{lookup ../goals this}}} {{/each}}
  Savings Rate: {{{savingsRate}}}%
  Risk Tolerance: {{{riskTolerance}}}
  Lifestyle Events Notes: {{{lifestyleEventsNotes}}}

  Consider these factors when creating your recommendations. Use the following formula to rebalance the budget dynamically:
  NewBudget = (TotalBudget - OverspentAmount) / RemainingCategories

  Provide concrete steps and amounts for budget adjustments.
  Indicate savings rate.
  Suggest investment allocation strategy, including asset classes and percentages.
  Summarize your advice in a clear and concise manner.
  
  Ensure the response is well formatted and easy to understand.
  `, 
});

const adjustBudgetFlow = ai.defineFlow(
  {
    name: 'adjustBudgetFlow',
    inputSchema: AdjustBudgetInputSchema,
    outputSchema: AdjustBudgetOutputSchema,
  },
  async input => {
    const {output} = await adjustBudgetPrompt(input);
    return output!;
  }
);
