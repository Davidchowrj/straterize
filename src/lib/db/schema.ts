import {
  pgTable,
  text,
  integer,
  timestamp,
  bigint,
  boolean,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  stravaId: bigint("strava_id", { mode: "number" }).notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  avatar: text("avatar"),
  city: text("city"),
  country: text("country"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const stravaTokens = pgTable("strava_tokens", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token").notNull(),
  expiresAt: integer("expires_at").notNull(),
  scope: text("scope"),
});

export const activities = pgTable("activities", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  sportType: text("sport_type").notNull(),
  startDate: text("start_date").notNull(),
  distance: integer("distance").notNull(),
  movingTime: integer("moving_time").notNull(),
  elapsedTime: integer("elapsed_time").notNull(),
  totalElevationGain: integer("total_elevation_gain"),
  averageSpeed: integer("average_speed"),
  averageHeartrate: integer("average_heartrate"),
  averageCadence: integer("average_cadence"),
  summaryPolyline: text("summary_polyline"),
  mapPolyline: text("map_polyline"),
  rawJson: text("raw_json"),
  cachedAt: timestamp("cached_at"),
});

// Better Auth managed tables
export const authUsers = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
export const sessions = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => authUsers.id, { onDelete: "cascade" }),
});
export const accounts = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => authUsers.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  expiresAt: timestamp("expires_at"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
export const verifications = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
