import { createFileRoute } from "@tanstack/react-router";
import { db } from "#/lib/db/client";
import { users, type User } from "#/lib/db/schema";
import { getSession } from "#/server/functions/auth";
import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar";
import { Badge } from "#/components/ui/badge";

const getDashboardData = createServerFn().handler(async (): Promise<User> => {
  const session = await getSession();

  const result = await db
    .select()
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);

  if (!result.length) {
    throw new Error("User not found");
  }

  return result[0];
});

export const Route = createFileRoute("/dashboard")({
  loader: () => getDashboardData(),
  errorComponent: ({ error }) => (
    <main className="min-h-screen flex items-center justify-center p-8">
      <p className="text-red-500">
        {error instanceof Error ? error.message : "Something went wrong"}
      </p>
    </main>
  ),
  component: Dashboard,
});

function Dashboard() {
  const user = Route.useLoaderData();

  return (
    <main className="min-h-screen p-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-6 text-3xl font-bold">Dashboard</h1>
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Athlete Profile</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage
                src={user.avatar ?? undefined}
                alt={user.firstName}
              />
              <AvatarFallback>
                {user.firstName[0]}
                {user.lastName[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-1">
              <p className="text-xl font-semibold">
                {user.firstName} {user.lastName}
              </p>
              {user.city && user.country && (
                <Badge variant="secondary">
                  {user.city}, {user.country}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
