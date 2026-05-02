import { db } from "#/lib/db/client";
import { stravaTokens, users } from "#/lib/db/schema";
import { exchangeToken } from "#/lib/strava";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { createServerFn } from "node_modules/@tanstack/start-client-core/dist/esm/createServerFn";
import { eq } from "drizzle-orm";
import { auth } from "#/lib/auth";

const handleCallback = createServerFn({
  method: "GET",
})
  .inputValidator((data: unknown) => {
    const params = data as Record<string, string>;

    if (!params.code) {
      throw new Error("No code in callback");
    }

    return params.code as string;
  })
  .handler(async ({ data: code }) => {
    const tokenData = await exchangeToken(code);
    const athlete = tokenData.athlete;
    let userId: string;

    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.stravaId, athlete.id))
      .limit(1);

    if (existingUser.length > 0) {
      userId = existingUser[0].id;
    } else {
      const newUser = await db
        .insert(users)
        .values({
          id: crypto.randomUUID(),
          stravaId: athlete.id,
          firstName: athlete.firstName,
          lastName: athlete.lastName,
          avatar: athlete.profile,
          city: athlete.city,
          country: athlete.country,
          createdAt: new Date(),
        })
        .returning();

      userId = newUser[0].id;
    }
    //insert tokens into db
    await db
      .insert(stravaTokens)
      .values({
        id: crypto.randomUUID(),
        userId,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresAt: tokenData.expires_at,
        scope: "read,activity:read",
      })
      .onConflictDoUpdate({
        target: stravaTokens.userId,
        set: {
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          expiresAt: tokenData.expires_at,
        },
      });

    await auth.api.signInEmail({
      body: { userId },
    });

    throw redirect({
      to: "/dashboard",
    });
  });

export const Route = createFileRoute("/auth/callback")({
  loader: ({ location }) =>
    handleCallback({
      data: Object.fromEntries(new URLSearchParams(location.search)),
    }),
  component: () => <div>Connecting to Strava</div>,
});
