import cors from "cors";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { config } from "../config.js";

export const edgeSecurity = [
  helmet(),
  cors({ origin: true, credentials: true }),
  rateLimit({
    windowMs: config.RATE_LIMIT_WINDOW_MS,
    limit: config.RATE_LIMIT_MAX,
    standardHeaders: "draft-8",
    legacyHeaders: false
  })
];
