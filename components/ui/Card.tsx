'use client';

import React, { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  glow?: boolean;
  noise?: boolean;
  hoverable?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, glow = false, noise = true, hoverable = true, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'glass-surface p-6 transition-all duration-300',
          noise && 'noise-bg',
          hoverable && 'hover-glow hover:cursor-pointer',
          glow && 'shadow-[0_0_30px_rgba(109,94,249,0.15)] border-primary/20',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
export default Card;
