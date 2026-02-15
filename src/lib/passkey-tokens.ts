import { randomBytes } from "crypto";

// Temporary one-time tokens for passkey authentication
// After WebAuthn verification succeeds, we issue a short-lived token
// that the Credentials provider can exchange for a session
const tokenStore = new Map<
  string,
  { userId: string; expiresAt: number }
>();

export function createPasskeyToken(userId: string): string {
  const token = randomBytes(32).toString("hex");
  tokenStore.set(token, {
    userId,
    expiresAt: Date.now() + 60 * 1000, // 1 minute expiry
  });

  // Clean up expired tokens
  for (const [key, value] of tokenStore.entries()) {
    if (value.expiresAt < Date.now()) {
      tokenStore.delete(key);
    }
  }

  return token;
}

export function consumePasskeyToken(token: string): string | null {
  const stored = tokenStore.get(token);
  if (!stored || stored.expiresAt < Date.now()) {
    tokenStore.delete(token);
    return null;
  }
  tokenStore.delete(token);
  return stored.userId;
}
