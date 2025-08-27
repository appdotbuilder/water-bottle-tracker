import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { adminUsersTable } from '../db/schema';
import { type AdminLoginInput } from '../schema';
import { adminLogin } from '../handlers/admin_login';

describe('adminLogin', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  const validLoginInput: AdminLoginInput = {
    username: 'testadmin',
    password: 'testpassword123'
  };

  const setupTestAdmin = async (username: string, password: string) => {
    // Hash the password before storing
    const hashedPassword = await Bun.password.hash(password);
    
    const result = await db.insert(adminUsersTable)
      .values({
        username,
        password_hash: hashedPassword
      })
      .returning()
      .execute();
    
    return result[0];
  };

  it('should successfully authenticate valid admin credentials', async () => {
    // Setup test admin
    await setupTestAdmin(validLoginInput.username, validLoginInput.password);

    const result = await adminLogin(validLoginInput);

    expect(result.success).toBe(true);
    expect(result.token).toBeDefined();
    expect(result.token).not.toBe('');
    expect(result.message).toEqual('Welcome back, testadmin!');

    // Verify token is a valid base64 string
    expect(() => {
      const decoded = Buffer.from(result.token!, 'base64').toString();
      JSON.parse(decoded);
    }).not.toThrow();
  });

  it('should return token with correct payload structure', async () => {
    // Setup test admin
    const admin = await setupTestAdmin(validLoginInput.username, validLoginInput.password);

    const result = await adminLogin(validLoginInput);

    expect(result.success).toBe(true);
    expect(result.token).toBeDefined();

    // Decode and verify token payload
    const decoded = Buffer.from(result.token!, 'base64').toString();
    const payload = JSON.parse(decoded);

    expect(payload.userId).toEqual(admin.id);
    expect(payload.username).toEqual(validLoginInput.username);
    expect(payload.iat).toBeDefined();
    expect(payload.exp).toBeDefined();
    expect(typeof payload.iat).toBe('number');
    expect(typeof payload.exp).toBe('number');
    expect(payload.exp > payload.iat).toBe(true); // Expiration should be after issued time
  });

  it('should reject invalid username', async () => {
    // Setup test admin but use different username in login
    await setupTestAdmin(validLoginInput.username, validLoginInput.password);

    const invalidInput: AdminLoginInput = {
      username: 'nonexistentuser',
      password: validLoginInput.password
    };

    const result = await adminLogin(invalidInput);

    expect(result.success).toBe(false);
    expect(result.token).toBeUndefined();
    expect(result.message).toEqual('Invalid username or password');
  });

  it('should reject invalid password', async () => {
    // Setup test admin
    await setupTestAdmin(validLoginInput.username, validLoginInput.password);

    const invalidInput: AdminLoginInput = {
      username: validLoginInput.username,
      password: 'wrongpassword'
    };

    const result = await adminLogin(invalidInput);

    expect(result.success).toBe(false);
    expect(result.token).toBeUndefined();
    expect(result.message).toEqual('Invalid username or password');
  });

  it('should handle empty database gracefully', async () => {
    // No admin users in database
    const result = await adminLogin(validLoginInput);

    expect(result.success).toBe(false);
    expect(result.token).toBeUndefined();
    expect(result.message).toEqual('Invalid username or password');
  });

  it('should authenticate multiple different admin users', async () => {
    // Setup multiple admins
    await setupTestAdmin('admin1', 'password1');
    await setupTestAdmin('admin2', 'password2');

    // Test first admin
    const result1 = await adminLogin({
      username: 'admin1',
      password: 'password1'
    });

    expect(result1.success).toBe(true);
    expect(result1.token).toBeDefined();
    expect(result1.message).toEqual('Welcome back, admin1!');

    // Test second admin
    const result2 = await adminLogin({
      username: 'admin2',
      password: 'password2'
    });

    expect(result2.success).toBe(true);
    expect(result2.token).toBeDefined();
    expect(result2.message).toEqual('Welcome back, admin2!');

    // Tokens should be different
    expect(result1.token).not.toEqual(result2.token);
  });

  it('should handle case-sensitive usernames', async () => {
    // Setup admin with specific case
    await setupTestAdmin('TestAdmin', validLoginInput.password);

    // Try to login with different case
    const result = await adminLogin({
      username: 'testadmin', // lowercase
      password: validLoginInput.password
    });

    expect(result.success).toBe(false);
    expect(result.token).toBeUndefined();
    expect(result.message).toEqual('Invalid username or password');
  });

  it('should verify password hashing is working correctly', async () => {
    const plainPassword = 'mySecretPassword123';
    
    // Setup admin
    const admin = await setupTestAdmin('testuser', plainPassword);

    // Verify password was actually hashed (not stored as plaintext)
    expect(admin.password_hash).not.toEqual(plainPassword);
    expect(admin.password_hash.length).toBeGreaterThan(plainPassword.length);

    // Verify login still works with correct password
    const result = await adminLogin({
      username: 'testuser',
      password: plainPassword
    });

    expect(result.success).toBe(true);
  });
});