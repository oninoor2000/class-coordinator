import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, ArrowLeft, Home } from 'lucide-react';

export function NotFound({ children }: { children?: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-background to-muted/20">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center border-b pb-4">
          <div className="flex justify-center mb-4">
            <AlertCircle size={40} className="text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Page Not Found</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="text-muted-foreground text-center">
            {children || <p>The page you are looking for doesn't exist or has been moved.</p>}
          </div>
        </CardContent>
        <CardFooter className="flex gap-3 justify-center pt-2 pb-6">
          <Button
            variant="outline"
            onClick={() => window.history.back()}
            className="flex items-center gap-2 cursor-pointer"
          >
            <ArrowLeft size={16} />
            Go Back
          </Button>
          <Link to="/">
            <Button className="flex items-center gap-2 cursor-pointer">
              <Home size={16} />
              Home Page
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
