// The directive tells the Next.js runtime that it should be treated as a server-side module.
'use server';

/**
 * @fileOverview This module defines a Genkit flow for providing personalized financial advice via a chatbot, leveraging user transaction history.
 *
 * - financialAdviceChatbot - A function to get financial advice from the chatbot.
 * - FinancialAdviceChatbotInput - The input type for the financialAdviceChatbot function.
 * - FinancialAdviceChatbotOutput - The output type for the financialAdviceChatbot function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const FinancialAdviceChatbotInputSchema = z.object({
  question: z.string().describe('The user\u0027s financial question.'),
  financialContext: z.string().optional().describe("The user's financial context, which may include summarized transaction history, spending patterns, and budget information."),
});
export type FinancialAdviceChatbotInput = z.infer<typeof FinancialAdviceChatbotInputSchema>;

const FinancialAdviceChatbotOutputSchema = z.object({
  answer: z.string().describe('The AI\u0027s answer to the user\u0027s question.'),
});
export type FinancialAdviceChatbotOutput = z.infer<typeof FinancialAdviceChatbotOutputSchema>;

/**
 * Provides financial advice using a chatbot interface.
 * @param input - The input containing the user's question and optional financial context.
 * @returns The AI's answer to the user's question.
 */
export async function financialAdviceChatbot(input: FinancialAdviceChatbotInput): Promise<FinancialAdviceChatbotOutput> {
  return financialAdviceChatbotFlow(input);
}

const financialAdviceChatbotPrompt = ai.definePrompt({
  name: 'financialAdviceChatbotPrompt',
  input: {schema: FinancialAdviceChatbotInputSchema},
  output: {schema: FinancialAdviceChatbotOutputSchema},
  prompt: `You are a helpful AI financial advisor. Your goal is to provide clear, concise, actionable, and personalized financial guidance.

Here is the user's question: {{{question}}}

{{#if financialContext}}
Here is the user's financial context. Use this information to make your advice more personal and relevant to their situation:
{{{financialContext}}}

When analyzing the financial context, pay attention to:
- Recent transactions: Dates, amounts, categories, and types (income/expense).
- Spending patterns: Frequent categories, large expenses.
- Income sources: Regularity and amounts.
- Budget information: Existing budget limits and current spending against them, if provided.
{{/if}}

When answering, consider common financial queries such as:
- Strategies for saving money, including specific tips for the current month (e.g., "how to save this month"). If transaction data is available, suggest areas based on their actual spending.
- Advice on managing and paying off dues or debts (e.g., "how to manage my due").
- Methods to increase overall savings (e.g., "how to increase saving").
- Identifying areas where spending can be reduced (e.g., "where should i spend less"). If transaction data is available, point to specific categories from their history where they might cut back.

Provide a helpful and practical answer. If the question is vague, you can suggest the user provide more details for a more tailored response. Focus on providing actionable steps where possible.
If the user asks about spending less, and their financial context includes spending data, try to identify 1-2 categories from their transactions where they spend a significant amount and could potentially reduce expenses.
For questions about saving, if income and expense data is present, give concrete examples based on their numbers.

Ensure your response is a JSON object with a single key "answer" which holds your textual advice. For example: {"answer": "Based on your spending, you could save more by..."}
`,
});

const financialAdviceChatbotFlow = ai.defineFlow(
  {
    name: 'financialAdviceChatbotFlow',
    inputSchema: FinancialAdviceChatbotInputSchema,
    outputSchema: FinancialAdviceChatbotOutputSchema,
  },
  async input => {
    const {output} = await financialAdviceChatbotPrompt(input);
    return output!;
  }
);

