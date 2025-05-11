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
  adjustedSpending: z.record(z.number()).describe('Adjusted spending amounts by category, with explanations for changes.'),
  recommendedSavingsRate: z.number().describe('Recommended savings rate, with justification.'),
  investmentAllocation: z.array(z.object({
    assetClass: z.string(),
    percentage: z.number(),
    rationale: z.string().describe('Rationale for this specific asset class allocation based on risk tolerance and goals.'),
  })).describe('Investment allocation strategy with rationale for each allocation.'),
  summary: z.string().describe('Comprehensive summary of the budget plan, decision-making advice, and key recommendations for achieving financial goals.'),
});
export type AdjustBudgetOutput = z.infer<typeof AdjustBudgetOutputSchema>;

export async function adjustBudget(input: AdjustBudgetInput): Promise<AdjustBudgetOutput> {
  return adjustBudgetFlow(input);
}

const adjustBudgetPrompt = ai.definePrompt({
  name: 'adjustBudgetPrompt',
  input: {schema: AdjustBudgetInputSchema},
  output: {schema: AdjustBudgetOutputSchema},
  prompt: `You are FinGenie, an expert AI Financial Guidor. Your mission is to help the user make sound financial decisions by creating a personalized and actionable budget plan.

  Analyze the user's financial information meticulously:
  - Monthly Income: {{{income}}}
  - Current Spending Categories and Amounts: {{#each (keys spending)}}{{{this}}}: {{{lookup ../spending this}}}{{/each}}
  - Financial Goals and Target Amounts: {{#each (keys goals)}}{{{this}}}: {{{lookup ../goals this}}}{{/each}}
  - Current Savings Rate: {{{savingsRate}}}%
  - Risk Tolerance: {{{riskTolerance}}}
  - Lifestyle Events Notes: {{{lifestyleEventsNotes}}}

  Based on this, craft a comprehensive financial plan. Your recommendations should empower the user to make informed decisions.

  Your plan must include:
  1.  **Adjusted Spending Plan:**
      *   Provide specific, adjusted spending amounts for each relevant category.
      *   For any category you suggest adjusting, clearly explain *why* this change is recommended and how it contributes to their overall financial health or goals.
      *   If you use a formula for rebalancing (e.g., NewBudget = (TotalBudget - OverspentAmount) / RemainingCategories), explain its application.
  2.  **Recommended Savings Rate:**
      *   State the new recommended savings rate.
      *   Justify this rate based on their income, goals, and desired financial improvements. Explain how this rate helps them achieve their goals.
  3.  **Investment Allocation Strategy:**
      *   Suggest a diversified investment allocation (asset classes and percentages).
      *   For each asset class, provide a clear rationale explaining *why* it's suitable for the user, considering their stated risk tolerance and financial goals. For example, if suggesting equities for a user with high risk tolerance, explain how this aligns.
  4.  **Comprehensive Summary and Decision-Making Advice:**
      *   Summarize the key aspects of the proposed budget plan.
      *   Offer actionable advice to help the user implement these changes.
      *   Guide their decision-making by highlighting the trade-offs and benefits of the proposed adjustments. For instance, "Reducing spending in X category by Y amount will allow you to achieve Z goal N months sooner."
      *   Maintain a supportive and guiding tone throughout.

  Ensure your output is a JSON object strictly adhering to the AdjustBudgetOutputSchema. The explanations and rationales are crucial for helping the user understand and commit to the plan.
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
