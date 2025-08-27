import { db } from '../db';
import { restaurantsTable } from '../db/schema';
import { type Restaurant } from '../schema';
import { eq } from 'drizzle-orm';

export const getRestaurantById = async (id: number): Promise<Restaurant | null> => {
  try {
    // Query for restaurant by ID
    const results = await db.select()
      .from(restaurantsTable)
      .where(eq(restaurantsTable.id, id))
      .execute();

    // Return null if no restaurant found
    if (results.length === 0) {
      return null;
    }

    const restaurant = results[0];

    // Convert real (float) columns back to numbers for latitude/longitude
    return {
      ...restaurant,
      latitude: Number(restaurant.latitude),
      longitude: Number(restaurant.longitude)
    };
  } catch (error) {
    console.error('Failed to fetch restaurant by ID:', error);
    throw error;
  }
};