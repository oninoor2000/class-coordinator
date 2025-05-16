/**
 * This component is used to toggle the sidebar.
 * It shows a button that toggles the sidebar.
 * @param sidebarOpen - The state of the sidebar.
 * @param setSidebarOpen - The function to set the state of the sidebar.
 * @param place - The place of the button.
 */

import { PanelLeftOpen } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { PanelLeftClose } from 'lucide-react';

export function SidebarButton({
  sidebarOpen,
  setSidebarOpen,
  place,
}: {
  sidebarOpen: boolean;
  setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  place: 'sidebar' | 'main';
}) {
  return (
    <Button
      variant="outline"
      size="icon"
      className={cn('cursor-pointer', sidebarOpen && place === 'main' && 'hidden')}
      onClick={() => setSidebarOpen(!sidebarOpen)}
    >
      {sidebarOpen ? (
        <PanelLeftClose className="h-[1.2rem] w-[1.2rem] transition-all" />
      ) : (
        <PanelLeftOpen className="h-[1.2rem] w-[1.2rem] transition-all" />
      )}
      <span className="sr-only">Open Sidebar</span>
    </Button>
  );
}
