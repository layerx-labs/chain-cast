import { PrismaClient } from '@prisma/client';
import { decrypSecret } from './crypto';
import { SecretMap } from '../types';

/**
 * Loads and decrypts all secrets associated with a specific contract cast from the database.
 * Retrieves encrypted secrets from the database, decrypts them using the stored salt/initialization vector,
 * and returns them as a map of secret names to decrypted values.
 *
 * @param db - Prisma database client instance
 * @param castId - Unique identifier of the contract cast whose secrets to load
 * @returns Promise resolving to a map of secret names to their decrypted values
 */
export async function loadSecresFromDb(db: PrismaClient, castId: string): Promise<SecretMap> {
  const secrets: SecretMap = {};

  // Query database for all secrets associated with the contract cast
  const dbSecrets = await db.secret.findMany({
    where: {
      contractCastId: castId, // Filter by contract cast ID
    },
    select: {
      name: true, // Secret name/key
      salt: true, // Base64-encoded initialization vector used for encryption
      value: true, // Base64-encoded encrypted secret value
    },
  });

  // Decrypt each secret and add to the result map
  dbSecrets.forEach((dbSecret) => {
    // Convert base64 salt back to buffer for decryption
    const initVector = Buffer.from(dbSecret.salt, 'base64');
    // Decrypt the secret value from base64 to UTF-8 plaintext
    const secret = decrypSecret(dbSecret.value, initVector, 'base64', 'utf-8');
    // Store decrypted secret in result map
    secrets[dbSecret.name] = secret;
  });

  return secrets;
}
