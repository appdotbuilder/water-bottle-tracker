import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { restaurantsTable } from '../db/schema';
import { type ReviewRestaurantInput, type SubmitRestaurantInput } from '../schema';
import { reviewRestaurant } from '../handlers/review_restaurant';
import { eq } from 'drizzle-orm';

// Test data for creating a pending restaurant
const testRestaurantInput: SubmitRestaurantInput = {
  name: 'Test Restaurant',
  address: '123 Test Street',
  latitude: 40.7128,
  longitude: -74.0060,
  water_billing_policy: 'paid'
};

describe('reviewRestaurant', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create a pending restaurant
  const createPendingRestaurant = async () => {
    const result = await db.insert(restaurantsTable)
      .values({
        name: testRestaurantInput.name,
        address: testRestaurantInput.address,
        latitude: testRestaurantInput.latitude,
        longitude: testRestaurantInput.longitude,
        water_billing_policy: testRestaurantInput.water_billing_policy,
        submission_status: 'pending'
      })
      .returning()
      .execute();
    
    return result[0];
  };

  it('should approve a pending restaurant submission', async () => {
    // Create a pending restaurant
    const restaurant = await createPendingRestaurant();

    const reviewInput: ReviewRestaurantInput = {
      id: restaurant.id,
      action: 'approve',
      reviewed_by: 'admin_user',
      notes: 'Looks good!'
    };

    const result = await reviewRestaurant(reviewInput);

    // Check the response
    expect(result.success).toBe(true);
    expect(result.message).toBe('Restaurant submission has been approved by admin_user.');

    // Verify database was updated correctly
    const updatedRestaurants = await db.select()
      .from(restaurantsTable)
      .where(eq(restaurantsTable.id, restaurant.id))
      .execute();

    expect(updatedRestaurants).toHaveLength(1);
    const updatedRestaurant = updatedRestaurants[0];
    expect(updatedRestaurant.submission_status).toBe('approved');
    expect(updatedRestaurant.reviewed_by).toBe('admin_user');
    expect(updatedRestaurant.notes).toBe('Looks good!');
    expect(updatedRestaurant.reviewed_at).toBeInstanceOf(Date);
    expect(updatedRestaurant.reviewed_at).not.toBeNull();
  });

  it('should reject a pending restaurant submission', async () => {
    // Create a pending restaurant
    const restaurant = await createPendingRestaurant();

    const reviewInput: ReviewRestaurantInput = {
      id: restaurant.id,
      action: 'reject',
      reviewed_by: 'admin_user',
      notes: 'Invalid address'
    };

    const result = await reviewRestaurant(reviewInput);

    // Check the response
    expect(result.success).toBe(true);
    expect(result.message).toBe('Restaurant submission has been rejected by admin_user.');

    // Verify database was updated correctly
    const updatedRestaurants = await db.select()
      .from(restaurantsTable)
      .where(eq(restaurantsTable.id, restaurant.id))
      .execute();

    expect(updatedRestaurants).toHaveLength(1);
    const updatedRestaurant = updatedRestaurants[0];
    expect(updatedRestaurant.submission_status).toBe('rejected');
    expect(updatedRestaurant.reviewed_by).toBe('admin_user');
    expect(updatedRestaurant.notes).toBe('Invalid address');
    expect(updatedRestaurant.reviewed_at).toBeInstanceOf(Date);
    expect(updatedRestaurant.reviewed_at).not.toBeNull();
  });

  it('should approve a restaurant without notes', async () => {
    // Create a pending restaurant
    const restaurant = await createPendingRestaurant();

    const reviewInput: ReviewRestaurantInput = {
      id: restaurant.id,
      action: 'approve',
      reviewed_by: 'admin_user'
      // No notes provided
    };

    const result = await reviewRestaurant(reviewInput);

    // Check the response
    expect(result.success).toBe(true);
    expect(result.message).toBe('Restaurant submission has been approved by admin_user.');

    // Verify database was updated correctly
    const updatedRestaurants = await db.select()
      .from(restaurantsTable)
      .where(eq(restaurantsTable.id, restaurant.id))
      .execute();

    expect(updatedRestaurants).toHaveLength(1);
    const updatedRestaurant = updatedRestaurants[0];
    expect(updatedRestaurant.submission_status).toBe('approved');
    expect(updatedRestaurant.reviewed_by).toBe('admin_user');
    expect(updatedRestaurant.notes).toBeNull();
    expect(updatedRestaurant.reviewed_at).toBeInstanceOf(Date);
  });

  it('should throw error when restaurant does not exist', async () => {
    const reviewInput: ReviewRestaurantInput = {
      id: 99999, // Non-existent ID
      action: 'approve',
      reviewed_by: 'admin_user',
      notes: 'This should fail'
    };

    await expect(reviewRestaurant(reviewInput)).rejects.toThrow(/not found or not in pending status/i);
  });

  it('should throw error when restaurant is already approved', async () => {
    // Create a pending restaurant and approve it first
    const restaurant = await createPendingRestaurant();
    
    // Update to approved status directly
    await db.update(restaurantsTable)
      .set({
        submission_status: 'approved',
        reviewed_at: new Date(),
        reviewed_by: 'previous_admin'
      })
      .where(eq(restaurantsTable.id, restaurant.id))
      .execute();

    const reviewInput: ReviewRestaurantInput = {
      id: restaurant.id,
      action: 'approve',
      reviewed_by: 'admin_user',
      notes: 'This should fail'
    };

    await expect(reviewRestaurant(reviewInput)).rejects.toThrow(/not found or not in pending status/i);
  });

  it('should throw error when restaurant is already rejected', async () => {
    // Create a pending restaurant and reject it first
    const restaurant = await createPendingRestaurant();
    
    // Update to rejected status directly
    await db.update(restaurantsTable)
      .set({
        submission_status: 'rejected',
        reviewed_at: new Date(),
        reviewed_by: 'previous_admin'
      })
      .where(eq(restaurantsTable.id, restaurant.id))
      .execute();

    const reviewInput: ReviewRestaurantInput = {
      id: restaurant.id,
      action: 'reject',
      reviewed_by: 'admin_user',
      notes: 'This should fail'
    };

    await expect(reviewRestaurant(reviewInput)).rejects.toThrow(/not found or not in pending status/i);
  });

  it('should preserve original submission timestamp', async () => {
    // Create a pending restaurant
    const restaurant = await createPendingRestaurant();
    const originalSubmittedAt = restaurant.submitted_at;

    const reviewInput: ReviewRestaurantInput = {
      id: restaurant.id,
      action: 'approve',
      reviewed_by: 'admin_user',
      notes: 'Approved'
    };

    await reviewRestaurant(reviewInput);

    // Verify original submitted_at timestamp is preserved
    const updatedRestaurants = await db.select()
      .from(restaurantsTable)
      .where(eq(restaurantsTable.id, restaurant.id))
      .execute();

    expect(updatedRestaurants).toHaveLength(1);
    const updatedRestaurant = updatedRestaurants[0];
    expect(updatedRestaurant.submitted_at).toEqual(originalSubmittedAt);
    expect(updatedRestaurant.reviewed_at).not.toEqual(originalSubmittedAt);
  });
});