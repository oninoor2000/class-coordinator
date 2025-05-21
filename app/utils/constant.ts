// constants.ts - Extract constants to a separate file
export const CLASS_TYPE_OPTIONS = [
  { value: 'theory', label: 'Theory' },
  { value: 'practicum', label: 'Practicum' },
  { value: 'midterm-exams', label: 'Midterm Exams' },
  { value: 'end-of-semester-exams', label: 'End of Semester Exams' },
] as const;

export const MEETING_TYPE_OPTIONS = [
  { value: 'offline', label: 'Offline' },
  { value: 'online', label: 'Online' },
  { value: 'hybrid', label: 'Hybrid' },
] as const;

export const TIME_INTERVAL = 30;

export const DURATION_OPTIONS = [
  { value: 'duration_30m', label: '30 minutes' },
  { value: 'duration_1h', label: '1 hour' },
  { value: 'duration_1h30m', label: '1 hour 30 minutes' },
  { value: 'duration_2h', label: '2 hours' },
  { value: 'duration_3h', label: '3 hours' },
];

export const DURATION_MAP = {
  duration_30m: 30,
  duration_1h: 60,
  duration_1h30m: 90,
  duration_2h: 120,
  duration_3h: 180,
} as const;

export type DurationKey = keyof typeof DURATION_MAP;
