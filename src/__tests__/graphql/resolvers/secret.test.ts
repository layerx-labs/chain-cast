import { describe, expect, it, beforeEach, mock } from 'bun:test';
import type { Secret } from '@prisma/client';

// Mock the log service
mock.module('@/services/log', () => ({
  default: {
    d: mock(() => {}),
    i: mock(() => {}),
    w: mock(() => {}),
    e: mock(() => {}),
  },
}));

// Import resolvers after mocking
import createSecret from '@/graphql/resolvers/secret/create';
import updateSecret from '@/graphql/resolvers/secret/update';
import deleteSecret from '@/graphql/resolvers/secret/delete';
import { UserInputError } from '@/middleware/errors';

// Mock SecretManager for cast
class MockSecretManager {
  private secrets: Record<string, string> = {};

  addSecret = mock((name: string, value: string) => {
    this.secrets[name] = value;
  });

  deleteSecret = mock((name: string) => {
    delete this.secrets[name];
  });

  getSecret(name: string) {
    return this.secrets[name];
  }
}

// Mock context type
type MockContext = {
  db: {
    secret: {
      findUnique: ReturnType<typeof mock>;
      upsert: ReturnType<typeof mock>;
      update: ReturnType<typeof mock>;
      delete: ReturnType<typeof mock>;
    };
  };
  log: {
    d: ReturnType<typeof mock>;
    i: ReturnType<typeof mock>;
    w: ReturnType<typeof mock>;
    e: ReturnType<typeof mock>;
  };
  manager: {
    getCast: ReturnType<typeof mock>;
  };
};

describe('Secret Resolvers', () => {
  let ctx: MockContext;
  let mockSecretManager: MockSecretManager;
  const sampleSecret: Partial<Secret> = {
    id: 'secret-123',
    name: 'API_KEY',
    value: 'encrypted-value',
    salt: 'base64-salt',
    contractCastId: 'cast-123',
  };

  beforeEach(() => {
    mockSecretManager = new MockSecretManager();

    ctx = {
      db: {
        secret: {
          findUnique: mock(() => Promise.resolve(null)),
          upsert: mock(() => Promise.resolve(sampleSecret)),
          update: mock(() => Promise.resolve(sampleSecret)),
          delete: mock(() => Promise.resolve(sampleSecret)),
        },
      },
      log: {
        d: mock(() => {}),
        i: mock(() => {}),
        w: mock(() => {}),
        e: mock(() => {}),
      },
      manager: {
        getCast: mock(() => ({
          getSecretsManager: () => mockSecretManager,
        })),
      },
    };
  });

  describe('createSecret mutation', () => {
    it('should create a new secret', async () => {
      ctx.db.secret.upsert.mockImplementation(() => Promise.resolve(sampleSecret));

      const args = {
        data: {
          name: 'API_KEY',
          value: 'secret-value',
          contractCastId: 'cast-123',
        },
      };

      const result = await createSecret(null, args, ctx as any, null);

      expect(result).toEqual(sampleSecret);
      expect(ctx.db.secret.upsert).toHaveBeenCalled();
    });

    it('should upsert existing secret with same name', async () => {
      ctx.db.secret.upsert.mockImplementation(() => Promise.resolve(sampleSecret));

      const args = {
        data: {
          name: 'API_KEY',
          value: 'new-value',
          contractCastId: 'cast-123',
        },
      };

      await createSecret(null, args, ctx as any, null);

      expect(ctx.db.secret.upsert).toHaveBeenCalled();
      const upsertCall = ctx.db.secret.upsert.mock.calls[0][0];
      expect(upsertCall.where.name_contractCastId).toEqual({
        contractCastId: 'cast-123',
        name: 'API_KEY',
      });
    });

    it('should add secret to cast secret manager', async () => {
      ctx.db.secret.upsert.mockImplementation(() => Promise.resolve(sampleSecret));

      const args = {
        data: {
          name: 'API_KEY',
          value: 'secret-value',
          contractCastId: 'cast-123',
        },
      };

      await createSecret(null, args, ctx as any, null);

      expect(ctx.manager.getCast).toHaveBeenCalledWith('cast-123');
      expect(mockSecretManager.addSecret).toHaveBeenCalledWith('API_KEY', 'secret-value');
    });

    it('should encrypt the secret value', async () => {
      ctx.db.secret.upsert.mockImplementation(() => Promise.resolve(sampleSecret));

      const args = {
        data: {
          name: 'API_KEY',
          value: 'plain-text-secret',
          contractCastId: 'cast-123',
        },
      };

      await createSecret(null, args, ctx as any, null);

      const upsertCall = ctx.db.secret.upsert.mock.calls[0][0];
      // Value should be encrypted (not plain text)
      expect(upsertCall.create.value).not.toBe('plain-text-secret');
      // Salt should be base64 encoded
      expect(typeof upsertCall.create.salt).toBe('string');
    });
  });

  describe('updateSecret mutation', () => {
    it('should update an existing secret', async () => {
      ctx.db.secret.findUnique.mockImplementation(() => Promise.resolve(sampleSecret));
      ctx.db.secret.update.mockImplementation(() => Promise.resolve(sampleSecret));

      const args = {
        where: { id: 'secret-123' },
        data: {
          name: 'API_KEY',
          value: 'new-secret-value',
          contractCastId: 'cast-123',
        },
      };

      const result = await updateSecret(null, args, ctx as any, null);

      expect(result).toEqual(sampleSecret);
      expect(ctx.db.secret.update).toHaveBeenCalled();
    });

    it('should throw UserInputError when secret not found', async () => {
      ctx.db.secret.findUnique.mockImplementation(() => Promise.resolve(null));

      const args = {
        where: { id: 'non-existent' },
        data: {
          name: 'API_KEY',
          value: 'new-value',
          contractCastId: 'cast-123',
        },
      };

      await expect(updateSecret(null, args, ctx as any, null)).rejects.toThrow(UserInputError);
    });

    it('should update secret in cast secret manager', async () => {
      ctx.db.secret.findUnique.mockImplementation(() => Promise.resolve(sampleSecret));
      ctx.db.secret.update.mockImplementation(() => Promise.resolve(sampleSecret));

      const args = {
        where: { id: 'secret-123' },
        data: {
          name: 'API_KEY',
          value: 'updated-value',
          contractCastId: 'cast-123',
        },
      };

      await updateSecret(null, args, ctx as any, null);

      expect(mockSecretManager.addSecret).toHaveBeenCalledWith('API_KEY', 'updated-value');
    });

    it('should encrypt the new secret value', async () => {
      ctx.db.secret.findUnique.mockImplementation(() => Promise.resolve(sampleSecret));
      ctx.db.secret.update.mockImplementation(() => Promise.resolve(sampleSecret));

      const args = {
        where: { id: 'secret-123' },
        data: {
          name: 'API_KEY',
          value: 'plain-text-new-value',
          contractCastId: 'cast-123',
        },
      };

      await updateSecret(null, args, ctx as any, null);

      const updateCall = ctx.db.secret.update.mock.calls[0][0];
      // Value should be encrypted
      expect(updateCall.data.value).not.toBe('plain-text-new-value');
    });
  });

  describe('deleteSecret mutation', () => {
    it('should delete an existing secret', async () => {
      ctx.db.secret.findUnique.mockImplementation(() => Promise.resolve(sampleSecret));
      ctx.db.secret.delete.mockImplementation(() => Promise.resolve(sampleSecret));

      const args = {
        where: { id: 'secret-123' },
      };

      const result = await deleteSecret(null, args, ctx as any, null);

      expect(result).toEqual(sampleSecret);
      expect(ctx.db.secret.delete).toHaveBeenCalled();
    });

    it('should throw UserInputError when secret not found', async () => {
      ctx.db.secret.findUnique.mockImplementation(() => Promise.resolve(null));

      const args = {
        where: { id: 'non-existent' },
      };

      await expect(deleteSecret(null, args, ctx as any, null)).rejects.toThrow(UserInputError);
    });

    it('should remove secret from cast secret manager', async () => {
      ctx.db.secret.findUnique.mockImplementation(() => Promise.resolve(sampleSecret));
      ctx.db.secret.delete.mockImplementation(() => Promise.resolve(sampleSecret));

      const args = {
        where: { id: 'secret-123' },
      };

      await deleteSecret(null, args, ctx as any, null);

      expect(ctx.manager.getCast).toHaveBeenCalledWith('cast-123');
      expect(mockSecretManager.deleteSecret).toHaveBeenCalledWith('API_KEY');
    });

    it('should log the deletion', async () => {
      ctx.db.secret.findUnique.mockImplementation(() => Promise.resolve(sampleSecret));
      ctx.db.secret.delete.mockImplementation(() => Promise.resolve(sampleSecret));

      const args = {
        where: { id: 'secret-123' },
      };

      await deleteSecret(null, args, ctx as any, null);

      expect(ctx.log.d).toHaveBeenCalled();
    });
  });
});
