import { createRemoteJWKSet, jwtVerify } from "jose";
import type { NextFunction, Response } from "express";
import { config } from "../config.js";
import type { AuthenticatedUser, DeviceTrustLevel, GatewayRequest } from "../types.js";

const demoSecret = new TextEncoder().encode(config.JWT_DEMO_SECRET);
const oidcJwks = config.OIDC_JWKS_URI ? createRemoteJWKSet(new URL(config.OIDC_JWKS_URI)) : undefined;

function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string");
  if (typeof value === "string") return [value];
  return [];
}

function toUser(claims: Record<string, unknown>): AuthenticatedUser {
  const tenantId = claims.tenant_id;
  const subject = claims.sub;

  if (typeof subject !== "string" || typeof tenantId !== "string") {
    throw new Error("Token must contain sub and tenant_id claims");
  }

  return {
    sub: subject,
    tenantId,
    roles: asStringArray(claims.roles),
    department: typeof claims.department === "string" ? claims.department : undefined,
    authLevel: typeof claims.auth_level === "string" ? claims.auth_level : undefined,
    deviceTrust: typeof claims.device_trust === "string" ? (claims.device_trust as DeviceTrustLevel) : undefined,
    rawClaims: claims
  };
}

export async function tokenValidation(req: GatewayRequest, res: Response, next: NextFunction) {
  try {
    const authorization = req.header("authorization");
    const token = authorization?.startsWith("Bearer ") ? authorization.slice("Bearer ".length) : undefined;

    if (!token) {
      res.status(401).json({ error: "missing_bearer_token", requestId: req.requestId });
      return;
    }

    const issuer = oidcJwks ? config.OIDC_ISSUER : config.JWT_ISSUER;
    const result = oidcJwks
      ? await jwtVerify(token, oidcJwks, {
          issuer,
          audience: config.JWT_AUDIENCE
        })
      : await jwtVerify(token, demoSecret, {
      issuer,
      audience: config.JWT_AUDIENCE
        });

    req.user = toUser(result.payload as Record<string, unknown>);
    next();
  } catch (error) {
    res.status(401).json({
      error: "invalid_token",
      reason: error instanceof Error ? error.message : "Token validation failed",
      requestId: req.requestId
    });
  }
}
