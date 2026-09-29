import type { NextFunction, Response } from "express";
import { config } from "../config.js";
import type { GatewayRequest, TenantContext } from "../types.js";

const tenants = new Map<string, TenantContext>([
  ["tenant-a", { id: "tenant-a", plan: "enterprise", allowedServices: ["finance", "billing", "inventory"] }],
  ["tenant-b", { id: "tenant-b", plan: "business", allowedServices: ["billing", "inventory"] }]
]);

export function tenantResolver(req: GatewayRequest, res: Response, next: NextFunction) {
  const tenantFromToken = req.user?.tenantId;
  const tenantFromHeader = req.header(config.TENANT_HEADER);

  if (!tenantFromToken) {
    res.status(401).json({ error: "missing_tenant_claim", requestId: req.requestId });
    return;
  }

  if (tenantFromHeader && tenantFromHeader !== tenantFromToken) {
    res.status(403).json({
      error: "tenant_context_mismatch",
      message: "Tenant context must be derived from the authenticated identity.",
      requestId: req.requestId
    });
    return;
  }

  const tenant = tenants.get(tenantFromToken);
  if (!tenant) {
    res.status(403).json({ error: "unknown_tenant", requestId: req.requestId });
    return;
  }

  req.tenant = tenant;
  next();
}
