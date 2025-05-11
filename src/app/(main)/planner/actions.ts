"use server";
import { adjustBudget, type AdjustBudgetInput, type AdjustBudgetOutput } from '@/ai/flows/budget-adjustment-planner';

export async function getBudgetPlanAction(input: AdjustBudgetInput): Promise<AdjustBudgetOutput> {
  try {
    // await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate delay
    const result = await adjustBudget(input);
    if (!result || !result.summary) {
        // Provide a default structure if AI returns unexpected result
        return { 
            summary: "Could not generate a budget plan. Please check your inputs.",
            adjustedSpending: {},
            recommendedSavingsRate: input.savingsRate, // return original
            investmentAllocation: []
        };
    }
    return result;
  } catch (error) {
    console.error("Error in getBudgetPlanAction:", error);
    // Return a structured error response
    return { 
      summary: "An error occurred while generating the budget plan. Please try again later.",
      adjustedSpending: {},
      recommendedSavingsRate: input.savingsRate,
      investmentAllocation: []
    };
  }
}
