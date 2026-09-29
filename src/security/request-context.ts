import { randomUUID } from "node:crypto";
import type { NextFunction, Response } from "express";
import type { GatewayRequest } from "../types.js";

export function requestContext(req: GatewayRequest, res: Response, next: NextFunction) {
  req.requestId = req.header("x-request-id") ?? randomUUID();
  res.setHeader("x-request-id", req.requestId);
  next();
}
