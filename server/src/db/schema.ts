import { serial, text, pgTable, timestamp, real, pgEnum } from 'drizzle-orm/pg-core';

// Define enums for PostgreSQL
export const submissionStatusEnum = pgEnum('submission_status', ['pending', 'approved', 'rejected']);
export const waterBillingPolicyEnum = pgEnum('water_billing_policy', ['free', 'paid']);

// Restaurants table to store all restaurant submissions
export const restaurantsTable = pgTable('restaurants', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  address: text('address').notNull(),
  latitude: real('latitude').notNull(), // Use real for coordinate precision
  longitude: real('longitude').notNull(),
  water_billing_policy: waterBillingPolicyEnum('water_billing_policy').notNull(),
  submission_status: submissionStatusEnum('submission_status').notNull().default('pending'),
  submitted_at: timestamp('submitted_at').defaultNow().notNull(),
  reviewed_at: timestamp('reviewed_at'), // Nullable - set when admin reviews
  reviewed_by: text('reviewed_by'), // Nullable - admin username who reviewed
  notes: text('notes') // Nullable - optional notes from admin review
});

// TypeScript types for the table schema
export type Restaurant = typeof restaurantsTable.$inferSelect; // For SELECT operations
export type NewRestaurant = typeof restaurantsTable.$inferInsert; // For INSERT operations

// Admin users table for authentication (simple implementation)
export const adminUsersTable = pgTable('admin_users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  password_hash: text('password_hash').notNull(), // Store hashed passwords
  created_at: timestamp('created_at').defaultNow().notNull()
});

// TypeScript types for admin users table
export type AdminUser = typeof adminUsersTable.$inferSelect;
export type NewAdminUser = typeof adminUsersTable.$inferInsert;

// Important: Export all tables for proper query building
export const tables = { 
  restaurants: restaurantsTable,
  adminUsers: adminUsersTable
};