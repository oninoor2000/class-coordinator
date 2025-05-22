import type { RecurrenceRule, RecurrenceFrequency } from '@/lib/types/calendar-types';
import { addDays } from 'date-fns';

const WEEKDAY_MAP = {
  0: 'SU',
  1: 'MO',
  2: 'TU',
  3: 'WE',
  4: 'TH',
  5: 'FR',
  6: 'SA',
} as const;

const WEEKDAY_REVERSE_MAP = {
  SU: 0,
  MO: 1,
  TU: 2,
  WE: 3,
  TH: 4,
  FR: 5,
  SA: 6,
} as const;

type WeekDay = keyof typeof WEEKDAY_MAP;
type ICalWeekDay = (typeof WEEKDAY_MAP)[WeekDay];

function isValidFrequency(freq: string): freq is RecurrenceFrequency {
  return ['daily', 'weekly', 'monthly', 'yearly'].includes(freq);
}

function isValidWeekDay(day: unknown): day is WeekDay {
  return typeof day === 'number' && day >= 0 && day <= 6; // Ubah day > 0 menjadi day >= 0
}

function isValidICalWeekDay(day: string): day is ICalWeekDay {
  return day in WEEKDAY_REVERSE_MAP;
}

/**
 * Converts a RecurrenceRule object to an RFC 5545 (iCalendar) RRULE string
 * @param rule - The RecurrenceRule object to convert
 * @returns The RFC 5545 (iCalendar) RRULE string
 * @throws If the rule is invalid
 * @example
 * const rule = {
 *   frequency: "weekly",
 *   interval: 1,
 *   weekDays: [0, 1, 2, 3, 4],
 *   endDate: new Date("2024-01-01"),
 *   count: 10,
 * };
 * const rruleString = recurrenceRuleToString(rule);
 * console.log(rruleString); // "RRULE:FREQ=WEEKLY;INTERVAL=1;BYDAY=SU,MO,TU,WE,TH,FR,SA;UNTIL=20240101;COUNT=10"
 */
export function recurrenceRuleToString(rule: RecurrenceRule): string {
  const parts: string[] = [];

  // Add frequency
  parts.push(`FREQ=${rule.frequency.toLocaleUpperCase()}`);

  // Add interval if not 1
  if (rule.interval > 1) {
    parts.push(`INTERVAL=${rule.interval}`);
  }

  // Add weekdays for weekly recurrence
  if (rule.weekDays?.length) {
    // Filter and validate weekdays
    const validDays = rule.weekDays.filter(
      (day): day is keyof typeof WEEKDAY_MAP => typeof day === 'number' && day >= 0 && day <= 6
    );

    if (validDays.length) {
      const days = validDays.map(day => WEEKDAY_MAP[day]);
      parts.push(`BYDAY=${days.join(',')}`);
    }
  }

  // Add end date if specified and valid
  if (rule.endDate instanceof Date && !isNaN(rule.endDate.getTime())) {
    const date = rule.endDate?.toDateString().split('T')[0]?.replace(/-/g, '');
    parts.push(`UNTIL=${date}`);
  }

  // Add count if specified
  if (typeof rule.count === 'number' && rule.count > 0) {
    parts.push(`COUNT=${rule.count}`);
  }

  return `RRULE:${parts.join(';')}`;
}

/**
 * Converts an RFC 5545 (iCalendar) RRULE string to a RecurrenceRule object
 * @param rruleString - The RFC 5545 (iCalendar) RRULE string to convert
 * @returns The RecurrenceRule object
 * @throws If the string is invalid
 * @example
 * const rruleString = "RRULE:FREQ=WEEKLY;INTERVAL=1;BYDAY=SU,MO,TU,WE,TH,FR,SA;UNTIL=20240101;COUNT=10";
 * const rule = stringToRecurrenceRule(rruleString);
 * console.log(rule); // { frequency: "weekly", interval: 1, weekDays: [0, 1, 2, 3, 4], endDate: new Date("2024-01-01"), count: 10 }
 */

export function stringToRecurrenceRule(rruleString: string): RecurrenceRule {
  const rule: Partial<RecurrenceRule> & { frequency?: RecurrenceFrequency } = {
    interval: 1,
  };

  // Remove RRULE: prefix if present
  const cleanString = rruleString.replace(/^RRULE:/, '');

  // Split into parts and parse each one
  cleanString.split(';').forEach(part => {
    const [key, value] = part.split('=');
    if (!key || !value) return;

    switch (key) {
      case 'FREQ': {
        const freq = value?.toLowerCase();
        if (isValidFrequency(freq)) {
          rule.frequency = freq;
        }
        break;
      }
      case 'INTERVAL': {
        const interval = parseInt(value, 10);
        if (!isNaN(interval) && interval > 0) {
          rule.interval = interval;
        }
        break;
      }
      case 'BYDAY': {
        const days = value.split(',');
        const validDays = days
          .filter(isValidICalWeekDay)
          .map(day => WEEKDAY_REVERSE_MAP[day])
          .filter(isValidWeekDay);

        if (validDays.length) {
          rule.weekDays = validDays;
        }
        break;
      }
      case 'UNTIL': {
        if (value.length === 8) {
          const year = value.slice(0, 4);
          const month = value.slice(4, 6);
          const day = value.slice(6, 8);
          const date = new Date(`${year}-${month}-${day}`);

          if (!isNaN(date.getTime())) {
            rule.endDate = date;
          }
        }
        break;
      }
      case 'COUNT': {
        const count = parseInt(value, 10);
        if (!isNaN(count) && count > 0) {
          rule.count = count;
        }
        break;
      }
    }
  });

  // Ensure required fields are present and return with proper defaults
  if (!rule.frequency) throw new Error('Invalid RRULE: frequency is required');

  return {
    frequency: rule.frequency,
    interval: rule.interval ?? 1,
    weekDays: rule.weekDays ?? [],
    endDate: rule.endDate ?? null,
    count: rule.count ?? null,
  };
}

/**
 * Generates a human-readable description of a recurrence rule
 * @param rule - The RecurrenceRule object to describe
 * @returns A human-readable description of the recurrence rule
 * @example
 * const rule = {
 *   frequency: "weekly",
 *   interval: 1,
 *   weekDays: [0, 1, 2, 3, 4],
 *   endDate: new Date("2024-01-01"),
 *   count: 10,
 * };
 * const description = getRecurrenceDescription(rule);
 * console.log(description); // "Every week on Monday, Tuesday, Wednesday, Thursday, Friday until January 1, 2024, 10 times"
 */

export function getRecurrenceDescription(rule: RecurrenceRule): string {
  const { frequency, interval, weekDays } = rule;

  let base = '';
  if (interval === 1) {
    switch (frequency) {
      case 'daily':
        base = 'Every day';
        break;
      case 'weekly':
        {
          const firstDay = weekDays ? weekDays[0] : [];
          if (weekDays?.length === 1 && isValidWeekDay(firstDay)) {
            // The hard coded 2024, 0, 7 is because 2024 is a leap year and January 7 is the first Monday of the year
            const dayName = addDays(new Date(2024, 0, 7), firstDay).toLocaleDateString('en-US', {
              weekday: 'long',
            });
            base = `Every ${dayName}`;
          } else if (weekDays?.length) {
            const dayNames = weekDays
              .filter(isValidWeekDay)
              .map(day =>
                addDays(new Date(2024, 0, 7), day).toLocaleDateString('en-US', {
                  weekday: 'short',
                })
              )
              .join(', ');
            base = `Every week on ${dayNames}`;
          } else {
            base = 'Every week';
          }
        }
        break;
      case 'monthly':
        base = 'Every month';
        break;
      case 'yearly':
        base = 'Every year';
        break;
    }
  } else {
    switch (frequency) {
      case 'daily':
        base = `Every ${interval} days`;
        break;
      case 'weekly':
        {
          base = `Every ${interval} weeks`;
          const firstDay = weekDays ? weekDays[0] : [];
          if (weekDays?.length === 1 && isValidWeekDay(firstDay)) {
            const dayName = addDays(new Date(2024, 0, 7), firstDay).toLocaleDateString('en-US', {
              weekday: 'long',
            });
            base += ` on ${dayName}`;
          } else if (weekDays?.length) {
            const dayNames = weekDays
              .filter(isValidWeekDay)
              .map(day =>
                addDays(new Date(2024, 0, 7), day).toLocaleDateString('en-US', {
                  weekday: 'short',
                })
              )
              .join(', ');

            base = ` on ${dayNames}`;
          }
        }
        break;
      case 'monthly':
        base = `Every ${interval} months`;
        break;
      case 'yearly':
        base = `Every ${interval} years`;
        break;
    }
  }

  // Add end condition
  if (rule.endDate instanceof Date) {
    base += ` until ${rule.endDate.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })}`;
  } else if (typeof rule.count === 'number' && rule.count > 0) {
    base += `, ${rule.count} times`;
  }

  return base;
}
