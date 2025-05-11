"use server";
import { suggestTransactionCategories, type SuggestTransactionCategoriesInput, type SuggestTransactionCategoriesOutput } from '@/ai/flows/transaction-categorization';

export async function getAiCategorySuggestionAction(input: SuggestTransactionCategoriesInput): Promise<SuggestTransactionCategoriesOutput> {
  try {
    // Add a small delay to simulate network latency for better UX demonstration
    // await new Promise(resolve => setTimeout(resolve, 500));
    const result = await suggestTransactionCategories(input);
    if (!result || !result.suggestedCategories) {
        // Fallback if AI returns unexpected result
        return { suggestedCategories: [{ category: 'Uncategorized', confidence: 0.1 }] };
    }
    return result;
  } catch (error) {
    console.error("Error in getAiCategorySuggestionAction:", error);
    // Return a generic category or error indicator
    return { suggestedCategories: [{ category: 'Error processing', confidence: 0 }] };
  }
}
