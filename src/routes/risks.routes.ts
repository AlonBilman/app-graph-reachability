import { Router } from "express";
import { getRisks } from "../controllers/risks.controller";
export const risksRouter = Router();

risksRouter.get("/", getRisks);
