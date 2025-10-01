import { Router } from "express";
import { postVulns } from "../controllers/vulns.controller";
import { validate } from "../middleware/validate";
import { VulnsSchema } from "../schemas/vulns.schema";

export const vulnsRouter = Router();
vulnsRouter.post("/", validate(VulnsSchema), postVulns);
