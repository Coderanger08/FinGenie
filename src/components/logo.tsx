import { PiggyBankIcon } from 'lucide-react';
import Link from 'next/link';

export default function Logo() {
  return (
    <Link href="/dashboard" className="flex items-center gap-2 text-lg font-semibold text-primary">
      <PiggyBankIcon className="h-7 w-7" />
      <span>FinGenie</span>
    </Link>
  );
}
