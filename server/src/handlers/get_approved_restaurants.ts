import { db } from '../db';
import { restaurantsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type ApprovedRestaurant } from '../schema';

export async function getApprovedRestaurants(): Promise<ApprovedRestaurant[]> {
  try {
    // Query restaurants with approved status, selecting only fields needed for map display
    const results = await db.select({
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

    // Convert real (float) coordinates to numbers for consistency
    return results.map(restaurant => ({
      ...restaurant,
      latitude: Number(restaurant.latitude),
      longitude: Number(restaurant.longitude)
    }));
  } catch (error) {
    console.error('Failed to fetch approved restaurants:', error);
    throw error;
  }
}