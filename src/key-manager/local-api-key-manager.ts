import { apimStore } from "../apim/store.js";
import type { DeveloperApplication } from "../apim/models.js";
import type { KeyManager } from "./key-manager.js";

export class LocalApiKeyManager implements KeyManager {
  async createApplication(_application: DeveloperApplication) {
    return;
  }

  async issueApiKey(input: { tenantId: string; applicationId: string; scopes: string[] }) {
    const result = apimStore.issueApiKey(input.tenantId, input.applicationId, input.scopes);
    const { secretHash: _secretHash, ...credential } = result.credential;
    return { credential, apiKey: result.apiKey };
  }

  async validateApiKey(apiKey: string) {
    return apimStore.validateApiKey(apiKey);
  }

  async revokeCredential(_credentialId: string) {
    return;
  }
}

export const keyManager = new LocalApiKeyManager();
