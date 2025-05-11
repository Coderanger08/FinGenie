
"use server";
import { financialAdviceChatbot, type FinancialAdviceChatbotInput, type FinancialAdviceChatbotOutput } from '@/ai/flows/financial-advice-chatbot';

export async function getChatbotResponseAction(input: FinancialAdviceChatbotInput): Promise<FinancialAdviceChatbotOutput> {
  try {
    const result = await financialAdviceChatbot(input);
    if (!result || !result.answer) {
        return { answer: "I'm sorry, I couldn't process that request. Please try again." , chart: undefined};
    }
    return result; // This will include result.chart if present
  } catch (error) {
    console.error("Error in getChatbotResponseAction:", error);
    return { answer: "An error occurred while fetching financial advice. Please try again later.", chart: undefined };
  }
}
