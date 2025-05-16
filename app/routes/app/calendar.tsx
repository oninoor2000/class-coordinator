import { createFileRoute } from '@tanstack/react-router';

import FullCalendar from '@/components/full-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
export const Route = createFileRoute('/app/calendar')({
  component: RouteComponent,
});

function RouteComponent() {
  return <FullCalendar />;
}
