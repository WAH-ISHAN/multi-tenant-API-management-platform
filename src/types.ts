import type { Request } from "express";

export type DeviceTrustLevel = "trusted" | "managed" | "unknown" | "risky";
export type PolicyDecision = "allow" | "deny" | "step-up";

export interface AuthenticatedUser {
  sub: string;
  tenantId: string;
  roles: string[];
  department?: string;
  authLevel?: string;
  deviceTrust?: DeviceTrustLevel;
  rawClaims: Record<string, unknown>;
}

export interface TenantContext {
  id: string;
  plan: "starter" | "business" | "enterprise";
  allowedServices: string[];
}

export interface DeviceContext {
  id?: string;
  trust: DeviceTrustLevel;
  signals: string[];
}

export interface SecurityEvent {
  type: string;
  requestId: string;
  tenantId?: string;
  subject?: string;
  decision?: PolicyDecision;
  resource?: string;
  reason?: string;
  timestamp: string;
}

export interface GatewayRequest extends Request {
  requestId?: string;
  user?: AuthenticatedUser;
  tenant?: TenantContext;
  device?: DeviceContext;
  policyDecision?: {
    decision: PolicyDecision;
    reason: string;
  };
}
