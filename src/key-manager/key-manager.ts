import type { ApiCredential, DeveloperApplication } from "../apim/models.js";

export interface KeyManager {
  createApplication(application: DeveloperApplication): Promise<void>;
  issueApiKey(input: { tenantId: string; applicationId: string; scopes: string[] }): Promise<{
    credential: Omit<ApiCredential, "secretHash">;
    apiKey: string;
  }>;
  validateApiKey(apiKey: string): Promise<ApiCredential | undefined>;
  revokeCredential(credentialId: string): Promise<void>;
}
