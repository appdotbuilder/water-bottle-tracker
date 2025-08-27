import { db } from '../db';
import { adminUsersTable } from '../db/schema';
import { type AdminLoginInput } from '../schema';
import { eq } from 'drizzle-orm';

export async function adminLogin(input: AdminLoginInput): Promise<{ success: boolean; token?: string; message: string }> {
  try {
    // Query admin user by username
    const users = await db.select()
      .from(adminUsersTable)
      .where(eq(adminUsersTable.username, input.username))
      .execute();

    if (users.length === 0) {
      return {
        success: false,
        message: 'Invalid username or password'
      };
    }

    const user = users[0];

    // Verify password using Bun's built-in password hashing
    const isPasswordValid = await Bun.password.verify(input.password, user.password_hash);

    if (!isPasswordValid) {
      return {
        success: false,
        message: 'Invalid username or password'
      };
    }

    // Generate JWT token
    const payload = {
      userId: user.id,
      username: user.username,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours expiration
    };

    // For production, use a proper JWT library and secret from environment
    // For now, using a simple base64 encoded payload as a token
    const token = Buffer.from(JSON.stringify(payload)).toString('base64');

    return {
      success: true,
      token,
      message: `Welcome back, ${user.username}!`
    };
  } catch (error) {
    console.error('Admin login failed:', error);
    return {
      success: false,
      message: 'Authentication failed. Please try again.'
    };
  }
}