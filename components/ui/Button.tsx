'use client';

import React, { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'secondary', size = 'md', type = 'button', ...props }, ref) => {
    const baseStyle =
      'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 outline-none select-none disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]';

    const variants = {
      primary:
        'bg-gradient-to-r from-primary to-secondary text-white shadow-premium hover:opacity-95 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
      secondary:
        'bg-surface hover:bg-surface-hover text-text-primary border border-border focus-visible:border-primary',
      outline:
        'border border-border text-text-secondary hover:text-text-primary hover:bg-surface-hover focus-visible:border-primary',
      ghost:
        'text-text-secondary hover:text-text-primary hover:bg-surface-hover/50',
      danger:
        'bg-danger/10 border border-danger/20 text-danger hover:bg-danger/25 focus-visible:ring-2 focus-visible:ring-danger',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-xs rounded-lg gap-1.5',
      md: 'px-4 py-2.5 text-sm gap-2',
      lg: 'px-6 py-3.5 text-base rounded-2xl gap-2.5',
      icon: 'p-2.5 rounded-xl aspect-square',
    };

    return (
      <button
        ref={ref}
        type={type}
        className={cn(baseStyle, variants[variant], sizes[size], className)}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';
export default Button;
