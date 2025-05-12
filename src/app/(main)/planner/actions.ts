
"use server";
import { optimizeBudget, type OptimizeBudgetInput, type OptimizeBudgetOutput } from '@/ai/flows/budget-optimizer';

export async function getBudgetPlanAction(input: OptimizeBudgetInput): Promise<OptimizeBudgetOutput> {
  try {
    const result = await optimizeBudget(input);
    // The optimizeBudget flow itself now handles the case where AI output is critically flawed
    // and returns a default error structure conforming to OptimizeBudgetOutput.
    // So, we can generally trust 'result' to be in the correct shape here,
    // or it will be the error shape from the flow.
    return result;
  } catch (error) {
    console.error("Error in getBudgetPlanAction:", error);
    // This catch block handles unexpected errors during the flow execution
    // or if the flow throws an error explicitly.
    // We need to ensure the returned error object matches OptimizeBudgetOutput schema
    // Fallback values should align with the OptimizeBudgetOutput schema structure
    return {
      summary: "An unexpected error occurred while generating the budget plan. Please try again later.",
      optimizedSpending: input.currentSpending, // Return original spending on error
      recommendedSavingsRate: input.currentSavingsRate, // Return original savings rate
      investmentSuggestions: [],
      actionableSteps: ["Unable to generate actionable steps due to an error."],
      // Ensure all fields from OptimizeBudgetOutput are present, even if empty/default
      warningsOrConsiderations: [], 
      goalAchievementAnalysis: [] 
    };
  }
}
