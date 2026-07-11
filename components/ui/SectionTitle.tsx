'use client';

import React, { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface SectionTitleProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  className?: string;
}

export default function SectionTitle({ title, subtitle, icon, className }: SectionTitleProps) {
  return (
    <div className={cn('flex flex-col gap-1 mb-5', className)}>
      <div className="flex items-center gap-2">
        {icon && <span className="text-primary flex items-center">{icon}</span>}
        <h2 className="text-sm font-bold tracking-tight text-white uppercase">{title}</h2>
      </div>
      {subtitle && <p className="text-xs text-text-tertiary">{subtitle}</p>}
    </div>
  );
}
