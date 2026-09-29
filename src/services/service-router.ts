import { Router } from "express";
import type { GatewayRequest } from "../types.js";
import { deviceTrust } from "../security/device-trust.js";
import { policyEnforcement } from "../security/policy-enforcement.js";
import { tenantResolver } from "../security/tenant-resolver.js";
import { tokenValidation } from "../security/token-validation.js";

export const serviceRouter = Router();

serviceRouter.get(
  "/:service/*?",
  tokenValidation,
  tenantResolver,
  deviceTrust,
  policyEnforcement,
  (req: GatewayRequest, res) => {
    res.json({
      requestId: req.requestId,
      tenant: req.tenant?.id,
      subject: req.user?.sub,
      service: req.params.service,
      path: req.params[0] ?? "/",
      decision: req.policyDecision,
      upstream: {
        mode: "demo",
        note: "Replace this handler with reverse proxy/service discovery for real upstream APIs."
      }
    });
  }
);
