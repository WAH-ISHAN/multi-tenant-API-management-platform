import { z } from "zod";

const httpMethodSchema = z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]);

export const apiResourceSchema = z.object({
  method: httpMethodSchema,
  path: z.string().startsWith("/"),
  scopes: z.array(z.string()).default([])
});

export const apiInputSchema = z.object({
  id: z.string().min(3),
  tenantId: z.string().min(1),
  name: z.string().min(3),
  version: z.string().min(1),
  context: z.string().startsWith("/"),
  upstream: z.string().url(),
  protocol: z.enum(["REST", "GRAPHQL", "WEBSOCKET"]).default("REST"),
  status: z.enum(["CREATED", "DESIGNED", "TESTING", "PUBLISHED", "DEPRECATED", "RETIRED"]).default("CREATED"),
  authentication: z.array(z.enum(["oauth2", "api-key", "mtls"])).default(["oauth2"]),
  rateLimitPolicy: z.string().default("bronze"),
  scopes: z.array(z.string()).default([]),
  resources: z.array(apiResourceSchema).default([]),
  documentation: z.string().optional()
});

export const applicationInputSchema = z.object({
  tenantId: z.string().min(1),
  ownerSubject: z.string().min(1).optional(),
  name: z.string().min(2),
  callbackUrls: z.array(z.string().url()).default([])
});

export const subscriptionInputSchema = z.object({
  tenantId: z.string().min(1),
  applicationId: z.string().min(1),
  apiId: z.string().min(1),
  plan: z.string().default("bronze")
});

export const credentialInputSchema = z.object({
  tenantId: z.string().min(1),
  applicationId: z.string().min(1),
  scopes: z.array(z.string()).default([])
});
