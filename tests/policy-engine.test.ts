import { describe, expect, it } from "vitest";
import { evaluatePolicy } from "../src/security/policy-engine.js";
import type { GatewayRequest } from "../src/types.js";

function request(overrides: Partial<GatewayRequest> = {}): GatewayRequest {
  return {
    params: { service: "finance" },
    user: {
      sub: "user-123",
      tenantId: "tenant-a",
      roles: ["manager"],
      authLevel: "passkey",
      deviceTrust: "trusted",
      rawClaims: {}
    },
    tenant: {
      id: "tenant-a",
      plan: "enterprise",
      allowedServices: ["finance"]
    },
    device: { trust: "trusted", signals: [] },
    ...overrides
  } as unknown as GatewayRequest;
}

describe("policy engine", () => {
  it("allows a manager with trusted device and passkey to access finance", () => {
    expect(evaluatePolicy(request())).toEqual({ decision: "allow", reason: "policy_matched" });
  });

  it("denies cross-tenant access", () => {
    expect(evaluatePolicy(request({ tenant: { id: "tenant-b", plan: "business", allowedServices: ["finance"] } }))).toEqual({
      decision: "deny",
      reason: "tenant_boundary_violation"
    });
  });

  it("requires step-up for finance from an unknown device", () => {
    expect(evaluatePolicy(request({ device: { trust: "unknown", signals: [] } }))).toEqual({
      decision: "step-up",
      reason: "finance_requires_trusted_device_or_step_up"
    });
  });
});
