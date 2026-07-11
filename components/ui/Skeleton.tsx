'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'rect' | 'circle';
}

export default function Skeleton({ className, variant = 'rect' }: SkeletonProps) {
  return (
    <div
      className={cn(
        'bg-surface-elevated animate-pulse relative overflow-hidden',
        variant === 'circle' && 'rounded-full',
        variant === 'rect' && 'rounded-xl',
        variant === 'text' && 'h-4 w-3/4 rounded-md',
        className
      )}
    >
      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" style={{ animationDuration: '1.5s' }} />
    </div>
  );
}
