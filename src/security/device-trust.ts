import type { NextFunction, Response } from "express";
import type { DeviceTrustLevel, GatewayRequest } from "../types.js";

const validTrustLevels = new Set<DeviceTrustLevel>(["trusted", "managed", "unknown", "risky"]);

export function deviceTrust(req: GatewayRequest, _res: Response, next: NextFunction) {
  const headerTrust = req.header("x-device-trust");
  const tokenTrust = req.user?.deviceTrust;
  const trust = validTrustLevels.has(headerTrust as DeviceTrustLevel)
    ? (headerTrust as DeviceTrustLevel)
    : tokenTrust ?? "unknown";

  req.device = {
    id: req.header("x-device-id"),
    trust,
    signals: [
      req.header("x-device-attested") === "true" ? "attested" : "not-attested",
      req.header("x-edr-risk") === "high" ? "edr-risk-high" : "edr-risk-normal"
    ]
  };

  next();
}
