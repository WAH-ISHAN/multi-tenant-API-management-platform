import { Router } from "express";
import { listSecurityEvents } from "../secops/security-events.js";
import { deviceTrust } from "../security/device-trust.js";
import { tenantResolver } from "../security/tenant-resolver.js";
import { tokenValidation } from "../security/token-validation.js";
import type { GatewayRequest } from "../types.js";

export const adminRouter = Router();

function requirePrivilegedSession(req: GatewayRequest, res: import("express").Response, next: import("express").NextFunction) {
  const hasAdminRole = req.user?.roles.includes("security-admin") ?? false;
  const elevatedUntil = req.header("x-privilege-expires-at");
  const isElevated = elevatedUntil ? Date.parse(elevatedUntil) > Date.now() : false;
  const strongAuth = req.user?.authLevel === "passkey";

  if (!hasAdminRole || !isElevated || !strongAuth) {
    res.status(403).json({
      error: "privileged_session_required",
      message: "Admin APIs require passkey authentication and a short-lived elevated session.",
      requestId: req.requestId
    });
    return;
  }

  next();
}

adminRouter.get("/security-events", tokenValidation, tenantResolver, deviceTrust, requirePrivilegedSession, (req, res) => {
  res.json({ requestId: (req as GatewayRequest).requestId, events: listSecurityEvents() });
});
