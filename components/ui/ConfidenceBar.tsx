'use client';

import { useEffect, useState } from 'react';

interface ConfidenceBarProps {
  value: number;
}

export default function ConfidenceBar({ value }: ConfidenceBarProps) {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const clampedValue = Math.min(100, Math.max(0, value));

  let colorClass = 'progress-green';
  let gradientColors = 'var(--accent-emerald), #34d399';

  if (clampedValue < 50) {
    colorClass = 'progress-red';
    gradientColors = 'var(--accent-red), #f87171';
  } else if (clampedValue < 80) {
    colorClass = 'progress-yellow';
    gradientColors = 'var(--accent-amber), #fbbf24';
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', minWidth: 120 }}>
      <div className={`progress ${colorClass}`} style={{ flex: 1 }}>
        <div
          className="progress-fill"
          style={{
            width: animated ? `${clampedValue}%` : '0%',
            background: `linear-gradient(90deg, ${gradientColors})`,
            transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
      </div>
      <span
        style={{
          fontSize: 'var(--font-xs)',
          fontWeight: 600,
          color: 'var(--text-secondary)',
          minWidth: 36,
          textAlign: 'right',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {clampedValue}%
      </span>
    </div>
  );
}
