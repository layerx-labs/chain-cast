import { SecretManager, SecretMap } from '../types';

/**
 * In-memory implementation of the SecretManager interface for ChainCast.
 * Provides basic CRUD operations for managing secrets used by contract casts.
 * Note: This is a simple implementation that stores secrets in memory.
 * For production use, consider implementing persistent storage or integration
 * with external secret management services like AWS Secrets Manager or Vault.
 */
export class ChainCastSecretManager implements SecretManager {
  /** Internal storage for secrets as a key-value map */
  _secrets: SecretMap = {};

  /**
   * Adds multiple secrets to the store, replacing any existing secrets.
   * @param secrets - Map of secret names to their values
   */
  async addSecrets(secrets: SecretMap) {
    this._secrets = secrets;
  }

  /**
   * Adds a single secret to the store.
   * @param name - The name/key of the secret
   * @param value - The secret value
   */
  addSecret(name: string, value: string) {
    this._secrets[name] = value;
  }

  /**
   * Removes a secret from the store.
   * @param name - The name of the secret to delete
   */
  deleteSecret(name: string) {
    delete this._secrets[name];
  }

  /**
   * Updates the value of an existing secret or creates it if it doesn't exist.
   * @param name - The name of the secret to update
   * @param value - The new value for the secret
   */
  updateSecret(name: string, value: string) {
    this._secrets[name] = value;
  }

  /**
   * Retrieves a single secret value by name.
   * @param name - The name of the secret to retrieve
   * @returns The secret value or undefined if not found
   */
  getSecret(name: string) {
    return this._secrets[name];
  }

  /**
   * Retrieves all secrets as a map.
   * @returns Complete map of all stored secrets
   */
  getSecrets() {
    return this._secrets;
  }
}
