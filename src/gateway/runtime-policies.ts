import { apimStore } from "../apim/store.js";
import { emitSecurityEvent } from "../secops/security-events.js";
import { trafficManager } from "../traffic/traffic-manager.js";
import type { GatewayPolicy } from "./policy-chain.js";

export const apiResolutionPolicy: GatewayPolicy = {
  name: "api-resolution",
  priority: 10,
  async execute(ctx, next) {
    const tenantId = ctx.req.header("x-tenant-id") ?? ctx.req.user?.tenantId ?? "tenant-a";
    const context = String(ctx.req.params.context ?? "");
    const api = apimStore.findPublishedApiByContext(tenantId, context);
    if (!api) {
      ctx.res.status(404).json({ error: "published_api_not_found", context, requestId: ctx.req.requestId });
      return;
    }
    ctx.api = api;
    await next();
  }
};

export const apiKeyPolicy: GatewayPolicy = {
  name: "api-key",
  priority: 20,
  async execute(ctx, next) {
    if (!ctx.api?.authentication.includes("api-key")) {
      await next();
      return;
    }

    const apiKey = ctx.req.header("x-api-key");
    if (!apiKey) {
      ctx.res.status(401).json({ error: "missing_api_key", requestId: ctx.req.requestId });
      return;
    }

    const credential = apimStore.validateApiKey(apiKey);
    if (!credential || credential.tenantId !== ctx.api.tenantId) {
      ctx.res.status(401).json({ error: "invalid_api_key", requestId: ctx.req.requestId });
      return;
    }

    ctx.credential = credential;
    ctx.applicationId = credential.applicationId;
    await next();
  }
};

export const subscriptionPolicy: GatewayPolicy = {
  name: "subscription",
  priority: 30,
  async execute(ctx, next) {
    if (!ctx.api || !ctx.applicationId) {
      ctx.res.status(403).json({ error: "subscription_context_missing", requestId: ctx.req.requestId });
      return;
    }

    const subscription = apimStore.findSubscription(ctx.api.tenantId, ctx.applicationId, ctx.api.id);
    if (!subscription) {
      ctx.res.status(403).json({ error: "subscription_required", requestId: ctx.req.requestId });
      return;
    }

    ctx.subscriptionId = subscription.id;
    await next();
  }
};

export const scopePolicy: GatewayPolicy = {
  name: "scope",
  priority: 40,
  async execute(ctx, next) {
    const api = ctx.api;
    const credential = ctx.credential;
    if (!api || !credential) {
      await next();
      return;
    }

    const requestPath = `/${String(ctx.req.params[0] ?? "")}`;
    const method = ctx.req.method.toUpperCase();
    const resource = api.resources.find((item) => item.method === method && item.path === requestPath);
    const requiredScopes = resource?.scopes ?? [];
    const hasScopes = requiredScopes.every((scope) => credential.scopes.includes(scope));

    if (!hasScopes) {
      ctx.res.status(403).json({ error: "insufficient_scope", requiredScopes, requestId: ctx.req.requestId });
      return;
    }

    await next();
  }
};

export const trafficPolicy: GatewayPolicy = {
  name: "traffic-manager",
  priority: 50,
  async execute(ctx, next) {
    const api = ctx.api;
    if (!api) {
      ctx.res.status(500).json({ error: "api_context_missing", requestId: ctx.req.requestId });
      return;
    }

    const policy = apimStore.getRateLimitPolicy(api.rateLimitPolicy);
    if (!policy) {
      ctx.res.status(500).json({ error: "rate_limit_policy_missing", requestId: ctx.req.requestId });
      return;
    }

    const key = [api.tenantId, api.id, ctx.applicationId ?? "anonymous"].join(":");
    const decision = trafficManager.check(key, policy);
    ctx.res.setHeader("x-rate-limit-remaining", String(decision.remaining));
    ctx.res.setHeader("x-rate-limit-reset", new Date(decision.resetAt).toISOString());

    if (!decision.allowed) {
      ctx.res.status(429).json({ error: "rate_limit_exceeded", policy: policy.name, requestId: ctx.req.requestId });
      return;
    }

    await next();
  }
};

export const analyticsPolicy: GatewayPolicy = {
  name: "analytics",
  priority: 100,
  async execute(ctx, next) {
    const startedAt = Date.now();
    await next();
    emitSecurityEvent({
      type: "gateway.api.invocation",
      requestId: ctx.req.requestId ?? "unknown",
      tenantId: ctx.api?.tenantId,
      resource: ctx.api?.id,
      reason: `${ctx.req.method} ${ctx.req.originalUrl} ${Date.now() - startedAt}ms`,
      timestamp: new Date().toISOString()
    });
  }
};
