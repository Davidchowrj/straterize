import { createFileRoute, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getRequest, setCookie } from "@tanstack/react-start/server";
import { eq } from "drizzle-orm";
import { db } from "#/lib/db/client";
import { users, stravaTokens, authUsers } from "#/lib/db/schema";
import { exchangeToken } from "#/lib/strava";
import { auth } from "#/lib/auth";

const handleCallback = createServerFn().handler(async () => {
  const request = getRequest();
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  if (!code) {
    throw redirect({ to: "/", search: { error: "missing_code" } });
  }

  // 1. Exchange code for tokens
  let tokenData;
  try {
    tokenData = await exchangeToken(code);
  } catch (e) {
    throw redirect({ to: "/", search: { error: "token_exchange_failed" } });
  }

  const athlete = tokenData.athlete;

  // 2. Upsert user
  let userId: string;
  try {
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.stravaId, athlete.id))
      .limit(1);

    if (existing.length > 0) {
      userId = existing[0].id;
    } else {
      userId = crypto.randomUUID();
      await db.insert(users).values({
        id: userId,
        stravaId: athlete.id,
        firstName: athlete.firstname,
        lastName: athlete.lastname,
        avatar: athlete.profile ?? null,
        city: athlete.city ?? null,
        country: athlete.country ?? null,
        createdAt: new Date(),
      });
    }

    // Ensure matching authUsers row for sessions FK
    await db
      .insert(authUsers)
      .values({
        id: userId,
        name: `${athlete.firstname} ${athlete.lastname}`,
        email: `strava_${athlete.id}@straterize.local`,
        emailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .onConflictDoNothing();
  } catch (e) {
    throw redirect({ to: "/", search: { error: "db_user_failed" } });
  }

  // 3. Upsert Strava tokens
  try {
    await db
      .insert(stravaTokens)
      .values({
        id: crypto.randomUUID(),
        userId,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresAt: tokenData.expires_at,
        scope: "read,activity:read_all",
      })
      .onConflictDoUpdate({
        target: stravaTokens.userId,
        set: {
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          expiresAt: tokenData.expires_at,
        },
      });
  } catch (e) {
    throw redirect({ to: "/", search: { error: "db_token_failed" } });
  }

  // 4. Create session and set cookie
  try {
    const ctx = await auth.$context;
    const session = await ctx.internalAdapter.createSession(userId);
    const cookieName = ctx.authCookies.sessionToken.name;
    const cookieAttrs = ctx.authCookies.sessionToken.attributes ?? {};

    setCookie(cookieName, session.token, {
      ...cookieAttrs,
      path: "/",
      httpOnly: true,
      sameSite: "lax",
    });
  } catch (e) {
    throw redirect({ to: "/", search: { error: "session_failed" } });
  }

  throw redirect({ to: "/dashboard" });
});

export const Route = createFileRoute("/auth/callback")({
  loader: () => handleCallback(),
  component: () => null,
});
