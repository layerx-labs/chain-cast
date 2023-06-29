import { PrismaClient } from '@prisma/client';
import { decrypSecret } from './crypto';
import { SecretMap } from '../types';

export async function loadSecresFromDb(db: PrismaClient, castId: string): Promise<SecretMap> {
  const secrets: SecretMap = {};
  const dbSecrets = await db.secret.findMany({
    where: {
      contractCastId: castId,
    },
    select: {
      name: true,
      salt: true,
      value: true,
    },
  });
  dbSecrets.forEach((dbSecret) => {
    const initVector = Buffer.from(dbSecret.salt, 'base64');
    const secret = decrypSecret(dbSecret.value, initVector, 'base64', 'utf-8');
    secrets[dbSecret.name] = secret;
  });
  return secrets;
}
