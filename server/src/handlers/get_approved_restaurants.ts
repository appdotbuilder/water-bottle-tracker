import { db } from '../db';
import { restaurantsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type ApprovedRestaurant } from '../schema';

export const getApprovedRestaurants = async (): Promise<ApprovedRestaurant[]> => {
  try {
    const results = await db
      .select({
        id: restaurantsTable.id,
        name: restaurantsTable.name,
        address: restaurantsTable.address,
        latitude: restaurantsTable.latitude,
        longitude: restaurantsTable.longitude,
        water_billing_policy: restaurantsTable.water_billing_policy
      })
      .from(restaurantsTable)
      .where(eq(restaurantsTable.submission_status, 'approved'))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to get approved restaurants:', error);
    throw error;
  }
};