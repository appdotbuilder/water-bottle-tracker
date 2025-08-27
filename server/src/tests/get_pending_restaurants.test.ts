import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { restaurantsTable } from '../db/schema';
import { getPendingRestaurants } from '../handlers/get_pending_restaurants';
import { eq } from 'drizzle-orm';

describe('getPendingRestaurants', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no pending restaurants exist', async () => {
    const result = await getPendingRestaurants();
    expect(result).toEqual([]);
  });

  it('should return only restaurants with pending status', async () => {
    // Create test restaurants with different statuses
    await db.insert(restaurantsTable).values([
      {
        name: 'Pending Restaurant 1',
        address: '123 Main St, City, State',
        latitude: 40.7128,
        longitude: -74.0060,
        water_billing_policy: 'free',
        submission_status: 'pending'
      },
      {
        name: 'Approved Restaurant',
        address: '456 Oak St, City, State',
        latitude: 40.7589,
        longitude: -73.9851,
        water_billing_policy: 'paid',
        submission_status: 'approved',
        reviewed_at: new Date(),
        reviewed_by: 'admin1'
      },
      {
        name: 'Pending Restaurant 2',
        address: '789 Pine St, City, State',
        latitude: 40.7505,
        longitude: -73.9934,
        water_billing_policy: 'paid',
        submission_status: 'pending'
      },
      {
        name: 'Rejected Restaurant',
        address: '321 Elm St, City, State',
        latitude: 40.7282,
        longitude: -73.7949,
        water_billing_policy: 'free',
        submission_status: 'rejected',
        reviewed_at: new Date(),
        reviewed_by: 'admin2',
        notes: 'Duplicate entry'
      }
    ]).execute();

    const result = await getPendingRestaurants();

    // Should only return the 2 pending restaurants
    expect(result).toHaveLength(2);
    
    // Verify all returned restaurants have pending status
    result.forEach(restaurant => {
      expect(restaurant.submission_status).toEqual('pending');
    });

    // Verify specific restaurant data
    const pendingNames = result.map(r => r.name).sort();
    expect(pendingNames).toEqual(['Pending Restaurant 1', 'Pending Restaurant 2']);
  });

  it('should include all required fields for pending restaurants', async () => {
    // Create a pending restaurant with notes
    await db.insert(restaurantsTable).values({
      name: 'Test Restaurant',
      address: '123 Test St, Test City, TS',
      latitude: 35.6762,
      longitude: 139.6503,
      water_billing_policy: 'free',
      submission_status: 'pending',
      notes: 'Initial submission notes'
    }).execute();

    const result = await getPendingRestaurants();

    expect(result).toHaveLength(1);
    
    const restaurant = result[0];
    
    // Verify all required fields are present
    expect(restaurant.id).toBeDefined();
    expect(typeof restaurant.id).toBe('number');
    expect(restaurant.name).toEqual('Test Restaurant');
    expect(restaurant.address).toEqual('123 Test St, Test City, TS');
    expect(restaurant.latitude).toEqual(35.6762);
    expect(typeof restaurant.latitude).toBe('number');
    expect(restaurant.longitude).toEqual(139.6503);
    expect(typeof restaurant.longitude).toBe('number');
    expect(restaurant.water_billing_policy).toEqual('free');
    expect(restaurant.submission_status).toEqual('pending');
    expect(restaurant.submitted_at).toBeInstanceOf(Date);
    expect(restaurant.notes).toEqual('Initial submission notes');
    
    // Verify omitted fields are not present (reviewed_at, reviewed_by)
    expect(restaurant).not.toHaveProperty('reviewed_at');
    expect(restaurant).not.toHaveProperty('reviewed_by');
  });

  it('should handle restaurants with null notes', async () => {
    // Create a pending restaurant without notes
    await db.insert(restaurantsTable).values({
      name: 'Restaurant Without Notes',
      address: '456 No Notes Ave, City, State',
      latitude: 41.8781,
      longitude: -87.6298,
      water_billing_policy: 'paid',
      submission_status: 'pending'
    }).execute();

    const result = await getPendingRestaurants();

    expect(result).toHaveLength(1);
    expect(result[0].notes).toBeNull();
  });

  it('should save and retrieve pending restaurants correctly from database', async () => {
    const testData = {
      name: 'Database Test Restaurant',
      address: '999 Database St, Test City, TC',
      latitude: 33.4484,
      longitude: -112.0740,
      water_billing_policy: 'free' as const,
      submission_status: 'pending' as const
    };

    // Insert test restaurant
    const insertResult = await db.insert(restaurantsTable)
      .values(testData)
      .returning()
      .execute();

    // Fetch via handler
    const handlerResult = await getPendingRestaurants();

    // Verify handler returns the inserted restaurant
    expect(handlerResult).toHaveLength(1);
    expect(handlerResult[0].id).toEqual(insertResult[0].id);
    expect(handlerResult[0].name).toEqual(testData.name);

    // Verify direct database query matches handler result
    const dbResult = await db.select()
      .from(restaurantsTable)
      .where(eq(restaurantsTable.submission_status, 'pending'))
      .execute();

    expect(dbResult).toHaveLength(1);
    expect(dbResult[0].name).toEqual(handlerResult[0].name);
    expect(dbResult[0].submission_status).toEqual('pending');
  });
});