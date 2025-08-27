import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas and handlers
import { 
  submitRestaurantInputSchema,
  reviewRestaurantInputSchema,
  adminLoginInputSchema
} from './schema';
import { submitRestaurant } from './handlers/submit_restaurant';
import { getApprovedRestaurants } from './handlers/get_approved_restaurants';
import { getPendingRestaurants } from './handlers/get_pending_restaurants';
import { reviewRestaurant } from './handlers/review_restaurant';
import { adminLogin } from './handlers/admin_login';
import { getRestaurantById } from './handlers/get_restaurant_by_id';
import { db } from './db';
import { adminUsersTable } from './db/schema';
import { count } from 'drizzle-orm';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check endpoint
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Public endpoints for anonymous users
  submitRestaurant: publicProcedure
    .input(submitRestaurantInputSchema)
    .mutation(({ input }) => submitRestaurant(input)),

  getApprovedRestaurants: publicProcedure
    .query(() => getApprovedRestaurants()),

  getRestaurantById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => getRestaurantById(input.id)),

  // Admin authentication endpoint
  adminLogin: publicProcedure
    .input(adminLoginInputSchema)
    .mutation(({ input }) => adminLogin(input)),

  // Admin-only endpoints (authentication should be implemented in real code)
  getPendingRestaurants: publicProcedure
    .query(() => getPendingRestaurants()),

  reviewRestaurant: publicProcedure
    .input(reviewRestaurantInputSchema)
    .mutation(({ input }) => reviewRestaurant(input)),
});

export type AppRouter = typeof appRouter;

// Simple password hashing function using Bun's built-in password hashing
const hashPassword = async (password: string): Promise<string> => {
  return await Bun.password.hash(password, {
    algorithm: "bcrypt",
    cost: 10,
  });
};

// Initialize admin user if none exist
const initializeAdminUser = async () => {
  try {
    // Check if any admin users exist
    const adminCountResult = await db
      .select({ count: count() })
      .from(adminUsersTable)
      .execute();

    const adminCount = adminCountResult[0].count;

    if (adminCount === 0) {
      console.log('No admin users found. Creating default admin user...');
      
      // Hash the default password
      const hashedPassword = await hashPassword('admin');

      // Create the default admin user
      await db.insert(adminUsersTable)
        .values({
          username: 'admin',
          password_hash: hashedPassword
        })
        .execute();

      console.log('Default admin user created successfully (username: admin, password: admin)');
    } else {
      console.log(`Admin users exist: ${adminCount} user(s) found`);
    }
  } catch (error) {
    console.error('Failed to initialize admin user:', error);
    throw error;
  }
};

async function start() {
  try {
    // Initialize admin user before starting server
    await initializeAdminUser();
    
    const port = process.env['SERVER_PORT'] || 2022;
    const server = createHTTPServer({
      middleware: (req, res, next) => {
        cors()(req, res, next);
      },
      router: appRouter,
      createContext() {
        return {};
      },
    });
    server.listen(port);
    console.log(`TRPC server listening at port: ${port}`);
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();