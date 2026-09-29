import type { NextFunction, Response } from "express";
import { emitSecurityEvent } from "../secops/security-events.js";
import type { GatewayRequest } from "../types.js";
import { evaluatePolicy } from "./policy-engine.js";

export function policyEnforcement(req: GatewayRequest, res: Response, next: NextFunction) {
  const result = evaluatePolicy(req);
  req.policyDecision = result;

  emitSecurityEvent({
    type: "policy.decision",
    requestId: req.requestId ?? "unknown",
    tenantId: req.tenant?.id,
    subject: req.user?.sub,
    decision: result.decision,
    resource: String(req.params.service ?? ""),
    reason: result.reason,
    timestamp: new Date().toISOString()
  });

  if (result.decision === "deny") {
    res.status(403).json({ error: "access_denied", reason: result.reason, requestId: req.requestId });
    return;
  }

  if (result.decision === "step-up") {
    res.status(403).json({
      error: "step_up_required",
      reason: result.reason,
      allowedAuthMethods: ["passkey", "mfa"],
      requestId: req.requestId
    });
    return;
  }

  next();
}
