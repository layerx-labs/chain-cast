import { SecretManager, SecretMap } from '../types';

export class ChainCastSecretManager implements SecretManager {
  _secrets: SecretMap = {};

  async addSecrets(secrets: SecretMap) {
    this._secrets = secrets;
  }

  addSecret(name: string, value: string) {
    this._secrets[name] = value;
  }

  deleteSecret(name: string) {
    delete this._secrets[name];
  }

  updateSecret(name: string, value: string) {
    this._secrets[name] = value;
  }

  getSecret(name: string) {
    return this._secrets[name];
  }

  getSecrets() {
    return this._secrets;
  }
}
