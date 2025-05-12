
"use server";
import { optimizeBudget, type OptimizeBudgetInput, type OptimizeBudgetOutput } from '@/ai/flows/budget-optimizer';

export async function getBudgetPlanAction(input: OptimizeBudgetInput): Promise<OptimizeBudgetOutput> {
  try {
    console.log("getBudgetPlanAction called with input:", JSON.stringify(input, null, 2));
    const result = await optimizeBudget(input);
    // Check for a key field like summary to validate the result structure
    if (!result || !result.summary) {
        console.error("getBudgetPlanAction: AI result is invalid or missing summary. Result:", result);
        // This fallback should align with OptimizeBudgetOutput schema
        return {
            summary: "I'm sorry, I encountered an issue generating a full budget plan at this moment. The AI response was not in the expected format. Please check your inputs or try again.",
            optimizedSpending: input.currentSpending,
            recommendedSavingsRate: input.currentSavingsRate,
            investmentSuggestions: [],
            actionableSteps: ["Review your current spending categories for potential savings.", "Ensure your financial goals are specific and measurable."],
            warningsOrConsiderations: ["The AI could not generate a detailed plan due to an unexpected response format. This is a fallback response."],
            goalAchievementAnalysis: input.financialGoals ? Object.keys(input.financialGoals).map(goalName => ({
                goalName,
                currentAllocation: 0, // Cannot infer
                recommendedAllocation: 0, // Cannot recommend
                notes: "Detailed analysis unavailable due to an error in AI response."
            })) : []
        };
    }
    console.log("getBudgetPlanAction received result:", JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error("Error in getBudgetPlanAction:", error);
    
    let errorMessage = "An unexpected error occurred while generating the budget plan. Please try again later.";
    if (error instanceof Error) {
        // Attempt to provide a more specific message if available
        errorMessage = `Error generating budget plan: ${error.message}. Please check your inputs or API configuration. If the problem persists, the AI service might be temporarily unavailable.`;
    }
    
    // Fallback values should align with the OptimizeBudgetOutput schema structure
    return {
      summary: errorMessage,
      optimizedSpending: input.currentSpending, // Return original spending on error
      recommendedSavingsRate: input.currentSavingsRate, // Return original savings rate
      investmentSuggestions: [],
      actionableSteps: ["Unable to generate actionable steps due to an error."],
      warningsOrConsiderations: ["An error prevented the budget plan generation."], 
      goalAchievementAnalysis: input.financialGoals ? Object.keys(input.financialGoals).map(goalName => ({
            goalName,
            currentAllocation: 0, // Cannot infer
            recommendedAllocation: 0, // Cannot recommend
            notes: "Detailed analysis unavailable due to a critical error."
        })) : []
    };
  }
}
