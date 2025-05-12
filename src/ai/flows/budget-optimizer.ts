
// 'use server';
'use server';
/**
 * @fileOverview This module defines a Genkit flow for AI-driven budget optimization.
 *
 * - optimizeBudget - A function to get budget optimization recommendations.
 * - OptimizeBudgetInput - The input type for the optimizeBudget function.
 * - OptimizeBudgetOutput - The output type for the optimizeBudget function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const OptimizeBudgetInputSchema = z.object({
  income: z.number().positive().describe('The user\u0027s total monthly income.'),
  currentSpending: z
    .record(z.number())
    .describe(
      'An object representing the user\u0027s current monthly spending, with categories as keys and amounts as values (e.g., {"Groceries": 300, "Rent": 1000}).'
    ),
  financialGoals: z
    .record(z.number())
    .describe(
      'An object representing the user\u0027s financial goals, with goal names as keys and target amounts as values (e.g., {"Vacation Fund": 2000, "Emergency Fund": 5000}).'
    ),
  currentSavingsRate: z
    .number()
    .min(0)
    .max(100)
    .describe(
      'The user\u0027s current monthly savings rate as a percentage (0-100).'
    ),
  riskTolerance: z
    .enum(['low', 'medium', 'high'])
    .describe(
      'The user\u0027s risk tolerance for investments (low, medium, or high).'
    ),
  lifestyleEventsNotes: z
    .string()
    .optional()
    .describe(
      'Optional notes about any significant upcoming lifestyle events or financial considerations (e.g., "planning a wedding", "expecting a child", "job change").'
    ),
});

export type OptimizeBudgetInput = z.infer<typeof OptimizeBudgetInputSchema>;

const GoalAchievementSchema = z.object({
    goalName: z.string().describe("Name of the financial goal."),
    currentAllocation: z.number().describe("Current monthly amount allocated towards this goal."),
    recommendedAllocation: z.number().describe("Recommended monthly amount to allocate."),
    timeToAchieveMonths: z.number().optional().describe("Estimated time in months to achieve the goal with recommended allocation, if applicable."),
    notes: z.string().optional().describe("Additional notes or advice specific to this goal."),
});

const OptimizeBudgetOutputSchema = z.object({
  summary: z
    .string()
    .describe(
      'A concise summary of the budget optimization recommendations and overall financial advice.'
    ),
  optimizedSpending: z
    .record(z.number())
    .describe(
      'An object representing the AI-recommended optimized monthly spending plan, with categories as keys and suggested amounts as values.'
    ),
  recommendedSavingsRate: z
    .number()
    .min(0)
    .max(100)
    .describe(
      'The AI-recommended monthly savings rate as a percentage (0-100).'
    ),
  investmentSuggestions: z
    .array(
      z.object({
        assetClass: z.string().describe('The suggested asset class (e.g., "Stocks", "Bonds", "Real Estate", "ETFs").'),
        percentage: z
          .number()
          .min(0)
          .max(100)
          .describe('The recommended allocation percentage for this asset class.'),
        rationale: z.string().optional().describe('Brief rationale for suggesting this asset class based on risk tolerance and goals.')
      })
    )
    .describe(
      'An array of investment suggestions, including asset class, recommended percentage allocation, and rationale. This should be tailored to the user\u0027s risk tolerance and financial goals.'
    ),
  actionableSteps: z
    .array(z.string())
    .describe(
      'A list of specific, actionable steps the user can take to implement the optimized budget and achieve their financial goals.'
    ),
  warningsOrConsiderations: z
    .array(z.string())
    .optional()
    .describe("Optional warnings, considerations, or potential downsides of the suggested plan."),
  goalAchievementAnalysis: z.array(GoalAchievementSchema)
    .optional()
    .describe("Analysis of how the optimized budget impacts the user's financial goals, including recommended allocations and estimated timelines if possible.")
});

export type OptimizeBudgetOutput = z.infer<typeof OptimizeBudgetOutputSchema>;

/**
 * Provides AI-driven budget optimization recommendations.
 * @param input - The input containing the user's financial information.
 * @returns The AI's optimized budget plan and advice.
 */
export async function optimizeBudget(
  input: OptimizeBudgetInput
): Promise<OptimizeBudgetOutput> {
  return optimizeBudgetFlow(input);
}

const optimizeBudgetPrompt = ai.definePrompt({
  name: 'optimizeBudgetPrompt',
  input: {schema: OptimizeBudgetInputSchema},
  output: {schema: OptimizeBudgetOutputSchema},
  prompt: `You are FinGenie, an expert AI Financial Optimizer. Your task is to analyze the user's financial situation and provide a comprehensive, actionable, and personalized budget optimization plan.

User's Financial Information:
- Monthly Income: {{income}}
- Current Monthly Spending:
{{#each currentSpending}}
  - {{@key}}: {{this}}
{{/each}}
- Financial Goals:
{{#each financialGoals}}
  - {{@key}}: (Target: {{this}})
{{/each}}
- Current Savings Rate: {{currentSavingsRate}}%
- Risk Tolerance: {{riskTolerance}}
{{#if lifestyleEventsNotes}}
- Lifestyle Events/Notes: {{{lifestyleEventsNotes}}}
{{/if}}

Based on this information, generate an optimized budget plan.

Your output MUST be a JSON object adhering to the OptimizeBudgetOutputSchema.

**Methodology for your recommendations (for your internal reasoning, do not include these formulas or this methodology description in the output JSON):**
1.  **Spending Optimization:**
    *   Analyze current spending habits to identify areas for reduction or reallocation.
    *   In your internal calculations, you can determine if the user is overspending. For example, you might:
        *   Calculate TotalCurrentSpending by summing all 'currentSpending' values.
        *   Estimate a TargetTotalSpending based on 'income' and the 'recommendedSavingsRate' (which you will also determine).
        *   Calculate SpendingAdjustmentNeeded = TotalCurrentSpending - TargetTotalSpending.
        *   If SpendingAdjustmentNeeded is positive (indicating overspending), your 'optimizedSpending' suggestions in the JSON output should distribute this reduction across flexible spending categories.
        *   If SpendingAdjustmentNeeded is negative (indicating underspending), this surplus can be allocated to savings or goals in your recommendations.
    *   The final 'optimizedSpending' field in your JSON output should reflect these adjustments. Ensure 'optimizedSpending' is a record of category names (string) to suggested amounts (number).

2.  **Savings Rate Recommendation:**
    *   Suggest a 'recommendedSavingsRate' (0-100%) that aligns with the user's income, goals, and risk tolerance. This should be a single number.

3.  **Investment Suggestions:**
    *   Generate 'investmentSuggestions' based on the user's risk tolerance and financial goals.
    *   Suggest 2-4 asset classes (e.g., "ETFs (Broad Market)", "High-Yield Savings Account", "Stocks (Growth-focused)", "Bonds (Government)").
    *   For each, provide a 'assetClass' (string), 'percentage' (number 0-100) allocation, and an optional 'rationale' (string). The sum of percentages should ideally be 100% of the portion of savings designated for investment. This should be an array of objects.

4.  **Actionable Steps:**
    *   List 3-5 clear, 'actionableSteps' the user can take. This should be an array of strings.

5.  **Analyze Goal Achievement:**
    *   For each goal in 'financialGoals', provide a 'goalAchievementAnalysis'.
    *   This should be an array of objects, each with 'goalName' (string), 'currentAllocation' (number, estimate this based on current spending and savings if possible, or state if not directly inferable), 'recommendedAllocation' (number, how much from their new budget should go to this goal), 'timeToAchieveMonths' (optional number), and 'notes' (optional string).

6.  **Add Warnings/Considerations:**
    *   Include any 'warningsOrConsiderations' as an array of strings, if the plan involves significant changes or risks.

**General Guidelines:**
*   **Personalization:** Tailor all recommendations directly to the user's provided data.
*   **Clarity:** Use clear, concise language. Avoid jargon where possible, or explain it.
*   **Positive Tone:** Be encouraging and supportive.
*   **Mathematical Soundness:** Ensure your recommendations are mathematically plausible (e.g., total optimized spending + savings should not exceed income).
*   **Prioritization:** If goals conflict with available funds, suggest prioritization or phased approaches.

Focus on providing a robust, helpful, and well-structured JSON output that strictly matches the OptimizeBudgetOutputSchema.
Do not use markdown like '*' or '-' for lists within string fields of the JSON; use arrays of strings for lists like 'actionableSteps' and 'warningsOrConsiderations'.
Do not include any of the calculation descriptions, formulas, or the "Methodology for your recommendations" section in your final JSON output. The JSON output should start directly with the fields defined in OptimizeBudgetOutputSchema (e.g. "summary": "...", "optimizedSpending": {...}, etc.).
`,
});

const optimizeBudgetFlow = ai.defineFlow(
  {
    name: 'optimizeBudgetFlow',
    inputSchema: OptimizeBudgetInputSchema,
    outputSchema: OptimizeBudgetOutputSchema,
  },
  async (input: OptimizeBudgetInput) => {
    const {output} = await optimizeBudgetPrompt(input);
    if (!output) {
      // Fallback or error handling if AI output is critically flawed or missing
      // This should align with the OptimizeBudgetOutputSchema structure
      console.error("OptimizeBudgetFlow: AI output was null or undefined. Input was:", JSON.stringify(input, null, 2));
      return {
        summary: "I'm sorry, I encountered an issue generating a full budget plan at this moment. Please check your inputs or try again. As a general tip, reviewing your non-essential spending is often a good first step to optimize your budget.",
        optimizedSpending: input.currentSpending, // Return original spending
        recommendedSavingsRate: input.currentSavingsRate, // Return original savings rate
        investmentSuggestions: [],
        actionableSteps: ["Review your current spending categories for potential savings.", "Ensure your financial goals are specific and measurable."],
        warningsOrConsiderations: ["The AI could not generate a detailed plan. This is a fallback response."],
        goalAchievementAnalysis: input.financialGoals ? Object.keys(input.financialGoals).map(goalName => ({
            goalName,
            currentAllocation: 0, // Cannot infer
            recommendedAllocation: 0, // Cannot recommend
            notes: "Detailed analysis unavailable due to an error."
        })) : []
      };
    }
    return output;
  }
);

    
