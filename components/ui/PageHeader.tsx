'use client';

import React, { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export default function PageHeader({ title, subtitle, icon, actions, className }: PageHeaderProps) {
  return (
    <div
      className={cn(
        'flex justify-between items-start gap-4 mb-8 flex-wrap border-b border-border/20 pb-4',
        className
      )}
    >
      <div className="flex items-center gap-4">
        {icon && (
          <div className="w-12 h-12 bg-gradient-to-tr from-primary to-secondary rounded-xl flex items-center justify-center text-white shadow-[0_0_20px_rgba(109,94,249,0.2)]">
            {icon}
          </div>
        )}
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-black text-white tracking-tight leading-none">{title}</h1>
          {subtitle && <p className="text-sm text-text-secondary">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  );
}
