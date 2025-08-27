import { db } from '../db';
import { adminUsersTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type AdminLoginInput, type AdminLoginResponse } from '../schema';

// Password verification using Bun's built-in password verification
const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return await Bun.password.verify(password, hash);
};

// Generate JWT-like token (simple base64 encoded payload)
const generateToken = (userId: number, username: string): string => {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    userId,
    username,
    iat: now,
    exp: now + (24 * 60 * 60) // 24 hours expiration
  };
  return Buffer.from(JSON.stringify(payload)).toString('base64');
};

export const adminLogin = async (input: AdminLoginInput): Promise<AdminLoginResponse> => {
  try {
    // Find admin user by username
    const adminUsers = await db
      .select()
      .from(adminUsersTable)
      .where(eq(adminUsersTable.username, input.username))
      .execute();

    if (adminUsers.length === 0) {
      return {
        success: false,
        message: 'Invalid username or password'
      };
    }

    const adminUser = adminUsers[0];

    // Verify password
    const isValidPassword = await verifyPassword(input.password, adminUser.password_hash);

    if (!isValidPassword) {
      return {
        success: false,
        message: 'Invalid username or password'
      };
    }

    // Login successful - generate token
    const token = generateToken(adminUser.id, adminUser.username);
    
    return {
      success: true,
      message: `Welcome back, ${adminUser.username}!`,
      token
    };
  } catch (error) {
    console.error('Admin login failed:', error);
    throw error;
  }
};