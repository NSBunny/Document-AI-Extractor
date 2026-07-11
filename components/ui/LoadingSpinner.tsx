'use client';

import React from 'react';

interface LoadingSpinnerProps {
  message?: string;
  fullPage?: boolean;
}

export default function LoadingSpinner({ message, fullPage = false }: LoadingSpinnerProps) {
  const spinner = (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 'var(--space-xl)',
      }}
    >
      {/* Gradient Spinner */}
      <div style={{ position: 'relative', width: 48, height: 48 }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            border: '3px solid var(--border-default)',
            borderTopColor: 'var(--accent-blue)',
            borderRightColor: 'var(--accent-purple)',
            animation: 'spin 0.8s linear infinite',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 8,
            borderRadius: '50%',
            border: '2px solid transparent',
            borderBottomColor: 'var(--accent-emerald)',
            animation: 'spin 1.2s linear infinite reverse',
          }}
        />
      </div>

      {/* Pulsing Dots */}
      <div style={{ display: 'flex', gap: 'var(--space-sm)', alignItems: 'center' }}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: 'var(--accent-blue)',
              animation: `dotPulse 1.4s ease-in-out ${i * 0.16}s infinite both`,
            }}
          />
        ))}
      </div>

      {/* Message */}
      {message && (
        <p
          style={{
            fontSize: 'var(--font-sm)',
            color: 'var(--text-secondary)',
            animation: 'pulse 2s ease-in-out infinite',
          }}
        >
          {message}
        </p>
      )}
    </div>
  );

  if (fullPage) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(10, 14, 26, 0.85)',
          backdropFilter: 'blur(8px)',
          zIndex: 9999,
          animation: 'fadeIn 0.3s ease-out',
        }}
      >
        {spinner}
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-3xl)',
      }}
    >
      {spinner}
    </div>
  );
}
