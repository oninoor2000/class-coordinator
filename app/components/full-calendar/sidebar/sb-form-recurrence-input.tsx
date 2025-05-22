import { id } from 'date-fns/locale';
import type { UseFormReturn } from 'react-hook-form';
import { useCallback, useMemo, useState } from 'react';

import type { SidebarEventFormSchemaType } from '@/lib/schema/calendar-schema';
import type { RecurrenceFrequency, RecurrenceRule } from '@/lib/types/calendar-types';
import {
  getRecurrenceDescription,
  recurrenceRuleToString,
  stringToRecurrenceRule,
} from '@/utils/calendar/recurrence-utils';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FormItem } from '@/components/ui/form';
import { FormLabel } from '@/components/ui/form';
import { FormField } from '@/components/ui/form';
import { Repeat2, Settings2 } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { FormControl, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Dialog, DialogTitle, DialogHeader, DialogContent } from '@/components/ui/dialog';

type RecurrenceInputProps = {
  form: UseFormReturn<SidebarEventFormSchemaType>;
  recurrence: RecurrenceRule | undefined;
};
type PresetOption = {
  label: string;
  value: string;
  rule?: RecurrenceRule;
};
type EndType = 'never' | 'on' | 'after';

/**
 * This component is used to handle the recurrence input for the event form.
 * It shows the recurrence options and allows the user to select a preset or create a custom recurrence.
 * @param form - The form for the event.
 * @param recurrence - The recurrence for the event.
 */
export default function SbFormRecurrenceInput({ form, recurrence }: RecurrenceInputProps) {
  // #### Options ####
  //  ---------------

  const WEEKDAYS = [
    { value: 0, label: 'Sunday' },
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' },
  ] as const;

  const FREQUENCY_OPTIONS: { value: RecurrenceFrequency; label: string }[] = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'yearly', label: 'Yearly' },
  ];

  // Get the preset options
  const getPresetOptions = useCallback((startDate: Date): PresetOption[] => {
    const weekDay = startDate.getDay();
    const dayName = startDate.toLocaleDateString('en-US', { weekday: 'long' });
    const dayDate = startDate.getDate();

    return [
      { label: 'Does not repeat', value: 'none' },
      {
        label: 'Every weekday',
        value: 'weekday',
        rule: {
          frequency: 'weekly',
          interval: 1,
          weekDays: [1, 2, 3, 4, 5],
        },
      },
      {
        label: `Every week on ${dayName}`,
        value: 'weekly-current',
        rule: {
          frequency: 'weekly',
          interval: 1,
          weekDays: [weekDay],
        },
      },
      {
        label: `Every 2 weeks on ${dayName}`,
        value: 'biweekly-current',
        rule: {
          frequency: 'weekly',
          interval: 2,
          weekDays: [weekDay],
        },
      },
      {
        label: `Monthly on the ${getOrdinalDay(startDate)} ${dayName}`,
        value: 'monthly-current',
        rule: {
          frequency: 'monthly',
          interval: 1,
          weekDays: [weekDay],
        },
      },
      {
        label: `Monthly on day ${dayDate}`,
        value: 'monthly-date',
        rule: {
          frequency: 'monthly',
          interval: 1,
        },
      },
      { label: 'Custom...', value: 'custom' },
    ];
  }, []);

  // #### State ####
  const [isCustomDialogOpen, setIsCustomDialogOpen] = useState(false);
  const [customRule, setCustomRule] = useState<RecurrenceRule | undefined>(
    recurrence ?? {
      frequency: 'weekly',
      interval: 1,
      weekDays: [],
    }
  );
  const [selectedPreset, setSelectedPreset] = useState<string>(recurrence ? 'custom' : 'none');
  const [endType, setEndType] = useState<EndType>(
    recurrence?.count ? 'after' : recurrence?.endDate ? 'on' : 'never'
  );

  const startDate = form.getValues('start');
  const presetOptions = useMemo(() => getPresetOptions(startDate), [startDate, getPresetOptions]);

  // #### Helper functions ####
  //  ---------------

  // Get the ordinal day of the month  // Get the ordinal day of the month
  function getOrdinalDay(date: Date): string {
    const day = date.getDate();
    if (day > 3 && day < 21) return `${day}th`;
    switch (day % 10) {
      case 1:
        return `${day}st`;
      case 2:
        return `${day}nd`;
      case 3:
        return `${day}rd`;
      default:
        return `${day}th`;
    }
  }

  // #### Event Handlers ####
  //  ---------------

  // Handle preset change
  const handlePresetChange = (value: string) => {
    setSelectedPreset(value);

    if (value === 'custom') {
      // Initialize custom rule with defaults if not set
      if (!customRule) {
        setCustomRule({
          frequency: 'weekly',
          interval: 1,
          weekDays: [],
        });
      }
      setIsCustomDialogOpen(true);
      return;
    }

    const preset = presetOptions.find(option => option.value === value);
    if (preset?.rule) {
      const ruleString = recurrenceRuleToString(preset.rule);
      form.setValue('recurrence', ruleString, { shouldValidate: true });
    } else {
      form.setValue('recurrence', null, { shouldValidate: true });
    }
  };

  // Handle custom rule submit
  const handleCustomRuleSubmit = () => {
    if (!customRule?.frequency) {
      console.error('Invalid custom rule: frequency is required');
      return;
    }

    const updatedRule: RecurrenceRule = {
      frequency: customRule.frequency,
      interval: customRule.interval ?? 1,
      weekDays: customRule.weekDays ?? [],
    };

    // Add end conditions based on endType
    if (endType === 'on' && customRule.endDate) {
      updatedRule.endDate = customRule.endDate;
    } else if (endType === 'after' && customRule.count) {
      updatedRule.count = customRule.count;
    }

    const ruleString = recurrenceRuleToString(updatedRule);
    form.setValue('recurrence', ruleString, { shouldValidate: true });
    setIsCustomDialogOpen(false);
  };

  // Handle custom dialog cancel
  const handleCustomDialogCancel = () => {
    if (recurrence === undefined && selectedPreset === 'custom') {
      handlePresetChange('none');
    }

    setIsCustomDialogOpen(false);
  };

  return (
    <>
      <FormField
        control={form.control}
        name="recurrence"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="sr-only">Repeat</FormLabel>
            <div className="flex gap-2">
              <div
                className={cn(
                  'max-w-[317px] flex-1',
                  selectedPreset === 'custom' && 'max-w-[273px]'
                )}
              >
                <FormControl>
                  <Select onValueChange={handlePresetChange} value={selectedPreset}>
                    <FormControl>
                      <SelectTrigger className="hover:bg-accent w-full cursor-pointer transition-all">
                        <SelectValue
                          placeholder="Select repeat option"
                          className="flex items-center gap-2"
                        >
                          <Repeat2 className="h-4 w-4" />
                          {field.value && field.value !== 'none'
                            ? getRecurrenceDescription(
                                stringToRecurrenceRule(field.value.toString())
                              )
                            : 'Does not repeat'}
                        </SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Presets</SelectLabel>
                        {presetOptions
                          .filter(option => option.value !== 'custom')
                          .map(option => (
                            <SelectItem
                              className="cursor-pointer"
                              key={option.value}
                              value={option.value}
                            >
                              {option.label}
                            </SelectItem>
                          ))}
                      </SelectGroup>
                      <SelectSeparator />
                      <SelectGroup>
                        <SelectLabel>Custom</SelectLabel>
                        <SelectItem className="cursor-pointer" value="custom">
                          Custom...
                        </SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </FormControl>
              </div>
              {selectedPreset === 'custom' && (
                <Button
                  variant="outline"
                  size="icon"
                  type="button"
                  onClick={() => setIsCustomDialogOpen(true)}
                >
                  <Settings2 className="h-4 w-4" />
                </Button>
              )}
            </div>
            <FormMessage />
            <p>{field.value?.toString()}</p>
          </FormItem>
        )}
      />

      <Dialog open={isCustomDialogOpen} onOpenChange={setIsCustomDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Custom Recurrence</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <FormItem>
                <FormLabel>Repeat every</FormLabel>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={1}
                    className="w-20"
                    value={customRule?.interval ?? 1}
                    onChange={e =>
                      setCustomRule(prev => ({
                        frequency: prev?.frequency ?? 'weekly',
                        interval: parseInt(e.target.value) || 1,
                        weekDays: prev?.weekDays ?? [],
                        endDate: prev?.endDate,
                        count: prev?.count,
                      }))
                    }
                  />
                  <Select
                    value={customRule?.frequency ?? 'weekly'}
                    onValueChange={(value: RecurrenceFrequency) =>
                      setCustomRule(prev => ({
                        frequency: value,
                        interval: prev?.interval ?? 1,
                        weekDays: prev?.weekDays ?? [],
                        endDate: prev?.endDate,
                        count: prev?.count,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FREQUENCY_OPTIONS.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </FormItem>

              {customRule?.frequency === 'weekly' && (
                <FormItem>
                  <FormLabel>Repeat on</FormLabel>
                  <div className="flex gap-2">
                    {WEEKDAYS.map(day => (
                      <Button
                        key={day.value}
                        variant={customRule.weekDays?.includes(day.value) ? 'default' : 'outline'}
                        onClick={() =>
                          setCustomRule(prev => ({
                            frequency: prev?.frequency ?? 'weekly',
                            interval: prev?.interval ?? 1,
                            weekDays: prev?.weekDays?.includes(day.value)
                              ? prev.weekDays.filter(d => d !== day.value)
                              : [...(prev?.weekDays ?? []), day.value],
                            endDate: prev?.endDate,
                            count: prev?.count,
                          }))
                        }
                      >
                        {day.label[0]}
                      </Button>
                    ))}
                  </div>
                </FormItem>
              )}

              <FormItem className="space-y-3">
                <FormLabel>Ends</FormLabel>
                <RadioGroup value={endType} onValueChange={(value: EndType) => setEndType(value)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="never" id="never" />
                    <Label htmlFor="never">Never</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="on" id="on" />
                    <Label htmlFor="on">On</Label>
                    {endType === 'on' && (
                      <Calendar
                        mode="single"
                        selected={customRule?.endDate ?? undefined}
                        onSelect={date =>
                          setCustomRule(prev => ({
                            frequency: prev?.frequency ?? 'weekly',
                            interval: prev?.interval ?? 1,
                            endDate: date ?? undefined,
                            weekDays: prev?.weekDays ?? [],
                            count: prev?.count,
                          }))
                        }
                        disabled={date => date <= new Date()}
                        initialFocus
                        locale={id}
                      />
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="after" id="after" />
                    <Label htmlFor="after">After</Label>
                    {endType === 'after' && (
                      <Input
                        type="number"
                        min={1}
                        className="w-20"
                        value={customRule?.count ?? 1}
                        onChange={e =>
                          setCustomRule(prev => ({
                            frequency: prev?.frequency ?? 'weekly',
                            interval: prev?.interval ?? 1,
                            count: parseInt(e.target.value) || 1,
                            weekDays: prev?.weekDays,
                            endDate: prev?.endDate,
                          }))
                        }
                      />
                    )}
                    {endType === 'after' && <span>times</span>}
                  </div>
                </RadioGroup>
              </FormItem>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => handleCustomDialogCancel()}>
                Cancel
              </Button>
              <Button onClick={handleCustomRuleSubmit}>Done</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
