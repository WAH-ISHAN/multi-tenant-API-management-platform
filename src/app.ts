import express from "express";
import morgan from "morgan";
import { adminRouter } from "./admin/admin-router.js";
import { controlPlaneRouter } from "./control-plane/control-plane-router.js";
import { gatewayRouter } from "./gateway/gateway-router.js";
import { edgeSecurity } from "./security/edge-security.js";
import { requestContext } from "./security/request-context.js";
import { serviceRouter } from "./services/service-router.js";

export function createApp() {
  const app = express();

  app.use(requestContext);
  app.use(...edgeSecurity);
  app.use(express.json({ limit: "1mb" }));
  app.use(morgan("combined"));

  app.get("/healthz", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api/v1", controlPlaneRouter);
  app.use("/gateway", gatewayRouter);
  app.use("/api", serviceRouter);
  app.use("/admin", adminRouter);

  app.use((_req, res) => {
    res.status(404).json({ error: "not_found" });
  });

  return app;
}
