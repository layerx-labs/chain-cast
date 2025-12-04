import crypto from 'crypto';
import { appConfig } from '../config';

/**
 * Encrypts a secret value for secure storage in the database.
 * Uses AES-256 encryption with the application secret as the key base.
 *
 * @param data - The plaintext secret value to encrypt
 * @param iv - Initialization vector for encryption (must be 16 bytes)
 * @param encoding - Output encoding format (e.g., 'hex', 'base64')
 * @returns The encrypted secret as a string in the specified encoding
 */
export function encryptSecret(data: string, iv: Buffer, encoding: BufferEncoding) {
  return _encryptData(appConfig.secret, data, iv, encoding);
}

/**
 * Decrypts a previously encrypted secret value.
 * Uses AES-256 decryption with the application secret as the key base.
 *
 * @param encodedData - The encrypted secret data
 * @param salt - The initialization vector/salt used during encryption
 * @param inEnc - Input encoding of the encrypted data
 * @param outEnc - Output encoding for the decrypted result
 * @returns The decrypted plaintext secret value
 */
export function decrypSecret(
  encodedData: string,
  salt: string | Buffer,
  inEnc: BufferEncoding,
  outEnc: BufferEncoding
) {
  return _decipherData(appConfig.secret, encodedData, salt, inEnc, outEnc);
}

/**
 * Internal function to perform AES-256 encryption.
 * Creates a SHA-256 hash of the key for proper key length, then encrypts the data.
 *
 * @param key - The encryption key (will be hashed to 256 bits)
 * @param data - Plaintext data to encrypt
 * @param iv - 16-byte initialization vector
 * @param outEnc - Output encoding format
 * @returns Encrypted data in the specified encoding
 */
function _encryptData(key: string, data: string, iv: Buffer, outEnc: BufferEncoding) {
  const algorithm = 'aes256'; // AES-256 encryption
  // Hash the key to ensure proper 256-bit length
  const hashKey = crypto.createHash('sha256').update(String(key)).digest();
  const cipher = crypto.createCipheriv(algorithm, hashKey, iv);
  // Encrypt data and finalize the cipher
  const encoded = cipher.update(data, 'utf8', outEnc) + cipher.final(outEnc);
  return encoded;
}

/**
 * Internal function to perform AES-256 decryption.
 * Creates a SHA-256 hash of the key for proper key length, then decrypts the data.
 *
 * @param key - The decryption key (will be hashed to 256 bits)
 * @param encodedData - Encrypted data to decrypt
 * @param salt - Initialization vector used during encryption
 * @param inEnc - Input encoding of the encrypted data
 * @param outEnc - Output encoding for the decrypted result
 * @returns Decrypted plaintext data
 */
function _decipherData(
  key: string,
  encodedData: string,
  salt: string | Buffer,
  inEnc: BufferEncoding,
  outEnc: BufferEncoding
) {
  const algorithm = 'aes256'; // AES-256 decryption
  // Hash the key to ensure proper 256-bit length
  const hashKey = crypto.createHash('sha256').update(String(key)).digest();
  const decipher = crypto.createDecipheriv(algorithm, hashKey, salt);
  // Decrypt data and finalize the decipher
  const result = decipher.update(encodedData, inEnc, outEnc) + decipher.final(outEnc);
  return result;
}
