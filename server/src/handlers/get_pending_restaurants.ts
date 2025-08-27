import { db } from '../db';
import { restaurantsTable } from '../db/schema';
import { type PendingRestaurant } from '../schema';
import { eq } from 'drizzle-orm';

export const getPendingRestaurants = async (): Promise<PendingRestaurant[]> => {
  try {
    // Query restaurants with pending status
    const results = await db.select()
      .from(restaurantsTable)
      .where(eq(restaurantsTable.submission_status, 'pending'))
      .execute();

    // Convert results to match PendingRestaurant type
    // No numeric conversions needed - latitude/longitude are real type (already numbers)
    return results.map(restaurant => ({
      id: restaurant.id,
      name: restaurant.name,
      address: restaurant.address,
      latitude: restaurant.latitude,
      longitude: restaurant.longitude,
      water_billing_policy: restaurant.water_billing_policy,
      submission_status: restaurant.submission_status,
      submitted_at: restaurant.submitted_at,
      notes: restaurant.notes
    }));
  } catch (error) {
    console.error('Failed to fetch pending restaurants:', error);
    throw error;
  }
};