import { Router } from "express";
import { postVulns, getVulns } from "../controllers/vulns.controller";
import { validateBody } from "../middleware/validate";
import { VulnerabilityLoadRequestDTOSchema } from "../schemas/vulns.schema";

export const vulnsRouter = Router();
vulnsRouter.post(
  "/",
  validateBody(VulnerabilityLoadRequestDTOSchema),
  postVulns,
);
vulnsRouter.get("/", getVulns);
