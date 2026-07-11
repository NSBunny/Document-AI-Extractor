'use client';

import React from 'react';
import Link from 'next/link';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-6">
      <div className="glass-panel p-10 rounded-2xl max-w-md w-full text-center hover-glow noise-bg">
        <h1 className="text-6xl font-black text-primary mb-4 animate-pulse">404</h1>
        <h2 className="text-xl font-bold mb-2">Page Not Found</h2>
        <p className="text-sm text-text-secondary mb-8">
          The page you are looking for does not exist or has been relocated to another workspace path.
        </p>
        <div className="flex flex-col gap-3">
          <Link
            href="/"
            className="btn btn-primary w-full flex items-center justify-center gap-2"
            style={{
              background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
              color: 'white',
              padding: '10px 16px',
              borderRadius: '12px',
              cursor: 'pointer',
            }}
          >
            <Home size={16} />
            <span>Return to Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
