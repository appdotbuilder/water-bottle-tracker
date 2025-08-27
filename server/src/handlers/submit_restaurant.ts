import { db } from '../db';
import { restaurantsTable } from '../db/schema';
import { type SubmitRestaurantInput, type SuccessResponse } from '../schema';
import { eq, and } from 'drizzle-orm';

export async function submitRestaurant(input: SubmitRestaurantInput): Promise<SuccessResponse> {
  try {
    // Check for duplicate restaurant by name and address
    const existingRestaurant = await db.select()
      .from(restaurantsTable)
      .where(
        and(
          eq(restaurantsTable.name, input.name),
          eq(restaurantsTable.address, input.address)
        )
      )
      .execute();

    if (existingRestaurant.length > 0) {
      throw new Error(`Restaurant "${input.name}" at "${input.address}" has already been submitted`);
    }

    // Insert new restaurant with 'pending' status
    await db.insert(restaurantsTable)
      .values({
        name: input.name,
        address: input.address,
        latitude: input.latitude,
        longitude: input.longitude,
        water_billing_policy: input.water_billing_policy,
        submission_status: 'pending'
        // submitted_at will be set automatically by defaultNow()
        // reviewed_at, reviewed_by, and notes remain null for pending status
      })
      .execute();

    return {
      success: true,
      message: `Restaurant "${input.name}" has been submitted for review. Thank you for your contribution!`
    };
  } catch (error) {
    console.error('Restaurant submission failed:', error);
    throw error;
  }
}