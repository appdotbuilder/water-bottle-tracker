import { db } from '../db';
import { restaurantsTable } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { type SubmitRestaurantInput, type SuccessResponse } from '../schema';

export const submitRestaurant = async (input: SubmitRestaurantInput): Promise<SuccessResponse> => {
  try {
    // Check for duplicate restaurant (same name AND address)
    const existingRestaurants = await db
      .select()
      .from(restaurantsTable)
      .where(
        and(
          eq(restaurantsTable.name, input.name),
          eq(restaurantsTable.address, input.address)
        )
      )
      .execute();

    if (existingRestaurants.length > 0) {
      throw new Error(`Restaurant "${input.name}" at "${input.address}" has already been submitted`);
    }

    // Insert restaurant record with pending status (default)
    const result = await db.insert(restaurantsTable)
      .values({
        name: input.name,
        address: input.address,
        latitude: input.latitude,
        longitude: input.longitude,
        water_billing_policy: input.water_billing_policy
      })
      .returning()
      .execute();

    return {
      success: true,
      message: `Restaurant "${input.name}" has been submitted for review. Thank you for your contribution!`
    };
  } catch (error) {
    console.error('Restaurant submission failed:', error);
    throw error;
  }
};