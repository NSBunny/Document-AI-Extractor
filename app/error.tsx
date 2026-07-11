'use client';

import React, { useEffect } from 'react';
import { RefreshCcw, AlertTriangle } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application Error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-6">
      <div className="glass-panel p-8 rounded-2xl max-w-md w-full text-center hover-glow noise-bg">
        <div className="w-16 h-16 bg-danger/10 border border-danger/20 text-danger rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle size={32} />
        </div>
        <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
        <p className="text-sm text-text-secondary mb-6">
          {error.message || 'An unexpected runtime crash occurred. Please check the logs or retry.'}
        </p>
        <button
          onClick={() => reset()}
          className="btn btn-primary w-full flex items-center justify-center gap-2"
          style={{
            background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
            color: 'white',
            padding: '10px 16px',
            borderRadius: '12px',
            cursor: 'pointer',
          }}
        >
          <RefreshCcw size={16} />
          <span>Try Again</span>
        </button>
      </div>
    </div>
  );
}
