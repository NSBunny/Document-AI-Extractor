'use client';

import { useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';

export default function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute stale time
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
        {children}
        <Toaster
          position="bottom-right"
          theme="dark"
          closeButton
          richColors
          toastOptions={{
            style: {
              background: 'var(--color-surface, #101827)',
              border: '1px solid var(--color-border, rgba(255, 255, 255, 0.06))',
              color: 'var(--color-text-primary, #ffffff)',
              borderRadius: '12px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
            },
          }}
        />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
