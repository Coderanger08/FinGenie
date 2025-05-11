import { LandmarkIcon } from 'lucide-react'; // Changed from PiggyBankIcon
import Link from 'next/link';

export default function Logo() {
  return (
    <Link href="/dashboard" className="flex items-center gap-2 text-lg font-semibold">
      {/* The LandmarkIcon will inherit the default text color or can be explicitly styled if needed */}
      <LandmarkIcon className="h-7 w-7 text-primary" />
      <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
        FinGenie
      </span>
    </Link>
  );
}
