'use client';

import type { z } from 'zod';

import { Form, FormItem, FormLabel, FormField, FormControl } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { Textarea } from '../../ui/textarea';
import { zodResolver } from '@hookform/resolvers/zod';
import { SidebarFormSchema } from '@/lib/schema/calendar-schema';

export default function SidebarForm() {
  const form = useForm<z.infer<typeof SidebarFormSchema>>({
    resolver: zodResolver(SidebarFormSchema),
    defaultValues: {
      command: '',
    },
  });

  function onSubmit(data: z.infer<typeof SidebarFormSchema>) {
    console.log(data);
  }

  return (
    <Form {...form}>
      <form onChange={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="command"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="sr-only">Command</FormLabel>
              <FormControl>
                <Textarea placeholder="Type command..." className="h-12" {...field} />
              </FormControl>
              {/* <FormMessage /> */}
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}
