import crypto from 'crypto';
import { appConfig } from '../config';

/**
 * Encrypt a Secret to be saved on Storage
 * @param data
 * @param iv
 * @param encoding
 * @returns
 */
export function encryptSecret(data: string, iv: Buffer, encoding: BufferEncoding) {
  return _encryptData(appConfig.secret, data, iv, encoding);
}

/**
 * Decrypt a Secret to be saved on Storage
 * @param encodedData
 * @param salt
 * @param inEnc
 * @param outEnc
 * @returns
 */
export function decrypSecret(
  encodedData: string,
  salt: string | Buffer,
  inEnc: BufferEncoding,
  outEnc: BufferEncoding
) {
  return _decipherData(appConfig.secret, encodedData, salt, inEnc, outEnc);
}

function _encryptData(key: string, data: string, iv: Buffer, outEnc: BufferEncoding) {
  const algorithm = 'aes256';
  const hashKey = crypto.createHash('sha256').update(String(key)).digest();
  const cipher = crypto.createCipheriv(algorithm, hashKey, iv);
  const encoded = cipher.update(data, 'utf8', outEnc) + cipher.final(outEnc);
  return encoded;
}

function _decipherData(
  key: string,
  encodedData: string,
  salt: string | Buffer,
  inEnc: BufferEncoding,
  outEnc: BufferEncoding
) {
  const algorithm = 'aes256';
  const hashKey = crypto.createHash('sha256').update(String(key)).digest();
  const decipher = crypto.createDecipheriv(algorithm, hashKey, salt);
  return decipher.update(encodedData, inEnc, outEnc) + decipher.final(outEnc);
}
