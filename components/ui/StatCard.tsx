'use client';

import React, { type ReactNode } from 'react';
import Card from './Card';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  sparklineData?: number[];
  color?: 'primary' | 'success' | 'warning' | 'danger';
  className?: string;
}

export default function StatCard({
  title,
  value,
  icon,
  trend,
  sparklineData = [30, 40, 35, 50, 49, 60, 70, 91],
  color = 'primary',
  className,
}: StatCardProps) {
  const sparklineColor = {
    primary: 'var(--color-primary, #6D5EF9)',
    success: 'var(--color-success, #22C55E)',
    warning: 'var(--color-warning, #F59E0B)',
    danger: 'var(--color-danger, #EF4444)',
  }[color];

  // SVG Sparkline calculation
  const width = 100;
  const height = 30;
  const min = Math.min(...sparklineData);
  const max = Math.max(...sparklineData);
  const range = max - min || 1;
  const points = sparklineData
    .map((val, idx) => {
      const x = (idx / (sparklineData.length - 1)) * width;
      const y = height - ((val - min) / range) * height;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <Card className={cn('flex flex-col gap-4 overflow-hidden relative', className)}>
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-text-secondary font-medium tracking-tight">{title}</span>
          <span className="text-2xl font-black text-white tracking-tight">{value}</span>
        </div>
        <div
          className={cn(
            'w-10 h-10 rounded-xl flex items-center justify-center border',
            color === 'primary' && 'bg-primary/10 border-primary/20 text-primary',
            color === 'success' && 'bg-success/10 border-success/20 text-success',
            color === 'warning' && 'bg-warning/10 border-warning/20 text-warning',
            color === 'danger' && 'bg-danger/10 border-danger/20 text-danger'
          )}
        >
          {icon}
        </div>
      </div>

      <div className="flex justify-between items-center mt-2">
        {trend ? (
          <span
            className={cn(
              'inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-lg border',
              trend.isPositive
                ? 'bg-success/10 border-success/20 text-success'
                : 'bg-danger/10 border-danger/20 text-danger'
            )}
          >
            {trend.isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            <span>{trend.isPositive ? '+' : ''}{trend.value}%</span>
          </span>
        ) : (
          <span className="text-[11px] text-text-tertiary">Activity this week</span>
        )}

        {/* Sparkline Graph */}
        <div className="w-24 h-8">
          <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`}>
            <polyline fill="none" stroke={sparklineColor} strokeWidth="1.5" points={points} />
          </svg>
        </div>
      </div>
    </Card>
  );
}
