// The directive tells the Next.js runtime that it should be treated as a server-side module.
'use server';

/**
 * @fileOverview This module defines a Genkit flow for providing financial advice via a chatbot.
 *
 * - financialAdviceChatbot - A function to get financial advice from the chatbot.
 * - FinancialAdviceChatbotInput - The input type for the financialAdviceChatbot function.
 * - FinancialAdviceChatbotOutput - The output type for the financialAdviceChatbot function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const FinancialAdviceChatbotInputSchema = z.object({
  question: z.string().describe('The user\u0027s financial question.'),
  financialContext: z.string().optional().describe('Optional financial context to provide to the chatbot.'),
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
  prompt: `You are a helpful AI financial advisor. A user is asking for financial advice.

Here is the user's question: {{{question}}}

{{#if financialContext}}
Here is some financial context for the user:
{{{financialContext}}}
{{/if}}

Provide a clear, concise, and helpful answer.`,
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
