import { Button } from "#/components/ui/button";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <div className="flex flex-col items-center gap-3 text-center">
        <h1 className="text-5xl font-bold tracking-tight">Straterize</h1>
        <p className="text-muted-foreground max-w-md text-lg">
          Your personal running analytics dashboard. Powered by Strava.
        </p>
      </div>
      <a href="/auth/strava">
        <Button size="lg">Connect with Strava</Button>
      </a>
    </main>
  );
}
