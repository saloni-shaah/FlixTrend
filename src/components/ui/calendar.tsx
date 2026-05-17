// components/ui/calendar.tsx  — replace entirely
"use client";
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];

interface CalendarProps {
  selected?: Date;
  onSelect: (date: Date | undefined) => void;
  disabled?: (date: Date) => boolean;
  className?: string;
}

export function Calendar({ selected, onSelect, disabled, className }: CalendarProps) {
  const today = new Date(); today.setHours(0,0,0,0);
  const [viewYear, setViewYear] = useState(selected?.getFullYear() ?? today.getFullYear());
  const [viewMonth, setViewMonth] = useState(selected?.getMonth() ?? today.getMonth());

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const prevDays = new Date(viewYear, viewMonth, 0).getDate();

  const cells: { date: Date; outside: boolean }[] = [];
  for (let i = firstDay - 1; i >= 0; i--)
    cells.push({ date: new Date(viewYear, viewMonth - 1, prevDays - i), outside: true });
  for (let d = 1; d <= daysInMonth; d++)
    cells.push({ date: new Date(viewYear, viewMonth, d), outside: false });
  while (cells.length < 42)
    cells.push({ date: new Date(viewYear, viewMonth + 1, cells.length - firstDay - daysInMonth + 1), outside: true });

  const quickPicks = [
    { label: 'Today', date: new Date(today) },
    { label: 'Tomorrow', date: new Date(today.getTime() + 86400000) },
    { label: 'Next week', date: new Date(today.getTime() + 7 * 86400000) },
  ];

  return (
    <div className={cn('p-4 w-full', className)}>
      {/* Quick picks */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {quickPicks.map(q => (
          <button
            key={q.label}
            onClick={() => { onSelect(q.date); setViewMonth(q.date.getMonth()); setViewYear(q.date.getFullYear()); }}
            className="px-3 py-1 text-xs rounded-full border border-glass-border text-gray-300 hover:border-accent-cyan hover:text-accent-cyan transition-colors"
          >
            {q.label}
          </button>
        ))}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center rounded-lg border border-glass-border text-gray-400 hover:border-accent-cyan hover:text-accent-cyan transition-colors">
          <ChevronLeft size={16} />
        </button>
        <span className="text-sm font-semibold text-white">{MONTHS[viewMonth]} {viewYear}</span>
        <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center rounded-lg border border-glass-border text-gray-400 hover:border-accent-cyan hover:text-accent-cyan transition-colors">
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-2">
        {DAYS.map(d => (
          <div key={d} className="text-center text-[10px] font-semibold text-accent-cyan uppercase tracking-wider py-1">{d}</div>
        ))}
      </div>

      {/* Cells */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map(({ date, outside }, i) => {
          const isDisabled = disabled?.(date) ?? false;
          const isToday = date.toDateString() === today.toDateString();
          const isSelected = selected && date.toDateString() === selected.toDateString();

          return (
            <button
              key={i}
              disabled={isDisabled}
              onClick={() => onSelect(date)}
              className={cn(
                'aspect-square flex items-center justify-center rounded-xl text-sm transition-all relative',
                outside && 'text-gray-600',
                !outside && !isDisabled && 'text-gray-200',
                isDisabled && 'text-gray-700 cursor-not-allowed opacity-40',
                isToday && !isSelected && 'border border-glass-border font-semibold',
                isSelected && 'bg-accent-cyan text-black font-bold',
                !isSelected && !isDisabled && !outside && 'hover:bg-white/10 hover:text-accent-cyan',
              )}
            >
              {date.getDate()}
              {isToday && !isSelected && (
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-accent-cyan" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}