import { z } from 'zod';

// Restaurant submission status enum
export const submissionStatusSchema = z.enum(['pending', 'approved', 'rejected']);
export type SubmissionStatus = z.infer<typeof submissionStatusSchema>;

// Water billing policy enum
export const waterBillingPolicySchema = z.enum(['free', 'paid']);
export type WaterBillingPolicy = z.infer<typeof waterBillingPolicySchema>;

// Restaurant schema for database records
export const restaurantSchema = z.object({
  id: z.number(),
  name: z.string(),
  address: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  water_billing_policy: waterBillingPolicySchema,
  submission_status: submissionStatusSchema,
  submitted_at: z.coerce.date(),
  reviewed_at: z.coerce.date().nullable(),
  reviewed_by: z.string().nullable(), // Admin username who reviewed
  notes: z.string().nullable() // Optional notes from admin review
});

export type Restaurant = z.infer<typeof restaurantSchema>;

// Input schema for anonymous restaurant submission
export const submitRestaurantInputSchema = z.object({
  name: z.string().min(1, "Restaurant name is required"),
  address: z.string().min(1, "Address is required"),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  water_billing_policy: waterBillingPolicySchema
});

export type SubmitRestaurantInput = z.infer<typeof submitRestaurantInputSchema>;

// Input schema for admin review of restaurant submissions
export const reviewRestaurantInputSchema = z.object({
  id: z.number(),
  action: z.enum(['approve', 'reject']),
  reviewed_by: z.string().min(1, "Reviewer name is required"),
  notes: z.string().nullable().optional() // Optional notes from admin
});

export type ReviewRestaurantInput = z.infer<typeof reviewRestaurantInputSchema>;

// Schema for fetching approved restaurants (for map display)
export const getApprovedRestaurantsOutputSchema = z.array(
  restaurantSchema.pick({
    id: true,
    name: true,
    address: true,
    latitude: true,
    longitude: true,
    water_billing_policy: true
  })
);

export type ApprovedRestaurant = z.infer<typeof getApprovedRestaurantsOutputSchema>[number];

// Schema for fetching pending restaurants (for admin panel)
export const getPendingRestaurantsOutputSchema = z.array(
  restaurantSchema.omit({
    reviewed_at: true,
    reviewed_by: true
  })
);

export type PendingRestaurant = z.infer<typeof getPendingRestaurantsOutputSchema>[number];

// Admin authentication schema
export const adminLoginInputSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required")
});

export type AdminLoginInput = z.infer<typeof adminLoginInputSchema>;

// Response schema for successful operations
export const successResponseSchema = z.object({
  success: z.boolean(),
  message: z.string()
});

export type SuccessResponse = z.infer<typeof successResponseSchema>;

// Response schema for admin login (includes token)
export const adminLoginResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  token: z.string().optional() // Only present on successful login
});

export type AdminLoginResponse = z.infer<typeof adminLoginResponseSchema>;