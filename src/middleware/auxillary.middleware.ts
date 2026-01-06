// Import Express request lifecycle types for strong typing
import { type NextFunction, type Request, type Response } from "express";

// Custom middleware to log incoming HTTP requests
export const logger = (req: Request, res: Response, next: NextFunction) => {
  // Log the HTTP method, protocol, host, and original URL of the request
  console.log(
    `${req.method} ${req.protocol}://${req.get("host")}${req.originalUrl}`
  );

  // Pass control to the next middleware or route handler
  next();
};
