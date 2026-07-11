'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useDocAIStore } from '@/store';
import {
  Sparkles,
  LayoutDashboard,
  History,
  FileText,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';

export default function Sidebar() {
  const pathname = usePathname();
  const [mounted, setMounted] = React.useState(false);
  const { theme, setTheme } = useTheme();

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const {
    sidebarCollapsed,
    setSidebarCollapsed,
    sidebarOpen,
    setSidebarOpen,
    history,
    restoreFromHistory,
    resetCurrent,
  } = useDocAIStore();

  /* ── Navigation items ────────────────────────────────────────────── */

  const navItems = [
    {
      label: 'Dashboard',
      href: '/',
      icon: <LayoutDashboard size={18} />,
    },
    {
      label: 'History',
      href: '/',
      icon: <History size={18} />,
      onClick: () => {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      },
    },
  ];

  /* ── Recent extractions (last 5) ─────────────────────────────────── */

  const recentExtractions = history.slice(0, 5);

  /* ── Theme toggle handler ────────────────────────────────────────── */

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    toast.success(`Switched to ${next} mode`);
  };

  return (
    <aside
      className={cn(
        'glass-panel h-screen fixed top-0 left-0 border-r border-border/80 flex flex-col justify-between transition-all duration-300 z-40 noise-bg',
        sidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0',
        sidebarCollapsed ? 'lg:w-20' : 'lg:w-64'
      )}
    >
      {/* ── Upper area ──────────────────────────────────────────────── */}
      <div className="flex flex-col gap-6 pt-6 overflow-y-auto">
        {/* Logo */}
        <div
          className={cn(
            'flex items-center px-5 justify-between',
            sidebarCollapsed && 'px-4 justify-center'
          )}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-primary to-secondary rounded-xl flex items-center justify-center text-white font-bold shadow-[0_0_15px_rgba(109,94,249,0.25)] flex-shrink-0">
              <Sparkles size={20} />
            </div>
            {!sidebarCollapsed && (
              <div className="flex flex-col">
                <span className="text-sm font-bold text-white tracking-tight leading-none">
                  DocAI
                </span>
                <span className="text-[10px] text-text-tertiary uppercase font-medium tracking-wider mt-1">
                  Extractor
                </span>
              </div>
            )}
          </div>
          {!sidebarCollapsed && (
            <button
              onClick={() => setSidebarCollapsed(true)}
              className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-hover/80 transition-colors cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>
          )}
        </div>

        {/* Collapsed expand trigger */}
        {sidebarCollapsed && (
          <div className="flex justify-center border-b border-border/30 pb-4">
            <button
              onClick={() => setSidebarCollapsed(false)}
              className="p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface-hover/80 transition-colors cursor-pointer border border-border"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}

        {/* Nav links */}
        <nav className="flex flex-col gap-1 px-3">
          {navItems.map((item) => {
            const isActive = pathname === item.href && !item.onClick;
            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={(e) => {
                  if (item.onClick) {
                    e.preventDefault();
                    item.onClick();
                  }
                }}
                className={cn(
                  'flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer relative',
                  isActive
                    ? 'bg-primary/10 text-primary border border-primary/20 shadow-[0_0_15px_rgba(109,94,249,0.1)]'
                    : 'text-text-secondary border border-transparent hover:text-text-primary hover:bg-surface-hover/50',
                  sidebarCollapsed && 'justify-center px-0'
                )}
              >
                {item.icon}
                {!sidebarCollapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Recent extractions */}
        {!sidebarCollapsed && recentExtractions.length > 0 && (
          <div className="px-5 mt-2 flex flex-col gap-3">
            <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-text-tertiary tracking-wider">
              <FileText size={10} />
              <span>Recent Extractions</span>
            </div>
            <div className="flex flex-col gap-2">
              {recentExtractions.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center gap-2 text-xs text-text-secondary hover:text-text-primary transition-colors cursor-pointer truncate"
                  onClick={() => {
                    restoreFromHistory(entry.id);
                    toast.success(`Restored "${entry.fileName}"`);
                  }}
                >
                  <FileText size={12} className="text-text-tertiary flex-shrink-0" />
                  <span className="truncate">{entry.fileName}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Footer area ─────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 p-4 border-t border-border/50">
        {/* Theme toggle */}
        <div
          className={cn(
            'flex items-center',
            sidebarCollapsed ? 'justify-center' : 'justify-between'
          )}
        >
          {!sidebarCollapsed && (
            <span className="text-[10px] text-text-tertiary leading-none">
              v2.0 · DocAI
            </span>
          )}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface-hover/80 transition-colors cursor-pointer border border-border"
            aria-label="Toggle theme"
          >
            {mounted ? (theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />) : <div className="w-[14px] h-[14px]" />}
          </button>
        </div>
      </div>
    </aside>
  );
}
