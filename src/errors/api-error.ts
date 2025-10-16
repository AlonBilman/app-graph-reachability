/**
 * Base API error class with HTTP status code support
 */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = "ApiError";
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 404 Not Found error
 */
export class NotFoundError extends ApiError {
  constructor(resource: string, id: string) {
    super(404, `${resource} not found: ${id}`, "NOT_FOUND");
  }
}

/**
 * 400 Bad Request error
 */
export class ValidationError extends ApiError {
  constructor(message: string, details?: any) {
    super(400, message, "VALIDATION_ERROR");
    if (details) {
      (this as any).details = details;
    }
  }
}

/**
 * 400 Bad Request - Graph not loaded
 */
export class GraphNotLoadedError extends ApiError {
  constructor() {
    super(400, "Graph not loaded. POST /graph first.", "GRAPH_NOT_LOADED");
  }
}

/**
 * 409 Conflict error
 */
export class ConflictError extends ApiError {
  constructor(message: string) {
    super(409, message, "CONFLICT");
  }
}
