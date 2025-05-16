'use client';

import { useId, useState } from 'react';

import { cn } from '@/lib/utils';
import { CalendarDays, CalendarRange, Calendar, ListTodo } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

type CalendarView = 'day' | 'week' | 'month' | 'agenda';

interface CalendarViewSelectorProps {
  defaultView?: CalendarView;
  onViewChange?: (view: CalendarView) => void;
  className?: string;
}

/**
 * This component is used to select the view of the calendar.
 * It shows the day, week, month, and agenda views.
 * @param defaultView - The default view of the calendar.
 * @param onViewChange - The function to call when the view changes.
 * @param className - The className for the component.
 */
export default function CalendarViewSelector({
  defaultView = 'month',
  onViewChange,
  className,
}: CalendarViewSelectorProps) {
  const id = useId();
  const [selectedView, setSelectedView] = useState<CalendarView>(defaultView);

  const handleViewChange = (value: string) => {
    const view = value as CalendarView;
    setSelectedView(view);
    onViewChange?.(view);
  };

  return (
    <div className={`bg-input/50 inline-flex h-9 rounded-md p-0.5 ${className}`}>
      <RadioGroup
        value={selectedView}
        onValueChange={handleViewChange}
        className="group relative inline-grid grid-cols-4 items-center gap-0 text-xs font-medium"
        data-state={selectedView}
      >
        {/* Sliding background element */}
        <div
          className="bg-background dark:bg-background/80 absolute inset-y-0 w-1/4 rounded-sm shadow-xs transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
          style={{
            transform:
              selectedView === 'day'
                ? 'translateX(0)'
                : selectedView === 'week'
                  ? 'translateX(100%)'
                  : selectedView === 'month'
                    ? 'translateX(200%)'
                    : 'translateX(300%)',
          }}
        />

        <label className="relative z-10 inline-flex h-full min-w-8 cursor-pointer items-center justify-center gap-1 px-2 whitespace-nowrap transition-colors select-none">
          <CalendarDays
            className={cn(
              'text-muted-foreground/70 h-3.5 w-3.5',
              selectedView === 'day' && 'text-foreground '
            )}
          />
          <span className={selectedView === 'day' ? 'text-foreground' : 'text-muted-foreground/70'}>
            Day
          </span>
          <RadioGroupItem id={`${id}-day`} value="day" className="sr-only" />
        </label>

        <label className="relative z-10 inline-flex h-full min-w-8 cursor-pointer items-center justify-center gap-1 px-2 whitespace-nowrap transition-colors select-none">
          <CalendarRange
            className={cn(
              'text-muted-foreground/70 h-3.5 w-3.5',
              selectedView === 'week' && 'text-foreground '
            )}
          />
          <span
            className={selectedView === 'week' ? 'text-foreground' : 'text-muted-foreground/70'}
          >
            Week
          </span>
          <RadioGroupItem id={`${id}-week`} value="week" className="sr-only" />
        </label>

        <label className="relative z-10 inline-flex h-full min-w-8 cursor-pointer items-center justify-center gap-1 px-2 whitespace-nowrap transition-colors select-none">
          <Calendar
            className={cn(
              'text-muted-foreground/70 h-3.5 w-3.5',
              selectedView === 'month' && 'text-foreground '
            )}
          />
          <span
            className={selectedView === 'month' ? 'text-foreground' : 'text-muted-foreground/70'}
          >
            Month
          </span>
          <RadioGroupItem id={`${id}-month`} value="month" className="sr-only" />
        </label>

        <label className="relative z-10 inline-flex h-full min-w-8 cursor-pointer items-center justify-center gap-1 px-2 whitespace-nowrap transition-colors select-none">
          <ListTodo
            className={cn(
              'text-muted-foreground/70 h-3.5 w-3.5',
              selectedView === 'agenda' && 'text-foreground '
            )}
          />
          <span
            className={selectedView === 'agenda' ? 'text-foreground' : 'text-muted-foreground/70'}
          >
            Agenda
          </span>
          <RadioGroupItem id={`${id}-agenda`} value="agenda" className="sr-only" />
        </label>
      </RadioGroup>
    </div>
  );
}
