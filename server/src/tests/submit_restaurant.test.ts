import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { restaurantsTable } from '../db/schema';
import { type SubmitRestaurantInput } from '../schema';
import { submitRestaurant } from '../handlers/submit_restaurant';
import { eq, and } from 'drizzle-orm';

// Test input with all required fields
const testInput: SubmitRestaurantInput = {
  name: 'Test Pizza Palace',
  address: '123 Main Street, Anytown, ST 12345',
  latitude: 40.7128,
  longitude: -74.0060,
  water_billing_policy: 'free'
};

describe('submitRestaurant', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should submit a restaurant successfully', async () => {
    const result = await submitRestaurant(testInput);

    expect(result.success).toBe(true);
    expect(result.message).toEqual(`Restaurant "${testInput.name}" has been submitted for review. Thank you for your contribution!`);
  });

  it('should save restaurant to database with correct data', async () => {
    await submitRestaurant(testInput);

    // Query the database to verify the restaurant was saved
    const restaurants = await db.select()
      .from(restaurantsTable)
      .where(eq(restaurantsTable.name, testInput.name))
      .execute();

    expect(restaurants).toHaveLength(1);
    const restaurant = restaurants[0];

    expect(restaurant.name).toEqual(testInput.name);
    expect(restaurant.address).toEqual(testInput.address);
    expect(restaurant.latitude).toEqual(testInput.latitude);
    expect(restaurant.longitude).toEqual(testInput.longitude);
    expect(restaurant.water_billing_policy).toEqual(testInput.water_billing_policy);
    expect(restaurant.submission_status).toEqual('pending');
    expect(restaurant.submitted_at).toBeInstanceOf(Date);
    expect(restaurant.reviewed_at).toBeNull();
    expect(restaurant.reviewed_by).toBeNull();
    expect(restaurant.notes).toBeNull();
    expect(restaurant.id).toBeDefined();
  });

  it('should reject duplicate restaurant by name and address', async () => {
    // Submit first restaurant
    await submitRestaurant(testInput);

    // Try to submit the same restaurant again
    await expect(submitRestaurant(testInput)).rejects.toThrow(/already been submitted/i);
  });

  it('should allow same name with different address', async () => {
    // Submit first restaurant
    await submitRestaurant(testInput);

    // Submit restaurant with same name but different address
    const differentAddressInput: SubmitRestaurantInput = {
      ...testInput,
      address: '456 Oak Avenue, Different City, ST 54321'
    };

    const result = await submitRestaurant(differentAddressInput);

    expect(result.success).toBe(true);

    // Verify both restaurants exist in database
    const restaurants = await db.select()
      .from(restaurantsTable)
      .where(eq(restaurantsTable.name, testInput.name))
      .execute();

    expect(restaurants).toHaveLength(2);
  });

  it('should allow same address with different name', async () => {
    // Submit first restaurant
    await submitRestaurant(testInput);

    // Submit restaurant with different name but same address
    const differentNameInput: SubmitRestaurantInput = {
      ...testInput,
      name: 'Different Restaurant Name'
    };

    const result = await submitRestaurant(differentNameInput);

    expect(result.success).toBe(true);

    // Verify both restaurants exist in database
    const restaurants = await db.select()
      .from(restaurantsTable)
      .where(eq(restaurantsTable.address, testInput.address))
      .execute();

    expect(restaurants).toHaveLength(2);
  });

  it('should handle paid water billing policy', async () => {
    const paidWaterInput: SubmitRestaurantInput = {
      ...testInput,
      name: 'Paid Water Restaurant',
      water_billing_policy: 'paid'
    };

    const result = await submitRestaurant(paidWaterInput);

    expect(result.success).toBe(true);

    // Verify the water billing policy was saved correctly
    const restaurants = await db.select()
      .from(restaurantsTable)
      .where(eq(restaurantsTable.name, paidWaterInput.name))
      .execute();

    expect(restaurants[0].water_billing_policy).toEqual('paid');
  });

  it('should handle edge coordinate values', async () => {
    const edgeCoordinatesInput: SubmitRestaurantInput = {
      ...testInput,
      name: 'Edge Coordinates Restaurant',
      latitude: -89.9999, // Near south pole
      longitude: 179.9999 // Near international date line
    };

    const result = await submitRestaurant(edgeCoordinatesInput);

    expect(result.success).toBe(true);

    // Verify coordinates were saved correctly
    const restaurants = await db.select()
      .from(restaurantsTable)
      .where(eq(restaurantsTable.name, edgeCoordinatesInput.name))
      .execute();

    expect(restaurants[0].latitude).toEqual(-89.9999);
    expect(restaurants[0].longitude).toEqual(179.9999);
  });

  it('should set submission timestamp automatically', async () => {
    const beforeSubmission = new Date();
    
    await submitRestaurant(testInput);
    
    const afterSubmission = new Date();

    const restaurants = await db.select()
      .from(restaurantsTable)
      .where(eq(restaurantsTable.name, testInput.name))
      .execute();

    const submittedAt = restaurants[0].submitted_at;
    expect(submittedAt).toBeInstanceOf(Date);
    expect(submittedAt.getTime()).toBeGreaterThanOrEqual(beforeSubmission.getTime());
    expect(submittedAt.getTime()).toBeLessThanOrEqual(afterSubmission.getTime());
  });

  it('should verify duplicate check is case sensitive', async () => {
    // Submit first restaurant
    await submitRestaurant(testInput);

    // Try to submit with different case - should be allowed
    const differentCaseInput: SubmitRestaurantInput = {
      ...testInput,
      name: testInput.name.toUpperCase()
    };

    const result = await submitRestaurant(differentCaseInput);

    expect(result.success).toBe(true);

    // Verify both restaurants exist
    const allRestaurants = await db.select()
      .from(restaurantsTable)
      .execute();

    expect(allRestaurants).toHaveLength(2);
  });
});