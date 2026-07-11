'use client';

import React, { type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import Card from './Card';
import Button from './Button';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: ReactNode;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export default function EmptyState({
  title,
  description,
  icon,
  actionText,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <Card
      hoverable={false}
      className={cn('flex flex-col items-center justify-center text-center p-12 border-dashed border-2', className)}
    >
      <div className="w-14 h-14 bg-primary/10 border border-primary/20 text-primary rounded-2xl flex items-center justify-center mb-5 shadow-[0_0_20px_rgba(109,94,249,0.15)] animate-pulse">
        {icon || (
          <span className="text-xl" role="img" aria-label="document">
            📄
          </span>
        )}
      </div>
      <h3 className="text-base font-bold text-text-primary mb-2">{title}</h3>
      <p className="text-sm text-text-secondary max-w-sm mb-6 leading-relaxed">{description}</p>
      {actionText && onAction && (
        <Button variant="primary" onClick={onAction}>
          {actionText}
        </Button>
      )}
    </Card>
  );
}
