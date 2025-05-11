
"use client";

import { useState, useRef, useEffect, useTransition, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, BotMessageSquare, User, Loader2, BarChart2, PieChartIcon } from "lucide-react";
import type { ChatMessage, ChartConfig } from "@/types";
import { getChatbotResponseAction } from "./actions";
import { cn } from "@/lib/utils";
import { useTransactions } from "@/contexts/transactions-context";
import { formatCurrency } from "@/lib/currency-utils";
import { useCurrency } from "@/contexts/currency-context";
import { format, parseISO } from "date-fns";
import { ResponsiveContainer, PieChart as RechartsPieChart, Pie, BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";


const initialWelcomeMessageText = "Hello! I'm FinGenie, your AI Financial Advisor. I can help you understand your spending, manage your budget, and make smarter financial decisions. Feel free to ask me questions like 'How can I save more this month?', 'Where did most of my money go?', or ask me to 'show my spending breakdown chart' or 'graph my income vs expenses'. How can I assist you today?";

const PIE_CHART_COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];


export default function ChatbotPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isBotTyping, startBotTypingTransition] = useTransition();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { transactions } = useTransactions();
  const { selectedCurrency } = useCurrency();
  const [clientTimestamp, setClientTimestamp] = useState<number | null>(null);


  useEffect(() => {
    // Set a client-side timestamp after hydration
    setClientTimestamp(Date.now());
  }, []);


  useEffect(() => {
    if (clientTimestamp === null) return; // Don't set initial message until client timestamp is ready

    setMessages([
      {
        id: "welcome-message",
        text: initialWelcomeMessageText,
        sender: "ai",
        timestamp: clientTimestamp,
      }
    ]);
  }, [clientTimestamp]);


  const generateFinancialContext = (): string => {
    let context = "User's Financial Context:\n";

    if (transactions.length > 0) {
      context += "\nRecent Transactions (last 10, if available):\n";
      const recentTransactions = transactions.slice(0, 10);
      recentTransactions.forEach(t => {
        context += `- ${t.type === 'Income' ? 'Received' : 'Spent'} ${formatCurrency(t.amount, selectedCurrency)} for "${t.description}" (Category: ${t.category}) on ${format(parseISO(t.date), "yyyy-MM-dd")}\n`;
      });
    } else {
      context += "\nNo transaction data available.\n";
    }

    const spendingByCategory: Record<string, number> = {};
    transactions
      .filter(t => t.type === 'Expense')
      .forEach(t => {
        spendingByCategory[t.category] = (spendingByCategory[t.category] || 0) + t.amount;
      });

    const sortedSpending = Object.entries(spendingByCategory)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5); 

    if (sortedSpending.length > 0) {
      context += "\nTop Spending Categories (up to 5):\n";
      sortedSpending.forEach(([category, amount]) => {
        context += `- ${category}: ${formatCurrency(amount, selectedCurrency)}\n`;
      });
    } else {
       context += "\nNo spending category data available.\n";
    }
    
    const totalIncome = transactions.filter(t => t.type === 'Income').reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = transactions.filter(t => t.type === 'Expense').reduce((sum, t) => sum + t.amount, 0);
    context += `\nOverall Summary (all time from available transactions):\n- Total Income: ${formatCurrency(totalIncome, selectedCurrency)}\n- Total Expenses: ${formatCurrency(totalExpenses, selectedCurrency)}\n- Net (Income - Expenses): ${formatCurrency(totalIncome - totalExpenses, selectedCurrency)}\n`;

    return context;
  };


  const handleSendMessage = async (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    if (!inputValue.trim() || clientTimestamp === null) return;

    const userMessage: ChatMessage = {
      id: clientTimestamp.toString() + Math.random(), // Ensure unique ID with client-side randomness
      text: inputValue,
      sender: "user",
      timestamp: clientTimestamp,
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");

    startBotTypingTransition(async () => {
      try {
        const financialContext = generateFinancialContext();
        const botResponse = await getChatbotResponseAction({ question: userMessage.text, financialContext });
        const aiMessage: ChatMessage = {
          id: (clientTimestamp + 1).toString() + Math.random(),  // Ensure unique ID
          text: botResponse.answer,
          sender: "ai",
          timestamp: clientTimestamp +1, // ensure timestamp is different from user's
          chart: botResponse.chart, // Include chart data
        };
        setMessages((prev) => [...prev, aiMessage]);
      } catch (error) {
        console.error("Failed to get bot response", error);
        const errorMessage: ChatMessage = {
          id: (clientTimestamp + 1).toString() + Math.random(), // Ensure unique ID
          text: "Sorry, I encountered an error processing your request. Please try again.",
          sender: "ai",
          timestamp: clientTimestamp + 1, // ensure timestamp is different from user's
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
  
  const chartTooltipFormatter = (value: unknown) => {
    if (typeof value === 'number') {
      return formatCurrency(value, selectedCurrency);
    }
    return String(value);
  };
  
  const pieChartTooltipFormatter = (value: number, name: string) => {
    return [formatCurrency(value, selectedCurrency), name];
  };

  const ChatbotChart = ({ chartConfig }: { chartConfig: ChartConfig }) => {
    const { type, data, title, xAxisLabel, yAxisLabel } = chartConfig;

    const rechartsChartConfig = useMemo(() => {
        const config: import("@/components/ui/chart").ChartConfig = { value: { label: "Amount" } };
        data.forEach((item, index) => {
            config[item.name] = { label: item.name, color: item.fill || PIE_CHART_COLORS[index % PIE_CHART_COLORS.length] };
        });
        return config;
    }, [data]);


    if (!data || data.length === 0) return <p className="text-sm text-muted-foreground text-center py-2">No data available for chart.</p>;

    return (
      <Card className="mt-3 shadow-md">
        {title && <CardHeader className="pb-2 pt-4"><CardTitle className="text-base flex items-center gap-2">{type === 'pie' ? <PieChartIcon className="w-5 h-5"/> : <BarChart2 className="w-5 h-5"/>} {title}</CardTitle></CardHeader>}
        <CardContent className="pt-2 pb-4">
          <ChartContainer config={rechartsChartConfig} className="mx-auto aspect-video max-h-[300px] min-h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              {type === 'pie' ? (
                <RechartsPieChart>
                  <ChartTooltip 
                    cursor={false} 
                    content={<ChartTooltipContent hideLabel formatter={(value, name) => pieChartTooltipFormatter(value as number, name as string)}/>} 
                  />
                  <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius="80%" labelLine={false}
                    label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) => {
                        const RADIAN = Math.PI / 180;
                        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                        const x = cx + radius * Math.cos(-midAngle * RADIAN);
                        const y = cy + radius * Math.sin(-midAngle * RADIAN);
                        const percentage = (percent * 100).toFixed(0);
                        if (parseInt(percentage) < 5) return null;
                        return (
                          <text x={x} y={y} fill="hsl(var(--card-foreground))" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize="10px">
                            {`${name} (${percentage}%)`}
                          </text>
                        );
                      }}>
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill || PIE_CHART_COLORS[index % PIE_CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartLegend content={<ChartLegendContent nameKey="name" className="text-xs"/>} wrapperStyle={{paddingTop: '0.5rem'}}/>
                </RechartsPieChart>
              ) : ( // Bar chart
                <RechartsBarChart data={data} layout="vertical" margin={{ left: 20, right: 30, top:5, bottom:5 }}>
                  <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                  <XAxis type="number" tickFormatter={chartTooltipFormatter} axisLine={false} tickLine={false} fontSize="10px" label={xAxisLabel ? { value: xAxisLabel, position: 'insideBottom', offset: -5, fontSize: '10px' } : undefined} />
                  <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} width={Math.max(...data.map(d => d.name.length)) * 6 + 10} fontSize="10px" label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: 'insideLeft', fontSize: '10px' } : undefined} />
                  <ChartTooltip 
                    cursor={{fill: 'hsl(var(--muted))', radius: 5}} 
                    content={<ChartTooltipContent hideLabel formatter={(value) => chartTooltipFormatter(value)} />}
                  />
                  <Bar dataKey="value" radius={[0, 5, 5, 0]} barSize={Math.min(20, 150/data.length)} >
                     {data.map((entry, index) => (
                        <Cell key={`cell-${entry.name}`} fill={entry.fill || PIE_CHART_COLORS[index % PIE_CHART_COLORS.length]} />
                      ))}
                  </Bar>
                </RechartsBarChart>
              )}
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    );
  };


  return (
    <div className="container mx-auto py-8 h-[calc(100vh-120px)] flex flex-col">
      <Card className="flex-1 flex flex-col shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BotMessageSquare className="h-6 w-6 text-primary" />
            AI Financial Advisor
          </CardTitle>
          <CardDescription>Ask me any financial questions you have! I can use your transaction history to give personalized advice and visualizations.</CardDescription>
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
                    <Avatar className="h-8 w-8 self-start mt-1">
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
                    {message.sender === "ai" && message.chart && (
                       <ChatbotChart chartConfig={message.chart} />
                    )}
                    {clientTimestamp !== null && ( // Only render timestamp if clientTimestamp is available
                       <p className={cn("mt-1 text-xs", message.sender === "user" ? "text-primary-foreground/80" : "text-muted-foreground/80" )}>
                           {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                       </p>
                    )}
                  </div>
                   {message.sender === "user" && (
                    <Avatar className="h-8 w-8 self-start mt-1">
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
                disabled={isBotTyping || clientTimestamp === null}
              />
              <Button type="submit" size="icon" disabled={isBotTyping || !inputValue.trim() || clientTimestamp === null}>
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

