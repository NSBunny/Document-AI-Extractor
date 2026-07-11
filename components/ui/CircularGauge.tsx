'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface CircularProgressProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export default function CircularProgress({
  score,
  size = 120,
  strokeWidth = 10,
  className,
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;

  const colorClass =
    score >= 80
      ? 'stroke-success'
      : score >= 60
      ? 'stroke-warning'
      : 'stroke-danger';

  const glowClass =
    score >= 80
      ? 'shadow-[0_0_20px_rgba(34,197,94,0.3)]'
      : score >= 60
      ? 'shadow-[0_0_20px_rgba(245,158,11,0.3)]'
      : 'shadow-[0_0_20px_rgba(239,68,68,0.3)]';

  return (
    <div className={cn('relative flex items-center justify-center', className)}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Track */}
        <circle
          className="stroke-border/40 fill-transparent"
          strokeWidth={strokeWidth}
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        {/* Fill */}
        <circle
          className={cn('fill-transparent transition-all duration-1000 ease-out', colorClass)}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      {/* Percentage Text */}
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-xl font-black text-white tracking-tight leading-none">{score}%</span>
        <span className="text-[8px] text-text-tertiary uppercase tracking-wider font-bold mt-1">
          Score
        </span>
      </div>
    </div>
  );
}
