import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/auth/strava")({
  loader: () => {
    const params = new URLSearchParams({
      client_id: import.meta.env.VITE_STRAVA_CLIENT_ID,
      redirect_uri: import.meta.env.VITE_STRAVA_REDIRECT_URI,
      response_type: "code",
      approval_prompt: "auto",
      scope: "read,activity:read_all",
    });

    throw redirect({
      href: `https://www.strava.com/oauth/authorize?${params.toString()}`,
    });
  },
  component: () => null,
});
