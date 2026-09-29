import type { GatewayRequest, PolicyDecision } from "../types.js";

interface PolicyResult {
  decision: PolicyDecision;
  reason: string;
}

const resourceRoles: Record<string, string[]> = {
  finance: ["manager", "finance-admin"],
  billing: ["manager", "billing-admin", "analyst"],
  inventory: ["manager", "inventory-admin", "analyst"]
};

export function evaluatePolicy(req: GatewayRequest): PolicyResult {
  const user = req.user;
  const tenant = req.tenant;
  const device = req.device;
  const resource = String(req.params.service ?? "");

  if (!user || !tenant || !device) return { decision: "deny", reason: "missing_security_context" };
  if (user.tenantId !== tenant.id) return { decision: "deny", reason: "tenant_boundary_violation" };
  if (!tenant.allowedServices.includes(resource)) return { decision: "deny", reason: "service_not_enabled_for_tenant" };
  if (device.trust === "risky") return { decision: "deny", reason: "risky_device" };

  const allowedRoles = resourceRoles[resource] ?? [];
  const hasRole = user.roles.some((role) => allowedRoles.includes(role));
  if (!hasRole) return { decision: "deny", reason: "role_not_allowed_for_resource" };

  if (resource === "finance" && device.trust !== "trusted") {
    return { decision: "step-up", reason: "finance_requires_trusted_device_or_step_up" };
  }

  if (resource === "finance" && user.authLevel !== "passkey") {
    return { decision: "step-up", reason: "finance_requires_passkey_authentication" };
  }

  return { decision: "allow", reason: "policy_matched" };
}
