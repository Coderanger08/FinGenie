
// The directive tells the Next.js runtime that it should be treated as a server-side module.
'use server';

/**
 * @fileOverview This module defines a Genkit flow for providing personalized financial advice via a chatbot, leveraging user transaction history and potentially generating chart data.
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

const ChartDataPointSchema = z.object({
  name: z.string().describe("Label for the data point (e.g., category name, month)."),
  value: z.number().describe("Value for the data point."),
  fill: z.string().optional().describe("Hex color code for the data point (e.g., for pie chart slices or bar colors). If not provided, defaults will be used."),
});

const ChartConfigSchema = z.object({
  type: z.enum(['pie', 'bar']).describe("Type of chart to display, if applicable ('pie' or 'bar')."),
  data: z.array(ChartDataPointSchema).describe("Data for the chart. For pie/bar charts, an array of objects with name and value."),
  title: z.string().optional().describe("An optional title for the chart."),
  xAxisLabel: z.string().optional().describe("Optional label for the X-axis (relevant for bar charts)."),
  yAxisLabel: z.string().optional().describe("Optional label for the Y-axis (relevant for bar charts)."),
}).optional().describe("Data for rendering a chart, if the user's question is best answered with a visual representation alongside text. Only generate if financialContext provides sufficient data for a meaningful chart related to the question.");


const FinancialAdviceChatbotOutputSchema = z.object({
  answer: z.string().describe('The AI\u0027s textual answer to the user\u0027s question.'),
  chart: ChartConfigSchema,
});
export type FinancialAdviceChatbotOutput = z.infer<typeof FinancialAdviceChatbotOutputSchema>;

/**
 * Provides financial advice using a chatbot interface.
 * @param input - The input containing the user's question and optional financial context.
 * @returns The AI's answer to the user's question, potentially with chart data.
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

Visualizations:
If the user's question explicitly asks for a visual representation (e.g., "show me my spending breakdown chart", "graph my income vs expenses") OR if the financialContext provides clear, relevant data that would significantly enhance understanding through a chart, you MAY generate chart data in the 'chart' field of your output.
- For "spending breakdown by category", use a 'pie' chart. Populate 'chart.data' with objects like {name: "CategoryName", value: amountSpent}. Set 'chart.title' to "Spending Breakdown".
- For "income vs expenses", use a 'bar' chart. Populate 'chart.data' with objects like {name: "Total Income", value: totalIncomeAmount}, {name: "Total Expenses", value: totalExpensesAmount}. Set 'chart.title' to "Income vs. Expenses".
- Only generate chart data if the 'financialContext' has the necessary summary figures (e.g., top spending categories, total income/expenses). Do not invent data.
- Ensure the 'chart.data' array is correctly formatted. Each object must have 'name' (string) and 'value' (number).
- You can optionally provide a 'fill' hex color string for data points, but it's not mandatory.
- You can also provide 'chart.xAxisLabel' and 'chart.yAxisLabel' for bar charts if appropriate.

Example Interaction (with chart):
User: "Show me my spending habits as a chart."
FinGenie (after checking context which has 'Top Spending Categories: Food: $300, Transport: $150, Entertainment: $100'):
Output:
{
  "answer": "Certainly! Here's a breakdown of your top spending categories. Food is your largest expense, followed by Transport and Entertainment. Consider reviewing your food spending for potential savings.",
  "chart": {
    "type": "pie",
    "title": "Spending Breakdown",
    "data": [
      {"name": "Food", "value": 300},
      {"name": "Transport", "value": 150},
      {"name": "Entertainment", "value": 100}
    ]
  }
}

Always provide a textual 'answer'. The 'chart' is optional and supplementary.
Your response must be a JSON object adhering to the FinancialAdviceChatbotOutputSchema.
Your tone should be supportive, empathetic, and professional.
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
    // Ensure there's always an answer, even if the chart part fails or is absent.
    return {
        answer: output?.answer || "I'm sorry, I couldn't process that request fully. Please try again.",
        chart: output?.chart
    };
  }
);
