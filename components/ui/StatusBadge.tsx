'use client';

import React from 'react';

interface StatusBadgeProps {
  status: 'present' | 'missing' | 'partial' | 'ambiguous';
}

const statusConfig: Record<string, { label: string; icon: string; className: string }> = {
  present: { label: 'Present', icon: '✅', className: 'badge-success' },
  missing: { label: 'Missing', icon: '🔴', className: 'badge-danger' },
  partial: { label: 'Partial', icon: '🟡', className: 'badge-warning' },
  ambiguous: { label: 'Ambiguous', icon: '🔵', className: 'badge-info' },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.ambiguous;

  return (
    <span
      className={`badge ${config.className}`}
      style={{
        transition: 'all var(--transition-fast)',
        cursor: 'default',
      }}
    >
      <span style={{ fontSize: '0.7rem', lineHeight: 1 }}>{config.icon}</span>
      {config.label}
    </span>
  );
}
