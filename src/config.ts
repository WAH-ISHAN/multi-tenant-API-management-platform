import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.string().default("development"),
  PORT: z.coerce.number().int().positive().default(8080),
  LOG_LEVEL: z.string().default("info"),
  JWT_DEMO_SECRET: z.string().min(16).default("change-me-in-local-dev"),
  JWT_ISSUER: z.string().url().default("http://localhost:8080/demo-idp"),
  JWT_AUDIENCE: z.string().default("zero-trust-gateway"),
  OIDC_JWKS_URI: z.string().url().optional(),
  OIDC_ISSUER: z.string().url().optional(),
  TENANT_HEADER: z.string().default("x-tenant-id"),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(120)
});

export const config = envSchema.parse(process.env);
