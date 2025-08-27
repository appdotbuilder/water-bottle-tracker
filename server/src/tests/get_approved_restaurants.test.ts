import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { restaurantsTable } from '../db/schema';
import { getApprovedRestaurants } from '../handlers/get_approved_restaurants';
import { type SubmitRestaurantInput } from '../schema';

// Test restaurant data
const testRestaurant1: SubmitRestaurantInput & { submission_status: 'approved' } = {
  name: 'Test Restaurant 1',
  address: '123 Main St, Test City, TS',
  latitude: 40.7128,
  longitude: -74.0060,
  water_billing_policy: 'free',
  submission_status: 'approved'
};

const testRestaurant2: SubmitRestaurantInput & { submission_status: 'approved' } = {
  name: 'Test Restaurant 2', 
  address: '456 Oak Ave, Test City, TS',
  latitude: 34.0522,
  longitude: -118.2437,
  water_billing_policy: 'paid',
  submission_status: 'approved'
};

const pendingRestaurant: SubmitRestaurantInput & { submission_status: 'pending' } = {
  name: 'Pending Restaurant',
  address: '789 Pine St, Test City, TS', 
  latitude: 41.8781,
  longitude: -87.6298,
  water_billing_policy: 'free',
  submission_status: 'pending'
};

const rejectedRestaurant: SubmitRestaurantInput & { submission_status: 'rejected' } = {
  name: 'Rejected Restaurant',
  address: '321 Elm St, Test City, TS',
  latitude: 29.7604,
  longitude: -95.3698,
  water_billing_policy: 'paid',
  submission_status: 'rejected'
};

describe('getApprovedRestaurants', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no approved restaurants exist', async () => {
    const result = await getApprovedRestaurants();
    expect(result).toEqual([]);
  });

  it('should return only approved restaurants', async () => {
    // Insert test data with different statuses
    await db.insert(restaurantsTable).values([
      testRestaurant1,
      testRestaurant2,
      pendingRestaurant,
      rejectedRestaurant
    ]).execute();

    const result = await getApprovedRestaurants();

    // Should only return the 2 approved restaurants
    expect(result).toHaveLength(2);
    
    // Check that all returned restaurants are approved ones
    const restaurantNames = result.map(r => r.name).sort();
    expect(restaurantNames).toEqual(['Test Restaurant 1', 'Test Restaurant 2']);
  });

  it('should return correct fields for approved restaurants', async () => {
    // Insert approved restaurant
    await db.insert(restaurantsTable).values([testRestaurant1]).execute();

    const result = await getApprovedRestaurants();

    expect(result).toHaveLength(1);
    const restaurant = result[0];

    // Check all required fields are present
    expect(restaurant.id).toBeDefined();
    expect(typeof restaurant.id).toBe('number');
    expect(restaurant.name).toEqual('Test Restaurant 1');
    expect(restaurant.address).toEqual('123 Main St, Test City, TS');
    expect(restaurant.latitude).toEqual(40.7128);
    expect(restaurant.longitude).toEqual(-74.0060);
    expect(restaurant.water_billing_policy).toEqual('free');

    // Check that unnecessary fields are not included
    expect((restaurant as any).submission_status).toBeUndefined();
    expect((restaurant as any).submitted_at).toBeUndefined();
    expect((restaurant as any).reviewed_at).toBeUndefined();
    expect((restaurant as any).reviewed_by).toBeUndefined();
    expect((restaurant as any).notes).toBeUndefined();
  });

  it('should handle both water billing policies correctly', async () => {
    // Insert restaurants with different water billing policies
    await db.insert(restaurantsTable).values([
      testRestaurant1, // free
      testRestaurant2  // paid
    ]).execute();

    const result = await getApprovedRestaurants();

    expect(result).toHaveLength(2);
    
    // Find restaurants by name and check their policies
    const freeRestaurant = result.find(r => r.name === 'Test Restaurant 1');
    const paidRestaurant = result.find(r => r.name === 'Test Restaurant 2');

    expect(freeRestaurant?.water_billing_policy).toEqual('free');
    expect(paidRestaurant?.water_billing_policy).toEqual('paid');
  });

  it('should convert coordinate types correctly', async () => {
    // Insert restaurant with coordinates
    await db.insert(restaurantsTable).values([testRestaurant1]).execute();

    const result = await getApprovedRestaurants();

    expect(result).toHaveLength(1);
    const restaurant = result[0];

    // Ensure coordinates are numbers (not strings from database)
    expect(typeof restaurant.latitude).toBe('number');
    expect(typeof restaurant.longitude).toBe('number');
    expect(restaurant.latitude).toEqual(40.7128);
    expect(restaurant.longitude).toEqual(-74.0060);
  });

  it('should handle multiple approved restaurants with various coordinates', async () => {
    // Create restaurants with different coordinates
    const restaurants = [
      { ...testRestaurant1, latitude: 40.7128, longitude: -74.0060 },
      { ...testRestaurant2, latitude: 34.0522, longitude: -118.2437 },
      { 
        name: 'Test Restaurant 3',
        address: '999 Test St, Test City, TS',
        latitude: 41.8781,
        longitude: -87.6298,
        water_billing_policy: 'free' as const,
        submission_status: 'approved' as const
      }
    ];

    await db.insert(restaurantsTable).values(restaurants).execute();

    const result = await getApprovedRestaurants();

    expect(result).toHaveLength(3);
    
    // Check all coordinates are properly converted
    result.forEach(restaurant => {
      expect(typeof restaurant.latitude).toBe('number');
      expect(typeof restaurant.longitude).toBe('number');
      expect(restaurant.latitude).toBeGreaterThan(-90);
      expect(restaurant.latitude).toBeLessThan(90);
      expect(restaurant.longitude).toBeGreaterThan(-180);
      expect(restaurant.longitude).toBeLessThan(180);
    });
  });
});