// 'use server'
'use server';

/**
 * @fileOverview Transaction categorization flow.
 *
 * This file defines a Genkit flow for suggesting transaction categories based on the transaction description.
 * It exports:
 * - `suggestTransactionCategories`: An async function that takes a transaction description and returns a list of suggested categories with confidence scores.
 * - `SuggestTransactionCategoriesInput`: The input type for the suggestTransactionCategories function.
 * - `SuggestTransactionCategoriesOutput`: The output type for the suggestTransactionCategories function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestTransactionCategoriesInputSchema = z.object({
  transactionDescription: z
    .string()
    .describe('The description of the transaction to categorize.'),
});

export type SuggestTransactionCategoriesInput = z.infer<
  typeof SuggestTransactionCategoriesInputSchema
>;

const SuggestTransactionCategoriesOutputSchema = z.object({
  suggestedCategories: z.array(
    z.object({
      category: z.string().describe('The suggested category for the transaction.'),
      confidence: z
        .number()
        .min(0)
        .max(1)
        .describe(
          'A score between 0 and 1 representing the confidence in the suggested category.'
        ),
    })
  ).describe('A list of suggested categories with confidence scores.'),
});

export type SuggestTransactionCategoriesOutput = z.infer<
  typeof SuggestTransactionCategoriesOutputSchema
>;

export async function suggestTransactionCategories(
  input: SuggestTransactionCategoriesInput
): Promise<SuggestTransactionCategoriesOutput> {
  return suggestTransactionCategoriesFlow(input);
}

const suggestTransactionCategoriesPrompt = ai.definePrompt({
  name: 'suggestTransactionCategoriesPrompt',
  input: {schema: SuggestTransactionCategoriesInputSchema},
  output: {schema: SuggestTransactionCategoriesOutputSchema},
  prompt: `You are a financial advisor specializing in transaction categorization.

  Given the following transaction description, suggest up to 3 categories for the transaction, along with a confidence score between 0 and 1.

  Transaction Description: {{{transactionDescription}}}

  Format your response as a JSON object with a "suggestedCategories" field, which is an array of objects. Each object in the array should have a "category" field (string) and a "confidence" field (number between 0 and 1).  The confidence score represents how confident you are in the category suggestion.
  `,
});

const suggestTransactionCategoriesFlow = ai.defineFlow(
  {
    name: 'suggestTransactionCategoriesFlow',
    inputSchema: SuggestTransactionCategoriesInputSchema,
    outputSchema: SuggestTransactionCategoriesOutputSchema,
  },
  async input => {
    const {output} = await suggestTransactionCategoriesPrompt(input);
    return output!;
  }
);
