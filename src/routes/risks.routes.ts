import { Router } from "express";
import { getRisks } from "../controllers/risks.controller";
import { validateQuery } from "../middleware/validate";
import { RisksQuerySchema } from "../schemas/risks.schema";

export const risksRouter = Router();
risksRouter.get("/", validateQuery(RisksQuerySchema), getRisks);
