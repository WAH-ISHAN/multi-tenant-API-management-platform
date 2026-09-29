import { Router } from "express";
import { composePolicies } from "./policy-chain.js";
import {
  analyticsPolicy,
  apiKeyPolicy,
  apiResolutionPolicy,
  scopePolicy,
  subscriptionPolicy,
  trafficPolicy
} from "./runtime-policies.js";

export const gatewayRouter = Router();

const pipeline = composePolicies(
  [apiResolutionPolicy, apiKeyPolicy, subscriptionPolicy, scopePolicy, trafficPolicy, analyticsPolicy],
  async (ctx) => {
    ctx.res.json({
      requestId: ctx.req.requestId,
      api: {
        id: ctx.api?.id,
        name: ctx.api?.name,
        version: ctx.api?.version,
        upstream: ctx.api?.upstream
      },
      applicationId: ctx.applicationId,
      subscriptionId: ctx.subscriptionId,
      routedPath: `/${String(ctx.req.params[0] ?? "")}`,
      note: "Demo runtime route. Replace terminal handler with proxy, load balancer, cache, and circuit breaker."
    });
  }
);

gatewayRouter.all("/:context/*?", async (req, res, next) => {
  try {
    await pipeline({ req, res });
  } catch (error) {
    next(error);
  }
});
