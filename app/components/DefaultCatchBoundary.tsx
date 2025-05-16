import { ErrorComponent, Link, rootRouteId, useMatch, useRouter } from '@tanstack/react-router';
import type { ErrorComponentProps } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCcw, Home, ArrowLeft } from 'lucide-react';

export function DefaultCatchBoundary({ error }: ErrorComponentProps) {
  const router = useRouter();
  const isRoot = useMatch({
    strict: false,
    select: state => state.id === rootRouteId,
  });

  console.error('DefaultCatchBoundary Error:', error);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-background to-muted/20">
      <Card className="w-full max-w-lg shadow-lg">
        <CardHeader className="text-center border-b pb-4">
          <div className="flex justify-center mb-4">
            <AlertTriangle size={40} className="text-destructive" />
          </div>
          <CardTitle className="text-2xl font-bold">Something went wrong</CardTitle>
        </CardHeader>
        <CardContent className="pt-6 flex flex-col items-center">
          <div className="max-w-full overflow-auto rounded-lg bg-muted/50 p-4 my-2 text-sm">
            <ErrorComponent error={error} />
          </div>
        </CardContent>
        <CardFooter className="flex gap-3 justify-center pt-2 pb-6">
          <Button
            variant="outline"
            onClick={() => router.invalidate()}
            className="flex items-center gap-2"
          >
            <RefreshCcw size={16} />
            Try Again
          </Button>

          {isRoot ? (
            <Link to="/">
              <Button className="flex items-center gap-2">
                <Home size={16} />
                Home
              </Button>
            </Link>
          ) : (
            <Button className="flex items-center gap-2" onClick={() => window.history.back()}>
              <ArrowLeft size={16} />
              Go Back
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
