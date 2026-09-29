import { Router } from "express";
import { emitSecurityEvent } from "../secops/security-events.js";
import { apimStore } from "../apim/store.js";
import { apiInputSchema } from "../apim/schemas.js";
import { eventBus } from "../events/event-bus.js";
import type { ManagedApi } from "../apim/models.js";
import type { GatewayRequest } from "../types.js";

export const publisherRouter = Router();

publisherRouter.post("/apis", (req: GatewayRequest, res) => {
  const input = apiInputSchema.parse(req.body);
  const api = apimStore.upsertApi(input);
  eventBus.publish({
    type: "api.updated",
    tenantId: api.tenantId,
    resourceId: api.id,
    payload: api,
    timestamp: new Date().toISOString()
  });
  emitSecurityEvent({
    type: "control-plane.api.saved",
    requestId: req.requestId ?? "unknown",
    tenantId: api.tenantId,
    resource: api.id,
    timestamp: new Date().toISOString()
  });
  res.status(201).json(api);
});

publisherRouter.get("/apis", (req, res) => {
  const tenantId = typeof req.query.tenantId === "string" ? req.query.tenantId : undefined;
  res.json({ apis: apimStore.listApis(tenantId) });
});

publisherRouter.get("/apis/:id", (req, res) => {
  const api = apimStore.getApi(req.params.id);
  if (!api) {
    res.status(404).json({ error: "api_not_found" });
    return;
  }
  res.json(api);
});

publisherRouter.put("/apis/:id", (req, res) => {
  const input = apiInputSchema.parse({ ...req.body, id: req.params.id });
  const api = apimStore.upsertApi(input);
  eventBus.publish({
    type: "api.updated",
    tenantId: api.tenantId,
    resourceId: api.id,
    payload: api,
    timestamp: new Date().toISOString()
  });
  res.json(api);
});

publisherRouter.delete("/apis/:id", (req, res) => {
  res.status(apimStore.deleteApi(req.params.id) ? 204 : 404).end();
});

function lifecycle(status: ManagedApi["status"]) {
  return (req: GatewayRequest, res: import("express").Response) => {
    const api = apimStore.transitionApi(req.params.id, status);
    if (!api) {
      res.status(404).json({ error: "api_not_found" });
      return;
    }
    eventBus.publish({
      type: "api.lifecycle.changed",
      tenantId: api.tenantId,
      resourceId: api.id,
      payload: api,
      timestamp: new Date().toISOString()
    });
    emitSecurityEvent({
      type: `control-plane.api.${status.toLowerCase()}`,
      requestId: req.requestId ?? "unknown",
      tenantId: api.tenantId,
      resource: api.id,
      timestamp: new Date().toISOString()
    });
    res.json(api);
  };
}

publisherRouter.post("/apis/:id/publish", lifecycle("PUBLISHED"));
publisherRouter.post("/apis/:id/deprecate", lifecycle("DEPRECATED"));
publisherRouter.post("/apis/:id/retire", lifecycle("RETIRED"));
