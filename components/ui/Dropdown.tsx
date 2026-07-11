'use client';

import React, { useState, useRef, useEffect, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DropdownOption {
  value: string;
  label: string;
  icon?: ReactNode;
}

interface DropdownProps {
  options: DropdownOption[];
  selectedValue: string;
  onSelect: (value: string) => void;
  placeholder?: string;
  className?: string;
  triggerClassName?: string;
}

export default function Dropdown({
  options,
  selectedValue,
  onSelect,
  placeholder = 'Select Option',
  className,
  triggerClassName,
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => opt.value === selectedValue);

  return (
    <div ref={containerRef} className={cn('relative inline-block w-full', className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full px-3.5 py-2.5 bg-surface border border-border rounded-xl text-text-primary text-sm flex items-center justify-between hover:bg-surface-hover transition-colors outline-none cursor-pointer focus-visible:border-primary',
          triggerClassName
        )}
      >
        <span className="flex items-center gap-2">
          {selectedOption?.icon}
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          size={16}
          className={cn('text-text-secondary transition-transform', isOpen && 'rotate-180')}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute left-0 right-0 mt-2 bg-surface border border-border rounded-xl p-1.5 shadow-premium z-50 max-h-60 overflow-y-auto"
          >
            {options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  onSelect(opt.value);
                  setIsOpen(false);
                }}
                className={cn(
                  'w-full px-3 py-2 text-left rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-surface-hover flex items-center gap-2 transition-colors cursor-pointer',
                  opt.value === selectedValue && 'bg-primary/10 text-primary hover:bg-primary/20 font-semibold'
                )}
              >
                {opt.icon}
                <span>{opt.label}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
