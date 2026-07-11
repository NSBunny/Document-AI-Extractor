'use client';

import React, { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';
}

export default function Badge({ className, variant = 'secondary', children, ...props }: BadgeProps) {
  const baseStyle =
    'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase border';

  const variants = {
    primary:
      'bg-primary/10 text-primary border-primary/20 shadow-[0_0_15px_rgba(109,94,249,0.1)]',
    secondary:
      'bg-surface text-text-secondary border-border',
    success:
      'bg-success/10 text-success border-success/20 shadow-[0_0_15px_rgba(34,197,94,0.1)]',
    warning:
      'bg-warning/10 text-warning border-warning/20 shadow-[0_0_15px_rgba(245,158,11,0.1)]',
    danger:
      'bg-danger/10 text-danger border-danger/20 shadow-[0_0_15px_rgba(239,68,68,0.1)]',
    info:
      'bg-primary/5 text-primary border-primary/10',
  };

  return (
    <span className={cn(baseStyle, variants[variant], className)} {...props}>
      {children}
    </span>
  );
}
