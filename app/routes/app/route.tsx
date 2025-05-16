import { ModeToggle } from '@/components/ui/mode-toggle';
import { createFileRoute, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/app')({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <main className="flex h-screen items-start justify-start bg-gradient-to-b from-[#006147] from-0% to-[#003f2e] to-100% dark:bg-gradient-to-b dark:!from-[#006147] dark:from-0% dark:!to-[#003f2e] dark:to-100%">
      {/* Mini-sidebar */}
      <div className="w-16 p-4">
        <ModeToggle />
      </div>

      {/* Content */}
      <div className="bg-background m-2 ml-1 flex h-[calc(100vh-1rem)] flex-1 flex-col overflow-hidden rounded-md">
        <Outlet />
      </div>
    </main>
  );
}
