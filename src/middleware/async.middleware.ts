// Import Express types for strong typing and IDE support
import type { Request, Response, NextFunction, RequestHandler } from "express";

// Define a reusable type for async route handlers
// This enforces that wrapped handlers return a Promise
type AsyncRouteHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<unknown>;

// Higher-order function that wraps async route handlers
// Automatically forwards rejected promises to Express error middleware
export const asyncHandler = (fn: AsyncRouteHandler): RequestHandler => {
  // Return a standard Express middleware function
  return (req, res, next) => {
    // Ensure the handler is resolved as a Promise
    // Any thrown error or rejected promise is caught and passed to next()
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
