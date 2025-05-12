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

// Internal schema for the prompt, including pre-formatted strings
const AdjustBudgetPromptInputSchema = AdjustBudgetInputSchema.extend({
  spendingString: z.string().describe('A string representation of spending categories and amounts (e.g., "Food: 500; Rent: 1500").'),
  goalsString: z.string().describe('A string representation of financial goals and target amounts (e.g., "Vacation: 2000; Emergency Fund: 5000").'),
});
type AdjustBudgetPromptInput = z.infer<typeof AdjustBudgetPromptInputSchema>;


export async function adjustBudget(input: AdjustBudgetInput): Promise<AdjustBudgetOutput> {
  return adjustBudgetFlow(input);
}

const adjustBudgetPrompt = ai.definePrompt({
  name: 'adjustBudgetPrompt',
  input: {schema: AdjustBudgetPromptInputSchema}, // Use the new schema for prompt input
  output: {schema: AdjustBudgetOutputSchema},
  prompt: `You are FinGenie, an expert AI Financial Guidor. Your mission is to help the user make sound financial decisions by creating a personalized and actionable budget plan.

  Analyze the user's financial information meticulously:
  - Monthly Income: {{{income}}}
  - Current Spending Categories and Amounts: {{{spendingString}}}
  - Financial Goals and Target Amounts: {{{goalsString}}}
  - Current Savings Rate: {{{savingsRate}}}%
  - Risk Tolerance: {{{riskTolerance}}}
  - Lifestyle Events Notes: {{{lifestyleEventsNotes}}}

  Based on this, craft a comprehensive financial plan. Your recommendations should empower the user to make informed decisions.

  Your plan must include:
  1.  **Adjusted Spending Plan:**
      *   Provide specific, adjusted spending amounts for each relevant category found in "Current Spending Categories and Amounts". If a category from the input is not mentioned in your adjusted plan, assume its spending remains unchanged.
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
    inputSchema: AdjustBudgetInputSchema, // Flow still takes original input
    outputSchema: AdjustBudgetOutputSchema,
  },
  async (input: AdjustBudgetInput): Promise<AdjustBudgetOutput> => {
    const spendingString = Object.entries(input.spending)
      .map(([category, amount]) => `${category}: ${amount}`)
      .join('; ');
    const goalsString = Object.entries(input.goals)
      .map(([goal, amount]) => `${goal}: ${amount}`)
      .join('; ');

    const promptInput: AdjustBudgetPromptInput = {
      ...input,
      spendingString,
      goalsString,
    };

    const {output} = await adjustBudgetPrompt(promptInput);
    
    if (!output) {
      // This case should ideally be rare if the LLM and prompt are well-behaved,
      // as Zod validation on the output schema should catch mismatches.
      // However, if the LLM returns completely unparsable or no data:
      console.error('AI failed to generate a budget plan. Output was null or undefined after prompt execution.');
      return {
        summary: "I'm sorry, I couldn't generate a complete budget plan at this moment. Please check your inputs or try again later.",
        adjustedSpending: {}, // Return empty or original spending
        recommendedSavingsRate: input.savingsRate, // Return original rate
        investmentAllocation: [],
      };
    }
    // Genkit's 'definePrompt' with an output schema handles Zod validation.
    // If 'output' is returned, it should conform to AdjustBudgetOutputSchema.
    return output;
  }
);

