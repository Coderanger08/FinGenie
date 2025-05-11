export const CURRENCIES_LIST = [
  { value: "USD", label: "USD - United States Dollar" },
  { value: "EUR", label: "EUR - Euro" },
  { value: "GBP", label: "GBP - British Pound Sterling" },
  { value: "JPY", label: "JPY - Japanese Yen" },
  { value: "CAD", label: "CAD - Canadian Dollar" },
  { value: "AUD", label: "AUD - Australian Dollar" },
  { value: "INR", label: "INR - Indian Rupee" },
];

export const DEFAULT_CURRENCY = "USD";
export const LOCAL_STORAGE_CURRENCY_KEY = "financeAppPreferredCurrency";

export function formatCurrency(amount: number, currencyCode: string): string {
  // Ensure amount is a number
  const numericAmount = Number(amount);
  if (isNaN(numericAmount)) {
    // Handle cases where amount might not be a valid number, e.g. during form input
    // Or throw an error, or return a specific string like "N/A"
    // For now, let's format 0 if it's not a valid number, or you can adjust as needed.
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(0);
  }

  return new Intl.NumberFormat(undefined, { // Uses browser's locale for number formatting part
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericAmount);
}
