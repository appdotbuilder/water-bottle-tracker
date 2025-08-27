import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { restaurantsTable } from '../db/schema';
import { type SubmitRestaurantInput } from '../schema';
import { getRestaurantById } from '../handlers/get_restaurant_by_id';
import { eq } from 'drizzle-orm';

// Test data for restaurant creation
const testRestaurantInput = {
  name: 'Test Restaurant',
  address: '123 Main St, Test City, TC 12345',
  latitude: 40.7128,
  longitude: -74.0060,
  water_billing_policy: 'free' as const
};

const testRestaurantInput2 = {
  name: 'Second Test Restaurant',
  address: '456 Oak Ave, Test City, TC 12346',
  latitude: 41.8781,
  longitude: -87.6298,
  water_billing_policy: 'paid' as const
};

describe('getRestaurantById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return restaurant by ID with correct data types', async () => {
    // Create a test restaurant
    const insertResult = await db.insert(restaurantsTable)
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

    const createdRestaurant = insertResult[0];

    // Test the handler
    const result = await getRestaurantById(createdRestaurant.id);

    // Verify the result
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdRestaurant.id);
    expect(result!.name).toEqual('Test Restaurant');
    expect(result!.address).toEqual('123 Main St, Test City, TC 12345');
    expect(result!.latitude).toEqual(40.7128);
    expect(result!.longitude).toEqual(-74.0060);
    expect(typeof result!.latitude).toBe('number');
    expect(typeof result!.longitude).toBe('number');
    expect(result!.water_billing_policy).toEqual('free');
    expect(result!.submission_status).toEqual('pending');
    expect(result!.submitted_at).toBeInstanceOf(Date);
    expect(result!.reviewed_at).toBeNull();
    expect(result!.reviewed_by).toBeNull();
    expect(result!.notes).toBeNull();
  });

  it('should return null for non-existent restaurant ID', async () => {
    const result = await getRestaurantById(999);
    
    expect(result).toBeNull();
  });

  it('should return correct restaurant when multiple exist', async () => {
    // Create two test restaurants
    const insertResult1 = await db.insert(restaurantsTable)
      .values({
        name: testRestaurantInput.name,
        address: testRestaurantInput.address,
        latitude: testRestaurantInput.latitude,
        longitude: testRestaurantInput.longitude,
        water_billing_policy: testRestaurantInput.water_billing_policy,
        submission_status: 'approved'
      })
      .returning()
      .execute();

    const insertResult2 = await db.insert(restaurantsTable)
      .values({
        name: testRestaurantInput2.name,
        address: testRestaurantInput2.address,
        latitude: testRestaurantInput2.latitude,
        longitude: testRestaurantInput2.longitude,
        water_billing_policy: testRestaurantInput2.water_billing_policy,
        submission_status: 'rejected'
      })
      .returning()
      .execute();

    const restaurant1 = insertResult1[0];
    const restaurant2 = insertResult2[0];

    // Test fetching first restaurant
    const result1 = await getRestaurantById(restaurant1.id);
    expect(result1).not.toBeNull();
    expect(result1!.name).toEqual('Test Restaurant');
    expect(result1!.submission_status).toEqual('approved');
    expect(result1!.water_billing_policy).toEqual('free');

    // Test fetching second restaurant
    const result2 = await getRestaurantById(restaurant2.id);
    expect(result2).not.toBeNull();
    expect(result2!.name).toEqual('Second Test Restaurant');
    expect(result2!.submission_status).toEqual('rejected');
    expect(result2!.water_billing_policy).toEqual('paid');
  });

  it('should return restaurant with review metadata when reviewed', async () => {
    // Create a restaurant and then update it with review data
    const insertResult = await db.insert(restaurantsTable)
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

    const createdRestaurant = insertResult[0];
    const reviewDate = new Date();
    
    // Update with review information
    await db.update(restaurantsTable)
      .set({
        submission_status: 'approved',
        reviewed_at: reviewDate,
        reviewed_by: 'admin_user',
        notes: 'Verified during site visit'
      })
      .where(eq(restaurantsTable.id, createdRestaurant.id))
      .execute();

    // Test the handler
    const result = await getRestaurantById(createdRestaurant.id);

    // Verify review metadata is included
    expect(result).not.toBeNull();
    expect(result!.submission_status).toEqual('approved');
    expect(result!.reviewed_at).toBeInstanceOf(Date);
    expect(result!.reviewed_by).toEqual('admin_user');
    expect(result!.notes).toEqual('Verified during site visit');
  });

  it('should handle edge case coordinates correctly', async () => {
    // Test with extreme but valid coordinates
    const edgeCaseRestaurant = {
      name: 'Edge Case Restaurant',
      address: 'Extreme Location',
      latitude: -89.9999, // Near South Pole
      longitude: 179.9999, // Near International Date Line
      water_billing_policy: 'paid' as const
    };

    const insertResult = await db.insert(restaurantsTable)
      .values({
        name: edgeCaseRestaurant.name,
        address: edgeCaseRestaurant.address,
        latitude: edgeCaseRestaurant.latitude,
        longitude: edgeCaseRestaurant.longitude,
        water_billing_policy: edgeCaseRestaurant.water_billing_policy,
        submission_status: 'pending'
      })
      .returning()
      .execute();

    const createdRestaurant = insertResult[0];

    // Test the handler
    const result = await getRestaurantById(createdRestaurant.id);

    // Verify coordinates are preserved accurately
    expect(result).not.toBeNull();
    expect(result!.latitude).toBeCloseTo(-89.9999, 4);
    expect(result!.longitude).toBeCloseTo(179.9999, 4);
    expect(typeof result!.latitude).toBe('number');
    expect(typeof result!.longitude).toBe('number');
  });
});