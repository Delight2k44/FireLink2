import { sql } from "drizzle-orm";
import { integer, text, real, sqliteTable } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table for authentication (agents and community members)
export const users = sqliteTable("users", {
  id: text("id").primaryKey().default(sql`(lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))))`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role", { enum: ["agent", "community"] }).notNull().default("community"),
  name: text("name"),
  phone: text("phone"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`unixepoch()`),
});

// Emergency alerts table
export const alerts = sqliteTable("alerts", {
  id: text("id").primaryKey().default(sql`(lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))))`),
  lat: real("lat").notNull(),
  lng: real("lng").notNull(),
  reporterName: text("reporter_name"),
  reporterPhone: text("reporter_phone"),
  message: text("message"),
  status: text("status", { enum: ["active", "in_progress", "resolved"] }).notNull().default("active"),
  alertType: text("alert_type", { enum: ["fire", "medical", "general"] }).notNull().default("general"),
  timestamp: integer("timestamp", { mode: "timestamp" }).notNull().default(sql`unixepoch()`),
  resolvedAt: integer("resolved_at", { mode: "timestamp" }),
  assignedAgentId: text("assigned_agent_id").references(() => users.id),
});

// Callback requests table
export const callbackRequests = sqliteTable("callback_requests", {
  id: text("id").primaryKey().default(sql`(lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))))`),
  alertId: text("alert_id").notNull().references(() => alerts.id),
  requesterName: text("requester_name").notNull(),
  requesterPhone: text("requester_phone").notNull(),
  preferredTime: text("preferred_time"),
  status: text("status", { enum: ["pending", "completed", "cancelled"] }).notNull().default("pending"),
  timestamp: integer("timestamp", { mode: "timestamp" }).notNull().default(sql`unixepoch()`),
  completedAt: integer("completed_at", { mode: "timestamp" }),
});

// Community responses table (for tracking who is responding to alerts)
export const communityResponses = sqliteTable("community_responses", {
  id: text("id").primaryKey().default(sql`(lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))))`),
  alertId: text("alert_id").notNull().references(() => alerts.id),
  userId: text("user_id").references(() => users.id),
  responseType: text("response_type", { enum: ["en_route", "arrived", "assisting"] }).notNull(),
  timestamp: integer("timestamp", { mode: "timestamp" }).notNull().default(sql`unixepoch()`),
});

// Push subscriptions for web push notifications
export const pushSubscriptions = sqliteTable("push_subscriptions", {
  id: text("id").primaryKey().default(sql`(lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))))`),
  userId: text("user_id").references(() => users.id),
  subscription: text("subscription").notNull(), // JSON string of push subscription
  lat: real("lat"),
  lng: real("lng"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`unixepoch()`),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertAlertSchema = createInsertSchema(alerts).omit({
  id: true,
  timestamp: true,
  resolvedAt: true,
});

export const insertCallbackRequestSchema = createInsertSchema(callbackRequests).omit({
  id: true,
  timestamp: true,
  completedAt: true,
});

export const insertCommunityResponseSchema = createInsertSchema(communityResponses).omit({
  id: true,
  timestamp: true,
});

export const insertPushSubscriptionSchema = createInsertSchema(pushSubscriptions).omit({
  id: true,
  createdAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertAlert = z.infer<typeof insertAlertSchema>;
export type Alert = typeof alerts.$inferSelect;
export type InsertCallbackRequest = z.infer<typeof insertCallbackRequestSchema>;
export type CallbackRequest = typeof callbackRequests.$inferSelect;
export type InsertCommunityResponse = z.infer<typeof insertCommunityResponseSchema>;
export type CommunityResponse = typeof communityResponses.$inferSelect;
export type InsertPushSubscription = z.infer<typeof insertPushSubscriptionSchema>;
export type PushSubscription = typeof pushSubscriptions.$inferSelect;

// Alert creation schema with validation
export const createAlertSchema = insertAlertSchema.extend({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  reporterName: z.string().optional(),
  reporterPhone: z.string().optional(),
  message: z.string().optional(),
  alertType: z.enum(["fire", "medical", "general"]).default("general"),
});

export type CreateAlert = z.infer<typeof createAlertSchema>;
