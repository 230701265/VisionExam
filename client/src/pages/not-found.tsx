import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <main
      className="min-h-screen w-full flex items-center justify-center bg-background px-6"
      role="main"
      aria-labelledby="not-found-heading"
    >
      <div className="max-w-md w-full text-center">
        {/* 404 visual */}
        <div className="relative mb-8">
          <p
            className="text-[8rem] font-black leading-none tracking-tighter text-transparent"
            style={{
              WebkitTextStroke: '2px hsl(214 32% 88%)',
            }}
            aria-hidden="true"
          >
            404
          </p>
          <div
            className="absolute inset-0 flex items-center justify-center"
            aria-hidden="true"
          >
            <div className="h-16 w-16 rounded-2xl bg-primary/8 flex items-center justify-center">
              <Search className="h-7 w-7 text-primary/60" />
            </div>
          </div>
        </div>

        <h1
          id="not-found-heading"
          className="text-2xl font-bold text-foreground mb-3"
        >
          Page not found
        </h1>
        <p className="text-muted-foreground text-base mb-8 leading-relaxed">
          The page you're looking for doesn't exist or has been moved.
          Let's get you back on track.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button asChild className="gap-2 h-10 px-5 font-medium">
            <Link href="/">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back to Dashboard
            </Link>
          </Button>
          <Button asChild variant="outline" className="gap-2 h-10 px-5 font-medium">
            <Link href="/help">
              Get help
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
