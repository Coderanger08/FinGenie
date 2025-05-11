import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google'; // Assuming Geist is correctly set up
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { SidebarProvider } from '@/components/ui/sidebar'; 
import { CurrencyProvider } from '@/contexts/currency-context';
import { TransactionsProvider } from '@/contexts/transactions-context'; // Import TransactionsProvider

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'FinGenie - Your Personal Finance Manager',
  description: 'Take control of your finances with AI-powered insights and tools.',
};

export default function RootLayout({
  children,
  // Explicitly type params and searchParams, even if not used by the layout itself
  params,
  searchParams,
}: Readonly<{
  children: React.ReactNode;
  params: { [key: string]: string | string[] | undefined };
  searchParams: { [key: string]: string | string[] | undefined };
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <SidebarProvider>
          <CurrencyProvider>
            <TransactionsProvider> {/* Wrap with TransactionsProvider */}
              {children}
              <Toaster />
            </TransactionsProvider>
          </CurrencyProvider>
        </SidebarProvider>
      </body>
    </html>
  );
}
