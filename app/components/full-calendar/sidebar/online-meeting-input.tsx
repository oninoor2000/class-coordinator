import { useMemo, useState } from 'react';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import type {
  NewMeetingLinkSchemaType,
  SidebarEventFormSchemaType,
} from '@/lib/schema/calendar-schema';
import type { links } from '@/lib/server/db/schema';
import type { UseFormReturn } from 'react-hook-form';
import type { CalendarLinkApiResponse } from '@/lib/types/calendar-types';

import {
  Command,
  CommandList,
  CommandItem,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Dialog,
  DialogTitle,
  DialogFooter,
  DialogHeader,
  DialogContent,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Form,
  FormItem,
  FormField,
  FormLabel,
  FormMessage,
  FormControl,
  FormDescription,
} from '@/components/ui/form';
import {
  Select,
  SelectItem,
  SelectValue,
  SelectContent,
  SelectTrigger,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { NewMeetingLinkSchema } from '@/lib/schema/calendar-schema';
import { createMeetingLink, getShortDomain } from '@/utils/url-shorterner';
import { Check, ChevronsUpDown, LinkIcon, Loader2, Plus } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

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
  // #### State ####
  const platformIcons = useMemo(() => {
    return {
      'google-meet': '/meet.svg',
      zoom: '/zoom.svg',
      youtube: '/youtube.svg',
    };
  }, []);
  const [MeetingLinkList, setMeetingLinkList] =
    useState<(typeof links.$inferSelect)[]>(MEETING_LINK_OPTIONS);
  const [comboboxOpen, setComboboxOpen] = useState<boolean>(false);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const queryClient = useQueryClient();
  // #### Mutations ####
  const { mutate: createNewLink, isPending: isCreatingNewLink } = useMutation<
    CalendarLinkApiResponse,
    Error,
    NewMeetingLinkSchemaType
  >({
    mutationFn: async (data: NewMeetingLinkSchemaType) => {
      const response = await fetch('/api/v1/meeting-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to create meeting link');
      }

      return (await response.json()) as CalendarLinkApiResponse;
    },
    onSuccess: (response: CalendarLinkApiResponse) => {
      queryClient.invalidateQueries({ queryKey: ['calendarOptions'] });

      setMeetingLinkList(prev => [...prev, response.data]);
      form.setValue('meetingLinkId', response.data.id);

      toast.success('Meeting link created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message ?? 'Failed to create meeting link');
    },
    onSettled: () => {
      newLinkForm.reset();
      setDialogOpen(false);
      setComboboxOpen(false);
    },
  });

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

  const newLinkForm = useForm<NewMeetingLinkSchemaType>({
    resolver: zodResolver(NewMeetingLinkSchema),
    defaultValues: {
      platform: 'zoom',
      name: '',
      url: '',
      meetingUsername: undefined,
      meetingPassword: undefined,
      description: undefined,
    },
  });

  // Handle link option change
  async function onSubmit(value: NewMeetingLinkSchemaType) {
    const linkData = createMeetingLink(value.name, value.url, {
      description: value.description,
      meetingUsername: value.meetingUsername,
      meetingPassword: value.meetingPassword,
      platform: value.platform,
      shortenerOptions: {
        customShortCode: value.shortenedUrl,
        qrOptions: {
          size: 250,
          margin: 2,
          errorCorrection: 'M',
        },
      },
    });

    createNewLink({
      platform: linkData.platform,
      name: linkData.name,
      url: linkData.url,
      shortenedUrl: linkData.shortenedUrl,
      meetingUsername: linkData.meetingUsername,
      meetingPassword: linkData.meetingPassword,
      description: linkData.description,
      // Generate a QR code URL using the QRServer API if shortenedUrl is provided
      qrImgLink: linkData.qrCodeUrl,
    });
  }

  if (!isVisible) return null;

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium">Online Meeting Details</h3>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={comboboxOpen}
              className="w-full cursor-pointer justify-between font-normal"
            >
              {form.getValues('meetingLinkId')
                ? MeetingLinkList.find(link => link?.id === form.getValues('meetingLinkId'))
                    ?.name || 'Selected meeting link'
                : 'Select a meeting link'}
              <ChevronsUpDown className="opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[350px] p-0">
            <Command>
              <CommandInput placeholder="Search meeting links..." className="h-9" />
              <CommandList>
                <CommandEmpty className="flex h-auto flex-col items-center p-2">
                  <span className="text-muted-foreground mb-2 text-sm">
                    No meeting links found.
                  </span>

                  {/* Show the create new meeting link button */}
                  <DialogTrigger className="hover:bg-accent flex w-full cursor-pointer items-center justify-center gap-2 rounded-md border p-2 transition-all duration-150">
                    <Plus className="h-4 w-4 duration-150" />
                    <p className="text-sm font-normal duration-150">Create new meeting link</p>
                  </DialogTrigger>
                </CommandEmpty>
                <CommandGroup heading="Meeting Links">
                  {MeetingLinkList.map(link => (
                    <CommandItem
                      key={link?.id ?? 'unknown'}
                      value={link?.id ? link.id.toString() : 'unknown'}
                      onSelect={currentValue => {
                        if (currentValue && !isNaN(parseInt(currentValue))) {
                          form.setValue('meetingLinkId', parseInt(currentValue));
                        }
                        setComboboxOpen(false);
                      }}
                      className="cursor-pointer"
                    >
                      <div className="flex flex-col items-start gap-1">
                        <div className="flex items-center gap-2">
                          <img
                            src={platformIcons[link?.platform]}
                            alt={link?.platform}
                            className="h-4 w-4"
                          />
                          <p className="line-clamp-2 text-sm font-medium">
                            {link?.name || 'Unnamed Link'}
                          </p>
                        </div>
                        <p className="text-muted-foreground line-clamp-2 text-xs">
                          {link?.url
                            ? link.url.startsWith('http')
                              ? link.url
                              : `https://${link.url}`
                            : '#'}
                        </p>
                      </div>
                      <Check
                        className={cn(
                          'ml-auto',
                          form.getValues('meetingLinkId') === link?.id ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>

                <CommandSeparator />

                <CommandGroup heading="Add Meeting Link">
                  {/* Show the create new meeting link button */}
                  <DialogTrigger className="w-full">
                    <CommandItem className="w-full cursor-pointer">
                      <Plus className="h-4 w-4 duration-150" />
                      <p className="text-sm font-normal duration-150">Create new meeting link</p>
                    </CommandItem>
                  </DialogTrigger>
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        <DialogContent className="max-h-[90vh] overflow-y-auto px-0 !pb-0 sm:max-w-[425px]">
          <DialogHeader className="mb-2 px-4">
            <DialogTitle>Add Meeting Link</DialogTitle>
            <DialogDescription>Add a new meeting link to the calendar.</DialogDescription>
          </DialogHeader>
          <Form {...newLinkForm}>
            <form onSubmit={newLinkForm.handleSubmit(onSubmit)}>
              <ScrollArea className="mr-1 h-[60vh] pr-3 pl-4">
                <FormField
                  control={newLinkForm.control}
                  name="platform"
                  render={({ field }) => (
                    <FormItem className="mb-5 px-1">
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
                  control={newLinkForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="mb-5 px-1">
                      <FormLabel>Link Name</FormLabel>
                      <FormControl>
                        <Input placeholder="E.g., Weekly Class Meeting" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={newLinkForm.control}
                  name="url"
                  render={({ field }) => (
                    <FormItem className="mb-5 px-1">
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

                <FormField
                  control={newLinkForm.control}
                  name="shortenedUrl"
                  render={({ field }) => (
                    <FormItem className="mb-5 px-1">
                      <FormLabel>Short URL</FormLabel>
                      <FormControl>
                        <div className="flex items-center space-x-2">
                          <span className="text-muted-foreground text-xs">{getShortDomain()}/</span>
                          <Input
                            placeholder="auto-generated if empty"
                            {...field}
                            onFocus={e => {
                              e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                      <FormDescription>
                        This is the URL that will be used to join the meeting. If not provided, the
                        short URL will be generated automatically.
                      </FormDescription>
                    </FormItem>
                  )}
                />

                <div className="mb-5 grid grid-cols-2 gap-4 px-1">
                  <FormField
                    control={newLinkForm.control}
                    name="meetingUsername"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Meeting username"
                            {...field}
                            onFocus={e => {
                              e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={newLinkForm.control}
                    name="meetingPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Meeting password"
                            {...field}
                            onFocus={e => {
                              e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={newLinkForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="mb-5 px-1">
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Brief description of the meeting"
                          {...field}
                          onFocus={e => {
                            e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </ScrollArea>
            </form>
          </Form>
          <DialogFooter className="bg-background sticky bottom-0 !mb-0 border-t px-5 !py-4">
            <Button
              size="sm"
              type="submit"
              className="dark:text-background ml-auto cursor-pointer bg-emerald-600 text-xs hover:bg-emerald-500"
              disabled={isCreatingNewLink}
              onClick={e => {
                e.preventDefault();
                newLinkForm.handleSubmit(onSubmit)();
              }}
            >
              {isCreatingNewLink && <Loader2 className="h-3 w-3 animate-spin" />}
              Create New Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
