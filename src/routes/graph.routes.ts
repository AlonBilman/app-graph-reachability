import { Router } from "express";
import { postGraph } from "../controllers/graph.controller";
import { validate } from "../middleware/validate";
import { GraphSchema } from "../schemas/graph.schema";

export const graphRouter = Router();
graphRouter.post("/", validate(GraphSchema), postGraph);
