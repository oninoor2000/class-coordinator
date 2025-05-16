import { createFileRoute } from '@tanstack/react-router';

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Github, Code2, Package } from 'lucide-react';
import { ModeToggle } from '@/components/ui/mode-toggle';
import { createServerFn } from '@tanstack/react-start';
import { useQuery } from '@tanstack/react-query';

export const getTitle = createServerFn({
  method: 'GET',
}).handler(() => {
  return 'Tanstack Start Starter';
});

export const Route = createFileRoute('/')({
  component: Home,
  loader: async () => getTitle(),
});

function Home() {
  const title = Route.useLoaderData();

  const { data: description, isLoading } = useQuery({
    queryKey: ['test'],
    queryFn: () => fetch('/api/test', { method: 'GET' }).then(res => res.json()),
  });

  return (
    <div className="from-background to-muted/20 flex min-h-screen items-center justify-center bg-gradient-to-b p-4">
      <div className="container mx-auto max-w-4xl">
        <div className="flex flex-col items-center gap-8 text-center">
          <div className="space-y-3">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">{title}</h1>
            <p className="text-muted-foreground">
              {isLoading ? 'Loading...' : description?.message}
            </p>
          </div>

          <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="space-y-1">
                <div className="mb-2 flex justify-center">
                  <Package size={28} className="text-primary" />
                </div>
                <CardTitle className="text-xl">Modern Stack</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  Built with Tanstack Router, Query, ShadCN UI for type-safe applications
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="space-y-1">
                <div className="mb-2 flex justify-center">
                  <Code2 size={28} className="text-primary" />
                </div>
                <CardTitle className="text-xl">Type Safety</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  End-to-end type safety with TypeScript throughout the entire stack
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="space-y-1">
                <div className="mb-2 flex justify-center">
                  <Github size={28} className="text-primary" />
                </div>
                <CardTitle className="text-xl">Open Source</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  Free to use and modify as you like for your projects
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="w-full">
            <CardHeader>
              <CardTitle>Get Started</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                I'm a self-taught developer with a passion for building web applications. Feel free
                to use this starter template and let me know if you have any suggestions for
                improvements.
              </p>
            </CardContent>
            <CardFooter className="flex justify-center gap-4">
              <a href="https://github.com/oninoor2000">
                <Button variant="default" className="cursor-pointer">
                  <Github className="mr-2 h-4 w-4" />
                  View on GitHub
                </Button>
              </a>
              <a href="https://tanstack.com/">
                <Button variant="outline" className="cursor-pointer">
                  Documentation
                </Button>
              </a>
              <ModeToggle />
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
