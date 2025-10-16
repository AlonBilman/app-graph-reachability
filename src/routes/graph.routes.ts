import { Router } from "express";
import { postGraph, getGraph } from "../controllers/graph.controller";
import { validateBody } from "../middleware/validate";
import { GraphLoadRequestDTOSchema } from "../schemas/graph.schema";

export const graphRouter = Router();
graphRouter.post("/", validateBody(GraphLoadRequestDTOSchema), postGraph);
graphRouter.get("/", getGraph);
