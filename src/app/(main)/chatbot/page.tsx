
"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, BotMessageSquare, User, Loader2 } from "lucide-react";
import type { ChatMessage, Transaction } from "@/types";
import { getChatbotResponseAction } from "./actions";
import { cn } from "@/lib/utils";
import { useTransactions } from "@/contexts/transactions-context";
import { formatCurrency } from "@/lib/currency-utils";
import { useCurrency } from "@/contexts/currency-context";
import { format, parseISO } from "date-fns";

export default function ChatbotPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isBotTyping, startBotTypingTransition] = useTransition();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { transactions } = useTransactions();
  const { selectedCurrency } = useCurrency();

  const generateFinancialContext = (): string => {
    let context = "User's Financial Context:\n";

    // Recent Transactions (last 5)
    if (transactions.length > 0) {
      context += "\nRecent Transactions (last 5):\n";
      const recentTransactions = transactions.slice(0, 5);
      recentTransactions.forEach(t => {
        context += `- ${t.type === 'Income' ? 'Received' : 'Spent'} ${formatCurrency(t.amount, selectedCurrency)} for "${t.description}" (Category: ${t.category}) on ${format(parseISO(t.date), "yyyy-MM-dd")}\n`;
      });
    } else {
      context += "\nNo transaction data available.\n";
    }

    // Top Spending Categories (all time for simplicity, could be last 30 days)
    const spendingByCategory: Record<string, number> = {};
    transactions
      .filter(t => t.type === 'Expense')
      .forEach(t => {
        spendingByCategory[t.category] = (spendingByCategory[t.category] || 0) + t.amount;
      });

    const sortedSpending = Object.entries(spendingByCategory)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3); // Top 3

    if (sortedSpending.length > 0) {
      context += "\nTop Spending Categories:\n";
      sortedSpending.forEach(([category, amount]) => {
        context += `- ${category}: ${formatCurrency(amount, selectedCurrency)}\n`;
      });
    }
    
    // Overall Summary
    const totalIncome = transactions.filter(t => t.type === 'Income').reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = transactions.filter(t => t.type === 'Expense').reduce((sum, t) => sum + t.amount, 0);
    context += `\nOverall Summary (all time):\n- Total Income: ${formatCurrency(totalIncome, selectedCurrency)}\n- Total Expenses: ${formatCurrency(totalExpenses, selectedCurrency)}\n- Net: ${formatCurrency(totalIncome - totalExpenses, selectedCurrency)}\n`;


    return context;
  };


  const handleSendMessage = async (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    if (!inputValue.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: inputValue,
      sender: "user",
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");

    startBotTypingTransition(async () => {
      try {
        const financialContext = generateFinancialContext();
        const botResponse = await getChatbotResponseAction({ question: userMessage.text, financialContext });
        const aiMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          text: botResponse.answer,
          sender: "ai",
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, aiMessage]);
      } catch (error) {
        console.error("Failed to get bot response", error);
        const errorMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          text: "Sorry, I encountered an error. Please try again.",
          sender: "ai",
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    });
  };

  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [messages]);


  return (
    <div className="container mx-auto py-8 h-[calc(100vh-120px)] flex flex-col">
      <Card className="flex-1 flex flex-col shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BotMessageSquare className="h-6 w-6 text-primary" />
            AI Financial Advisor
          </CardTitle>
          <CardDescription>Ask me any financial questions you have! I can use your transaction history to give personalized advice.</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col p-0">
          <ScrollArea className="flex-1 p-6" ref={scrollAreaRef}>
            <div className="space-y-6">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex items-end gap-3",
                    message.sender === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  {message.sender === "ai" && (
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        <BotMessageSquare size={18}/>
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={cn(
                      "max-w-[70%] rounded-lg px-4 py-3 text-sm shadow",
                      message.sender === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    <p style={{ whiteSpace: 'pre-wrap'}}>{message.text}</p>
                    <p className={cn("mt-1 text-xs", message.sender === "user" ? "text-primary-foreground/80" : "text-muted-foreground/80" )}>
                        {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                   {message.sender === "user" && (
                    <Avatar className="h-8 w-8">
                       <AvatarFallback className="bg-secondary text-secondary-foreground">
                         <User size={18} />
                       </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
              {isBotTyping && (
                 <div className="flex items-end gap-3 justify-start">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        <BotMessageSquare size={18}/>
                      </AvatarFallback>
                    </Avatar>
                    <div className="bg-muted text-muted-foreground rounded-lg px-4 py-3 text-sm shadow flex items-center">
                        <Loader2 className="h-5 w-5 animate-spin text-primary mr-2" />
                        <span>FinGenie is typing...</span>
                    </div>
                 </div>
              )}
            </div>
          </ScrollArea>
          <div className="border-t p-4 bg-background">
            <form onSubmit={handleSendMessage} className="flex items-center gap-3">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Type your financial question..."
                className="flex-1"
                disabled={isBotTyping}
              />
              <Button type="submit" size="icon" disabled={isBotTyping || !inputValue.trim()}>
                {isBotTyping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-5 w-5" />}
                <span className="sr-only">Send</span>
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
