'use client';

import React, { useState } from 'react';
import { Menu, Upload, Sun, Moon } from 'lucide-react';
import { useDocAIStore } from '@/store';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';

export default function Navbar() {
  const { sidebarOpen, setSidebarOpen, resetCurrent } = useDocAIStore();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const handleNewUpload = () => {
    resetCurrent();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    toast.success('Ready for a new upload');
  };

  return (
    <header className="glass-panel noise-bg sticky top-0 left-0 right-0 h-16 border-b border-border/80 px-4 sm:px-6 flex items-center justify-between z-20">
      {/* Left side — hamburger + branding */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="lg:hidden p-2.5 rounded-xl bg-surface border border-border hover:bg-surface-hover text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
          aria-label="Toggle Menu"
        >
          <Menu size={16} />
        </button>

        <div className="hidden sm:flex items-center gap-2">
          <span className="text-sm font-bold text-text-primary tracking-tight">
            DocAI
          </span>
          <span className="text-xs text-text-tertiary font-medium">
            AI Document Extractor
          </span>
        </div>
      </div>

      {/* Right side — new upload, theme toggle, avatar */}
      <div className="flex items-center gap-3">
        {/* New Upload */}
        <button
          onClick={handleNewUpload}
          className="px-3.5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white border border-primary/60 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold shadow-[0_0_12px_rgba(109,94,249,0.25)]"
        >
          <Upload size={14} />
          <span className="hidden sm:inline">New Upload</span>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={() => {
            const nextTheme = theme === 'dark' ? 'light' : 'dark';
            setTheme(nextTheme);
            toast.success(`Theme switched to ${nextTheme}`);
          }}
          className="p-2.5 rounded-xl bg-surface border border-border hover:bg-surface-hover text-text-secondary hover:text-text-primary transition-colors cursor-pointer w-[38px] h-[38px] flex items-center justify-center"
          aria-label="Toggle theme"
        >
          {mounted ? (
            theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />
          ) : (
            <div className="w-[14px] h-[14px]" />
          )}
        </button>

        {/* Avatar */}
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary to-secondary p-0.5 flex-shrink-0">
          <div className="w-full h-full bg-surface rounded-[10px] flex items-center justify-center text-xs font-bold text-text-primary">
            U
          </div>
        </div>
      </div>
    </header>
  );
}
