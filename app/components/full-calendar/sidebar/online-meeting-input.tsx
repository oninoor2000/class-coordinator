import { useState } from 'react';

import type { links } from '@/lib/server/db/schema';
import type { UseFormReturn } from 'react-hook-form';
import type { SidebarEventFormSchemaType } from '@/lib/schema/calendar-schema';

import { Button } from '@/components/ui/button';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Link as LinkIcon, PlusCircle } from 'lucide-react';

interface OnlineMeetingInputProps {
  isVisible: boolean;
  MEETING_LINK_OPTIONS: (typeof links.$inferSelect)[];
  form: UseFormReturn<SidebarEventFormSchemaType>;
}

/**
 * This component is used to handle the online meeting input for the event form.
 * It shows the existing meeting links and allows the user to create a new meeting link.
 * @param isVisible - Whether the component is visible.
 * @param MEETING_LINK_OPTIONS - The options for the meeting links to be shown in the select.
 * @param form - The form for the event.
 */
export default function OnlineMeetingInput({
  form,
  isVisible,
  MEETING_LINK_OPTIONS,
}: OnlineMeetingInputProps) {
  // #### Options Set ####

  // Options set for the form
  const PLATFORM_OPTIONS = [
    {
      value: 'google-meet',
      label: 'Google Meet',
    },
    {
      value: 'zoom',
      label: 'Zoom',
    },
    {
      value: 'youtube',
      label: 'YouTube',
    },
  ] as const;

  // #### State ####

  // State for the link option
  const [linkOption, setLinkOption] = useState<'existing' | 'new'>('existing');

  // Handle link option change
  function handleLinkOptionChange(value: 'existing' | 'new') {
    setLinkOption(value);

    if (value === 'new') {
      form.setValue('meetingLinkId', undefined);
      form.setValue('newMeetingLink', {
        platform: 'zoom',
        name: '',
        url: '',
        meetingUsername: undefined,
        meetingPassword: undefined,
        description: undefined,
      });
    }
  }

  if (!isVisible) return null;

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium">Online Meeting Details</h3>

      <RadioGroup
        defaultValue="existing"
        value={linkOption}
        onValueChange={handleLinkOptionChange}
        className="flex flex-col space-y-1"
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="existing" id="existing" />
          <Label htmlFor="existing" className="cursor-pointer">
            Use existing link
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="new" id="new" />
          <Label htmlFor="new" className="cursor-pointer">
            Create new link
          </Label>
        </div>
      </RadioGroup>

      {linkOption === 'existing' ? (
        <FormField
          control={form.control}
          name="meetingLinkId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Select Meeting Link</FormLabel>
              <FormControl>
                <Select
                  onValueChange={value => {
                    field.onChange(parseInt(value));
                  }}
                  value={field.value?.toString()}
                >
                  <SelectTrigger className="hover:bg-accent min-h-16 w-full cursor-pointer transition-all">
                    <SelectValue placeholder="Select a meeting link" />
                  </SelectTrigger>
                  <SelectContent>
                    {MEETING_LINK_OPTIONS.map(link => (
                      <SelectItem
                        className="h-auto cursor-pointer py-2"
                        key={link.id}
                        value={link.id.toString()}
                      >
                        <div className="flex flex-col gap-0.5">
                          <span className="line-clamp-1 text-left font-medium">{link.name}</span>
                          <span className="text-muted-foreground line-clamp-2 text-left text-xs">
                            {link.platform} - {link.shortenedUrl}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      ) : (
        <div className="space-y-4 rounded-md border p-3">
          <FormField
            control={form.control}
            name="newMeetingLink.platform"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Platform</FormLabel>
                <FormControl>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className="hover:bg-accent w-full cursor-pointer transition-all">
                      <SelectValue placeholder="Select platform" />
                    </SelectTrigger>
                    <SelectContent>
                      {PLATFORM_OPTIONS.map(option => (
                        <SelectItem
                          className="cursor-pointer"
                          key={option.value}
                          value={option.value}
                        >
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="newMeetingLink.name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Link Name</FormLabel>
                <FormControl>
                  <Input placeholder="E.g., Weekly Class Meeting" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="newMeetingLink.url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Meeting URL</FormLabel>
                <FormControl>
                  <div className="flex items-center space-x-2">
                    <LinkIcon className="h-4 w-4 opacity-50" />
                    <Input placeholder="https://..." {...field} />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="newMeetingLink.meetingUsername"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Meeting username" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="newMeetingLink.meetingPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Meeting password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="newMeetingLink.description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="Brief description of the meeting" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="button" variant="outline" size="sm" className="w-full cursor-pointer">
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Meeting Link
          </Button>
        </div>
      )}
    </div>
  );
}
