'use client';

import React, { type ReactNode } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { useDocAIStore } from '@/store';
import { cn } from '@/lib/utils';

interface AppShellProps {
  children: ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const { sidebarCollapsed, sidebarOpen, setSidebarOpen } = useDocAIStore();

  return (
    <div className="min-h-screen bg-background text-text-primary">
      {/* Mobile Drawer Backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-background/60 backdrop-blur-sm z-35 lg:hidden"
        />
      )}

      {/* Sidebar */}
      <Sidebar />

      {/* Main Grid Wrapper */}
      <div
        className={cn(
          'min-h-screen flex flex-col transition-all duration-300 pl-0',
          sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        )}
      >
        {/* Top Navbar */}
        <Navbar />

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
