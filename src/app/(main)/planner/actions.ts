"use server";
import { adjustBudget, type AdjustBudgetInput, type AdjustBudgetOutput } from '@/ai/flows/budget-adjustment-planner';

export async function getBudgetPlanAction(input: AdjustBudgetInput): Promise<AdjustBudgetOutput> {
  try {
    const result = await adjustBudget(input);
    // The adjustBudget flow itself now handles the case where AI output is critically flawed
    // and returns a default error structure conforming to AdjustBudgetOutput.
    // So, we can generally trust 'result' to be in the correct shape here,
    // or it will be the error shape from the flow.
    return result;
  } catch (error) {
    console.error("Error in getBudgetPlanAction:", error);
    // This catch block handles unexpected errors during the flow execution
    // or if the flow throws an error explicitly.
    return {
      summary: "An unexpected error occurred while generating the budget plan. Please try again later.",
      adjustedSpending: {}, // Or input.spending if you want to return original values
      recommendedSavingsRate: input.savingsRate,
      investmentAllocation: []
    };
  }
}
