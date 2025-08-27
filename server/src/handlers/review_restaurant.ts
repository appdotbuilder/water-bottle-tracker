import { db } from '../db';
import { restaurantsTable } from '../db/schema';
import { type ReviewRestaurantInput, type SuccessResponse } from '../schema';
import { eq, and } from 'drizzle-orm';

export async function reviewRestaurant(input: ReviewRestaurantInput): Promise<SuccessResponse> {
  try {
    // First, verify the restaurant exists and is in pending status
    const existingRestaurants = await db.select()
      .from(restaurantsTable)
      .where(
        and(
          eq(restaurantsTable.id, input.id),
          eq(restaurantsTable.submission_status, 'pending')
        )
      )
      .execute();

    if (existingRestaurants.length === 0) {
      throw new Error('Restaurant not found or not in pending status');
    }

    // Determine the new status based on action
    const newStatus = input.action === 'approve' ? 'approved' : 'rejected';

    // Update the restaurant with review information
    await db.update(restaurantsTable)
      .set({
        submission_status: newStatus,
        reviewed_at: new Date(),
        reviewed_by: input.reviewed_by,
        notes: input.notes || null
      })
      .where(eq(restaurantsTable.id, input.id))
      .execute();

    const actionMessage = input.action === 'approve' ? 'approved' : 'rejected';
    
    return {
      success: true,
      message: `Restaurant submission has been ${actionMessage} by ${input.reviewed_by}.`
    };
  } catch (error) {
    console.error('Restaurant review failed:', error);
    throw error;
  }
}