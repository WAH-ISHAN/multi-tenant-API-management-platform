import { Router } from "express";
import { developerRouter } from "./developer-router.js";
import { publisherRouter } from "./publisher-router.js";

export const controlPlaneRouter = Router();

controlPlaneRouter.use("/publisher", publisherRouter);
controlPlaneRouter.use("/developer", developerRouter);
