import { beforeEach, describe, expect, it } from 'bun:test';
import { ChainCastSecretManager } from '@/services/secret-manager';

describe('ChainCastSecretManager', () => {
  let secretManager: ChainCastSecretManager;

  beforeEach(() => {
    secretManager = new ChainCastSecretManager();
  });

  describe('addSecrets', () => {
    it('should add multiple secrets at once', async () => {
      const secrets = {
        API_KEY: 'secret-api-key',
        WEBHOOK_TOKEN: 'secret-webhook-token',
      };

      await secretManager.addSecrets(secrets);

      expect(secretManager.getSecret('API_KEY')).toBe('secret-api-key');
      expect(secretManager.getSecret('WEBHOOK_TOKEN')).toBe('secret-webhook-token');
    });

    it('should replace existing secrets when adding', async () => {
      secretManager.addSecret('existing', 'old-value');

      await secretManager.addSecrets({
        new_secret: 'new-value',
      });

      // Old secrets are replaced
      expect(secretManager.getSecret('existing')).toBeUndefined();
      expect(secretManager.getSecret('new_secret')).toBe('new-value');
    });

    it('should handle empty secrets map', async () => {
      await secretManager.addSecrets({});

      expect(secretManager.getSecrets()).toEqual({});
    });
  });

  describe('addSecret', () => {
    it('should add a single secret', () => {
      secretManager.addSecret('API_KEY', 'my-secret-key');

      expect(secretManager.getSecret('API_KEY')).toBe('my-secret-key');
    });

    it('should overwrite existing secret with same name', () => {
      secretManager.addSecret('API_KEY', 'old-key');
      secretManager.addSecret('API_KEY', 'new-key');

      expect(secretManager.getSecret('API_KEY')).toBe('new-key');
    });

    it('should handle special characters in values', () => {
      secretManager.addSecret('PASSWORD', 'p@ssw0rd!#$%^&*()');

      expect(secretManager.getSecret('PASSWORD')).toBe('p@ssw0rd!#$%^&*()');
    });
  });

  describe('deleteSecret', () => {
    it('should delete an existing secret', () => {
      secretManager.addSecret('API_KEY', 'to-be-deleted');
      secretManager.deleteSecret('API_KEY');

      expect(secretManager.getSecret('API_KEY')).toBeUndefined();
    });

    it('should not throw when deleting non-existent secret', () => {
      expect(() => {
        secretManager.deleteSecret('non-existent');
      }).not.toThrow();
    });

    it('should only delete specified secret', () => {
      secretManager.addSecret('key1', 'value1');
      secretManager.addSecret('key2', 'value2');

      secretManager.deleteSecret('key1');

      expect(secretManager.getSecret('key1')).toBeUndefined();
      expect(secretManager.getSecret('key2')).toBe('value2');
    });
  });

  describe('updateSecret', () => {
    it('should update an existing secret', () => {
      secretManager.addSecret('API_KEY', 'old-value');
      secretManager.updateSecret('API_KEY', 'new-value');

      expect(secretManager.getSecret('API_KEY')).toBe('new-value');
    });

    it('should create a secret if it does not exist', () => {
      secretManager.updateSecret('NEW_KEY', 'new-value');

      expect(secretManager.getSecret('NEW_KEY')).toBe('new-value');
    });
  });

  describe('getSecret', () => {
    it('should return the secret value', () => {
      secretManager.addSecret('API_KEY', 'test-value');

      expect(secretManager.getSecret('API_KEY')).toBe('test-value');
    });

    it('should return undefined for non-existent secret', () => {
      expect(secretManager.getSecret('non-existent')).toBeUndefined();
    });
  });

  describe('getSecrets', () => {
    it('should return all secrets', () => {
      secretManager.addSecret('key1', 'value1');
      secretManager.addSecret('key2', 'value2');
      secretManager.addSecret('key3', 'value3');

      const secrets = secretManager.getSecrets();

      expect(secrets).toEqual({
        key1: 'value1',
        key2: 'value2',
        key3: 'value3',
      });
    });

    it('should return empty object when no secrets', () => {
      expect(secretManager.getSecrets()).toEqual({});
    });
  });

  describe('integration scenarios', () => {
    it('should support typical cast secrets workflow', () => {
      // Cast is created with initial secrets
      secretManager.addSecret('WEBHOOK_URL', 'https://api.example.com/webhook');
      secretManager.addSecret('AUTH_TOKEN', 'Bearer abc123');

      // Secrets are used by instructions
      expect(secretManager.getSecret('WEBHOOK_URL')).toBe('https://api.example.com/webhook');
      expect(secretManager.getSecret('AUTH_TOKEN')).toBe('Bearer abc123');

      // Secret is rotated
      secretManager.updateSecret('AUTH_TOKEN', 'Bearer xyz789');
      expect(secretManager.getSecret('AUTH_TOKEN')).toBe('Bearer xyz789');

      // Old secret is removed
      secretManager.deleteSecret('WEBHOOK_URL');
      expect(secretManager.getSecret('WEBHOOK_URL')).toBeUndefined();
    });
  });
});
