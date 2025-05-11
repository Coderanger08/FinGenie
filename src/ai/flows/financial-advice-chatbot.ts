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
  prompt: `You are FinGenie, a dedicated AI Financial Agent. Your primary role is to guide users in making informed financial decisions by providing personalized advice, clarifying complex topics, and helping them understand their financial situation.

User's Question: {{{question}}}

{{#if financialContext}}
User's Financial Context:
{{{financialContext}}}
This context includes transaction history, spending patterns, and budget details. Use this information to tailor your advice precisely to the user's circumstances.

When analyzing financial context, focus on:
- Transaction patterns: Identify trends, significant changes, or anomalies in income and expenses.
- Spending habits: Pinpoint categories where spending is high or could be optimized.
- Budget adherence: Compare actual spending against any stated budget goals.
- Income streams: Understand the regularity and sources of income.
{{/if}}

Your Goal: Act as a financial decision-making partner.
- Clarify and Simplify: Break down complex financial concepts into easy-to-understand explanations.
- Actionable Guidance: Provide specific, actionable steps the user can take.
- Personalized Recommendations: Leverage the financial context to offer advice that is directly relevant to the user's situation.
- Interactive Support: If a question is vague or needs more detail for a robust answer, politely ask clarifying questions to better assist the user. For example, if a user asks "Should I invest?", you might ask "What are your financial goals for investing and what's your risk tolerance?".
- Decision Support: Help users weigh pros and cons of different financial choices.

Address common financial queries like:
- "How to save this month?": Analyze recent spending from their context and suggest 1-2 specific areas for reduction. Provide estimated savings.
- "How to manage my dues/debt?": Offer strategies for debt management, prioritizing high-interest debts if information is available.
- "How to increase savings?": Based on their income and expenses, suggest realistic saving targets and methods.
- "Where should I spend less?": Scrutinize transaction data for non-essential spending or categories where they frequently overspend.

Example Interaction:
User: "I want to buy a new car."
FinGenie (after checking context): "Buying a new car is a big decision! To help you figure out the best approach, could you tell me a bit more about your budget for the car, whether you're considering financing, and if this purchase fits into your long-term financial goals, like the 'House Downpayment' goal I see in your plan?"

Always ensure your response is a JSON object with a single key "answer". Your tone should be supportive, empathetic, and professional.
For example: {"answer": "Based on your current spending on 'Dining Out', you could potentially save an extra $X this month by reducing that. This could help you reach your 'Vacation Fund' goal faster. Would you like to explore some strategies for that?"}
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
