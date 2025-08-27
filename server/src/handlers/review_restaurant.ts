import { db } from '../db';
import { restaurantsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type ReviewRestaurantInput, type SuccessResponse } from '../schema';

export const reviewRestaurant = async (input: ReviewRestaurantInput): Promise<SuccessResponse> => {
  try {
    // First check if restaurant exists and is in pending status
    const existingRestaurants = await db
      .select()
      .from(restaurantsTable)
      .where(eq(restaurantsTable.id, input.id))
      .execute();

    if (existingRestaurants.length === 0) {
      throw new Error('Restaurant not found or not in pending status');
    }

    const restaurant = existingRestaurants[0];
    if (restaurant.submission_status !== 'pending') {
      throw new Error('Restaurant not found or not in pending status');
    }

    // Determine the new status based on the action
    const newStatus = input.action === 'approve' ? 'approved' : 'rejected';

    // Update the restaurant record
    const result = await db
      .update(restaurantsTable)
      .set({
        submission_status: newStatus,
        reviewed_at: new Date(),
        reviewed_by: input.reviewed_by,
        notes: input.notes || null
      })
      .where(eq(restaurantsTable.id, input.id))
      .returning()
      .execute();

    const actionPastTense = input.action === 'approve' ? 'approved' : 'rejected';
    
    return {
      success: true,
      message: `Restaurant submission has been ${actionPastTense} by ${input.reviewed_by}.`
    };
  } catch (error) {
    console.error('Restaurant review failed:', error);
    throw error;
  }
};