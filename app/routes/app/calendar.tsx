import { createFileRoute } from '@tanstack/react-router';

import FullCalendar from '@/components/full-calendar';

export const Route = createFileRoute('/app/calendar')({
  component: RouteComponent,
});

function RouteComponent() {
  return <FullCalendar />;
}
