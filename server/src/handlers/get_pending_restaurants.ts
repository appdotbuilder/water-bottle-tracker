import { db } from '../db';
import { restaurantsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type PendingRestaurant } from '../schema';

export const getPendingRestaurants = async (): Promise<PendingRestaurant[]> => {
  try {
    const results = await db
      .select({
        id: restaurantsTable.id,
        name: restaurantsTable.name,
        address: restaurantsTable.address,
        latitude: restaurantsTable.latitude,
        longitude: restaurantsTable.longitude,
        water_billing_policy: restaurantsTable.water_billing_policy,
        submission_status: restaurantsTable.submission_status,
        submitted_at: restaurantsTable.submitted_at,
        notes: restaurantsTable.notes
      })
      .from(restaurantsTable)
      .where(eq(restaurantsTable.submission_status, 'pending'))
      .execute();

    return results.map(result => ({
      ...result,
      // Convert dates to proper Date objects
      submitted_at: new Date(result.submitted_at)
    }));
  } catch (error) {
    console.error('Failed to get pending restaurants:', error);
    throw error;
  }
};