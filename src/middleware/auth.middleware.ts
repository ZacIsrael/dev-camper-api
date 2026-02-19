// Library used to sign and verify JSON Web Tokens
import jwt from "jsonwebtoken";

// Wrapper to handle async errors and pass them to Express error middleware
import { asyncHandler } from "./async.middleware.js";

// Custom error response class (not used here but available if needed)
// import { ErrorResponse } from "../utils/errorResponse.js";

// User model used to fetch the authenticated user from the database
import { User } from "../models/user.model.js";

import type { NextFunction, Request, Response } from "express";

// Load environment variables from config file
import dotenv from "dotenv";

// Node utilities for resolving file paths (ESM compatible setup)
import path from "node:path";
import { fileURLToPath } from "node:url";

// Resolve current file path and directory (since __dirname doesn't exist in ESM)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from custom config file location
dotenv.config({
  path: path.resolve(__dirname, "../config/config.env"),
});

// Middleware to protect routes by requiring a valid JWT
export const protect = asyncHandler(
  async (req: any, res: Response, next: NextFunction) => {
    let token;

    // Check for token in Authorization header (Bearer <token>)
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      // Extract token from header
      token = req.headers.authorization.split(" ")[1];

      // Otherwise check for token stored in cookies
    } else if (req.cookies.token) {
      token = req.cookies.token;
    }

    // If no token is found, deny access
    if (!token) {
      return res.status(401).json({
        success: false,
        error: "Not authorized to access this route",
      });
    }

    try {
      // Ensure JWT secret exists before verifying
      if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET is not defined in environment variables");
      }

      // Verify token and decode payload
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Debug log to inspect decoded payload during development
      console.log("auth.middleware: decoded = ", decoded);

      // Ensure payload has an id field before querying DB
      if (typeof decoded === "object" && "id" in decoded) {
        // Attach authenticated user document to request object
        req.user = await User.findById(decoded.id);
      } else {
        throw new Error("Invalid token payload");
      }

      // Continue to next middleware/route handler
      next();
    } catch {
      // If token verification fails, request will hang unless handled
      return res.status(401).json({
        success: false,
        error: "Not authorized to access this route",
      });
    }
  }
);

// Middleware to allow or deny access to certain routes depending on a user's role ("user" || "publisher" || "admin")
// Higher-order middleware that restricts access based on user roles
// Accepts a list of allowed roles and returns an Express middleware function
export const authorize = (...roles: any) => {
  return (req: any, res: Response, next: NextFunction) => {
    // req.user is set by the protect middleware after JWT verification
    // Check whether the authenticated user's role is included in allowed roles
    if (!roles.includes(req.user.role)) {
      // If user's role is not permitted, deny access with 403 Forbidden
      return res.status(403).json({
        success: false,
        error: `User role ${req.user.role} is unauthorized to access this route`,
      });
    }

    // User has an allowed role — proceed to the next middleware/handler
    next();
  };
};
