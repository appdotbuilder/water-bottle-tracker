import { db } from '../db';
import { restaurantsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type Restaurant } from '../schema';

export const getRestaurantById = async (id: number): Promise<Restaurant | null> => {
  try {
    const results = await db
      .select()
      .from(restaurantsTable)
      .where(eq(restaurantsTable.id, id))
      .execute();

    if (results.length === 0) {
      return null;
    }

    const restaurant = results[0];
    return {
      ...restaurant,
      // Convert dates to proper Date objects
      submitted_at: new Date(restaurant.submitted_at),
      reviewed_at: restaurant.reviewed_at ? new Date(restaurant.reviewed_at) : null
    };
  } catch (error) {
    console.error('Failed to get restaurant by ID:', error);
    throw error;
  }
};