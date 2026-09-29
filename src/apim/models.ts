export type ApiProtocol = "REST" | "GRAPHQL" | "WEBSOCKET";
export type ApiLifecycleStatus = "CREATED" | "DESIGNED" | "TESTING" | "PUBLISHED" | "DEPRECATED" | "RETIRED";
export type ApiAuthScheme = "oauth2" | "api-key" | "mtls";
export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface ApiResource {
  method: HttpMethod;
  path: string;
  scopes: string[];
}

export interface ManagedApi {
  id: string;
  tenantId: string;
  name: string;
  version: string;
  context: string;
  upstream: string;
  protocol: ApiProtocol;
  status: ApiLifecycleStatus;
  authentication: ApiAuthScheme[];
  rateLimitPolicy: string;
  scopes: string[];
  resources: ApiResource[];
  documentation?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DeveloperApplication {
  id: string;
  tenantId: string;
  ownerSubject: string;
  name: string;
  callbackUrls: string[];
  createdAt: string;
}

export interface ApiSubscription {
  id: string;
  tenantId: string;
  applicationId: string;
  apiId: string;
  plan: string;
  status: "ACTIVE" | "BLOCKED" | "CANCELLED";
  createdAt: string;
}

export interface ApiCredential {
  id: string;
  tenantId: string;
  applicationId: string;
  type: "api-key";
  keyPrefix: string;
  secretHash: string;
  scopes: string[];
  createdAt: string;
  revokedAt?: string;
}

export interface RateLimitPolicyDefinition {
  name: string;
  quota: number;
  periodSeconds: number;
  burst: {
    requests: number;
    windowSeconds: number;
  };
}
