import { redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { eq } from "drizzle-orm";
import { db } from "#/lib/db/client";
import { sessions } from "#/lib/db/schema";

function parseSessionCookie(cookieHeader: string): string | null {
  for (const part of cookieHeader.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key.trim() === "better-auth.session_token") {
      return decodeURIComponent(rest.join("=").trim());
    }
  }
  return null;
}

export const getSession = createServerFn().handler(async () => {
  const request = getRequest();
  const cookieHeader = request.headers.get("cookie") ?? "";
  const token = parseSessionCookie(cookieHeader);

  if (!token) {
    throw redirect({ to: "/" });
  }

  const result = await db
    .select()
    .from(sessions)
    .where(eq(sessions.token, token))
    .limit(1);

  if (!result.length || result[0].expiresAt < new Date()) {
    throw redirect({ to: "/" });
  }

  return { userId: result[0].userId };
});
