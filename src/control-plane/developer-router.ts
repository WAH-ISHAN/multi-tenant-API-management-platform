import { Router } from "express";
import { apimStore } from "../apim/store.js";
import { applicationInputSchema, credentialInputSchema, subscriptionInputSchema } from "../apim/schemas.js";
import { keyManager } from "../key-manager/local-api-key-manager.js";
import type { GatewayRequest } from "../types.js";

export const developerRouter = Router();

developerRouter.get("/catalog", (req, res) => {
  const tenantId = typeof req.query.tenantId === "string" ? req.query.tenantId : undefined;
  res.json({ apis: apimStore.listApis(tenantId, true) });
});

developerRouter.post("/applications", (req: GatewayRequest, res) => {
  const input = applicationInputSchema.parse(req.body);
  const app = apimStore.createApplication({
    ...input,
    ownerSubject: input.ownerSubject ?? req.user?.sub ?? "developer-demo"
  });
  res.status(201).json(app);
});

developerRouter.get("/applications", (req, res) => {
  const tenantId = typeof req.query.tenantId === "string" ? req.query.tenantId : "tenant-a";
  const ownerSubject = typeof req.query.ownerSubject === "string" ? req.query.ownerSubject : undefined;
  res.json({ applications: apimStore.listApplications(tenantId, ownerSubject) });
});

developerRouter.post("/subscriptions", (req, res) => {
  const input = subscriptionInputSchema.parse(req.body);
  const app = apimStore.getApplication(input.applicationId);
  const api = apimStore.getApi(input.apiId);
  if (!app || app.tenantId !== input.tenantId) {
    res.status(404).json({ error: "application_not_found" });
    return;
  }
  if (!api || api.tenantId !== input.tenantId || api.status !== "PUBLISHED") {
    res.status(404).json({ error: "published_api_not_found" });
    return;
  }
  res.status(201).json(apimStore.createSubscription(input));
});

developerRouter.get("/subscriptions", (req, res) => {
  const tenantId = typeof req.query.tenantId === "string" ? req.query.tenantId : "tenant-a";
  const applicationId = typeof req.query.applicationId === "string" ? req.query.applicationId : undefined;
  res.json({ subscriptions: apimStore.listSubscriptions(tenantId, applicationId) });
});

developerRouter.post("/credentials/api-keys", async (req, res) => {
  const input = credentialInputSchema.parse(req.body);
  const app = apimStore.getApplication(input.applicationId);
  if (!app || app.tenantId !== input.tenantId) {
    res.status(404).json({ error: "application_not_found" });
    return;
  }

  res.status(201).json(await keyManager.issueApiKey(input));
});

developerRouter.get("/policies/rate-limits", (_req, res) => {
  res.json({ policies: apimStore.listPolicies() });
});
