import type { CalendarView } from '@/lib/types/calendar-types';

import { Button } from '../ui/button';
import { SidebarButton } from './sidebar/sidebar-toggle';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';

import CalendarViewSelector from './calendar-view-selector';

type CalendarHeaderProps = {
  date: Date;
  view: CalendarView;
  onViewChange: (view: CalendarView) => void;
  onNavigate: (action: 'prev' | 'next' | 'today') => void;
  setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  sidebarOpen: boolean;
};

/**
 * This component is used to show the header of the calendar.
 * It shows the sidebar button, the date, and the view selector.
 * @param date - The date to show in the header.
 * @param view - The available views of the calendar.
 * @param onViewChange - The function to call when the view changes.
 * @param onNavigate - The function to call when the date is navigated.
 * @param setSidebarOpen - The function to call to toggle the sidebar.
 * @param sidebarOpen - Boolean to check if the sidebar is open.
 */
export default function CalendarHeader({
  date,
  view,
  onViewChange,
  onNavigate,
  setSidebarOpen,
  sidebarOpen,
}: CalendarHeaderProps) {
  const getHeaderTitle = () => {
    // Ensure date is a valid Date object
    const validDate = date instanceof Date ? date : new Date();

    switch (view) {
      case 'day':
        return validDate.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
      case 'week':
        return validDate.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
        });
      case 'month':
        return validDate.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
        });
      case 'agenda':
        return validDate.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
      default:
        return '';
    }
  };

  return (
    <div className="flex w-full flex-col items-center justify-between gap-4 md:flex-row">
      <div className="flex items-center gap-2">
        <SidebarButton setSidebarOpen={setSidebarOpen} sidebarOpen={sidebarOpen} place="main" />
        <div className="flex items-center rounded-md">
          <Button
            variant="ghost"
            size="icon"
            className="cursor-pointer rounded-l-md rounded-r-none"
            onClick={() => onNavigate('prev')}
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="cursor-pointer rounded-none"
            onClick={() => onNavigate('today')}
          >
            Today
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="cursor-pointer rounded-l-none rounded-r-md"
            onClick={() => onNavigate('next')}
          >
            <ChevronRightIcon className="h-4 w-4" />
          </Button>
        </div>

        <h2 className="text-sm font-medium">{getHeaderTitle()}</h2>
      </div>

      <CalendarViewSelector defaultView={view} onViewChange={onViewChange} />
    </div>
  );
}
