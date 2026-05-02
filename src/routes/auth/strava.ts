import { createFileRoute, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";

const stravaRedirect = createServerFn().handler(() => {
  const params = new URLSearchParams({
    client_id: process.env.STRAVA_CLIENT_ID!,
    redirect_uri: process.env.STRAVA_REDIRECT_URI!,
    response_type: "code",
    approval_prompt: "auto",
    scope: "read,activity:read_all",
  });

  throw redirect({
    href: `https://www.strava.com/oauth/authorize?${params.toString()}`,
  });
});

export const Route = createFileRoute("/auth/strava")({
  loader: () => stravaRedirect(),
  component: () => null,
});
