import * as React from 'react';

import { HeadContent, Outlet, Scripts, createRootRoute } from '@tanstack/react-router';
import { seo } from '@/utils/seo';
import { Toaster } from '@/components/ui/sonner';
import { NotFound } from '@/components/NotFound';
import { getThemeServerFn } from '@/utils/theme';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ThemeProvider, useTheme } from '@/components/ui/theme-provider';
import { DefaultCatchBoundary } from '@/components/DefaultCatchBoundary';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';

import appCss from '@/lib/styles/globals.css?url';

export const Route = createRootRoute({
  component: RootComponent,
  loader: () => getThemeServerFn(),
  errorComponent: props => {
    return (
      <RootDocument>
        <DefaultCatchBoundary {...props} />
      </RootDocument>
    );
  },
  notFoundComponent: () => <NotFound />,
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      ...seo({
        title: 'Tanstack Start Starter',
        description: `Tanstack Start Starter is a starter template for building web applications with Tanstack Router, Query, ShadCN UI, and Drizzle ORM for type-safe applications.`,
      }),
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'manifest', href: '/site.webmanifest', color: '#fffff' },
      { rel: 'icon', href: '/favicon.ico' },
    ],
  }),
});

function RootComponent() {
  const data = Route.useLoaderData();
  const queryClient = new QueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={data}>
        <RootDocument>
          <Outlet />
        </RootDocument>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

function RootDocument({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();
  return (
    <html className={theme}>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}

        <TanStackRouterDevtools position="bottom-left" />
        <ReactQueryDevtools position="right" />
        <Scripts />
        <Toaster />
      </body>
    </html>
  );
}
