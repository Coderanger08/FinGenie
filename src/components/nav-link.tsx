// src/components/nav-link.tsx
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react'; // Import LucideIcon type if needed for stricter props

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

export default function NavLink({ href, children, className }: NavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href || (href !== "/" && pathname.startsWith(href + "/")); // More robust active check

  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all duration-200 ease-in-out hover:text-primary hover:bg-muted/50',
        isActive && 'bg-gradient-to-r from-primary/20 to-accent/20 text-primary font-medium',
        className
      )}
    >
      {children}
    </Link>
  );
}
