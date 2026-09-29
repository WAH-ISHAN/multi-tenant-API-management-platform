import { createHash, randomBytes, randomUUID } from "node:crypto";
import type {
  ApiCredential,
  ApiSubscription,
  DeveloperApplication,
  ManagedApi,
  RateLimitPolicyDefinition
} from "./models.js";

const now = () => new Date().toISOString();

export class ApimStore {
  private apis = new Map<string, ManagedApi>();
  private applications = new Map<string, DeveloperApplication>();
  private subscriptions = new Map<string, ApiSubscription>();
  private credentials = new Map<string, ApiCredential>();
  private policies = new Map<string, RateLimitPolicyDefinition>([
    ["bronze", { name: "bronze", quota: 1000, periodSeconds: 3600, burst: { requests: 20, windowSeconds: 10 } }],
    ["silver", { name: "silver", quota: 5000, periodSeconds: 3600, burst: { requests: 60, windowSeconds: 10 } }],
    ["gold", { name: "gold", quota: 10000, periodSeconds: 3600, burst: { requests: 100, windowSeconds: 10 } }]
  ]);

  constructor() {
    this.seed();
  }

  listApis(tenantId?: string, onlyPublished = false) {
    return [...this.apis.values()].filter(
      (api) => (!tenantId || api.tenantId === tenantId) && (!onlyPublished || api.status === "PUBLISHED")
    );
  }

  getApi(id: string) {
    return this.apis.get(id);
  }

  findPublishedApiByContext(tenantId: string, context: string) {
    return [...this.apis.values()].find(
      (api) => api.tenantId === tenantId && api.context.replace(/^\//, "") === context && api.status === "PUBLISHED"
    );
  }

  upsertApi(input: Omit<ManagedApi, "createdAt" | "updatedAt">) {
    const existing = this.apis.get(input.id);
    const api: ManagedApi = {
      ...input,
      createdAt: existing?.createdAt ?? now(),
      updatedAt: now()
    };
    this.apis.set(api.id, api);
    return api;
  }

  transitionApi(id: string, status: ManagedApi["status"]) {
    const api = this.apis.get(id);
    if (!api) return undefined;
    const updated = { ...api, status, updatedAt: now() };
    this.apis.set(id, updated);
    return updated;
  }

  deleteApi(id: string) {
    return this.apis.delete(id);
  }

  createApplication(input: Pick<DeveloperApplication, "tenantId" | "ownerSubject" | "name" | "callbackUrls">) {
    const app: DeveloperApplication = {
      id: `app-${randomUUID()}`,
      createdAt: now(),
      ...input
    };
    this.applications.set(app.id, app);
    return app;
  }

  listApplications(tenantId: string, ownerSubject?: string) {
    return [...this.applications.values()].filter(
      (app) => app.tenantId === tenantId && (!ownerSubject || app.ownerSubject === ownerSubject)
    );
  }

  getApplication(id: string) {
    return this.applications.get(id);
  }

  createSubscription(input: Pick<ApiSubscription, "tenantId" | "applicationId" | "apiId" | "plan">) {
    const subscription: ApiSubscription = {
      id: `sub-${randomUUID()}`,
      status: "ACTIVE",
      createdAt: now(),
      ...input
    };
    this.subscriptions.set(subscription.id, subscription);
    return subscription;
  }

  findSubscription(tenantId: string, applicationId: string, apiId: string) {
    return [...this.subscriptions.values()].find(
      (sub) =>
        sub.tenantId === tenantId &&
        sub.applicationId === applicationId &&
        sub.apiId === apiId &&
        sub.status === "ACTIVE"
    );
  }

  listSubscriptions(tenantId: string, applicationId?: string) {
    return [...this.subscriptions.values()].filter(
      (sub) => sub.tenantId === tenantId && (!applicationId || sub.applicationId === applicationId)
    );
  }

  issueApiKey(tenantId: string, applicationId: string, scopes: string[]) {
    const rawSecret = `zt_${randomBytes(24).toString("base64url")}`;
    const credential: ApiCredential = {
      id: `cred-${randomUUID()}`,
      tenantId,
      applicationId,
      type: "api-key",
      keyPrefix: rawSecret.slice(0, 10),
      secretHash: this.hashSecret(rawSecret),
      scopes,
      createdAt: now()
    };
    this.credentials.set(credential.id, credential);
    return { credential, apiKey: rawSecret };
  }

  validateApiKey(apiKey: string) {
    const secretHash = this.hashSecret(apiKey);
    return [...this.credentials.values()].find((credential) => !credential.revokedAt && credential.secretHash === secretHash);
  }

  getRateLimitPolicy(name: string) {
    return this.policies.get(name) ?? this.policies.get("bronze");
  }

  listPolicies() {
    return [...this.policies.values()];
  }

  private hashSecret(secret: string) {
    return createHash("sha256").update(secret).digest("hex");
  }

  private seed() {
    this.upsertApi({
      id: "payments-api",
      tenantId: "tenant-a",
      name: "Payments API",
      version: "1.0.0",
      context: "/payments",
      upstream: "http://payment-service:3000",
      protocol: "REST",
      status: "PUBLISHED",
      authentication: ["oauth2", "api-key"],
      rateLimitPolicy: "gold",
      scopes: ["payments.read", "payments.write"],
      resources: [
        { method: "GET", path: "/transactions", scopes: ["payments.read"] },
        { method: "POST", path: "/transactions", scopes: ["payments.write"] }
      ],
      documentation: "Demo payments API for API Management Platform flows."
    });
  }
}

export const apimStore = new ApimStore();
