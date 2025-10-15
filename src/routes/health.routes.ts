import { Router } from "express";
import type { RequestHandler } from "express";
import { ResponseHelper } from "../utils/response.helper";

export const healthRouter = Router();

const getHealth: RequestHandler = (_req, res) => {
  const health = {
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  };

  ResponseHelper.success(res, health);
};

healthRouter.get("/", getHealth);
