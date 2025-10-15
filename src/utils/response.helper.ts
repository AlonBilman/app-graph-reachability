import { Response } from "express";

/**
 * Standardized API response helpers for consistent REST API responses
 */
export class ResponseHelper {
  static success<T>(res: Response, data: T): Response {
    return res.status(200).json({
      ok: true,
      data,
    });
  }

  static created<T>(res: Response, data: T): Response {
    return res.status(201).json({
      ok: true,
      data,
    });
  }

  static noContent(res: Response): Response {
    return res.status(204).send();
  }

  static custom<T>(res: Response, statusCode: number, data: T): Response {
    return res.status(statusCode).json({
      ok: true,
      data,
    });
  }
}
