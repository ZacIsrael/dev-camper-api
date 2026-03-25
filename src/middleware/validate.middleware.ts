/**
 * -----------------------------------------------------------------------------
 * VALIDATION MIDDLEWARE
 * -----------------------------------------------------------------------------
 *
 * Purpose:
 * This file acts as a centralized validation layer for incoming HTTP requests.
 * It ensures that ALL external input (req.body, req.params, req.query) is
 * validated and sanitized BEFORE it reaches the controller layer.
 *
 * Why this exists:
 * In Express, user input flows like this:
 *   Client → Route → Controller → Service → Database
 *
 * Without validation middleware, malicious or malformed input can reach the
 * business logic and database, leading to vulnerabilities such as:
 *   - Injection attacks (NoSQL/SQL)
 *   - Broken application logic
 *   - Invalid data being persisted
 *
 * This middleware enforces a strict rule:
 *   🚫 "No invalid input reaches controllers."
 *
 * How it works:
 * - Accepts either:
 *     1. A DTO class (which validates in its constructor)
 *     2. A custom validation function
 *
 * - Runs validation against incoming request data:
 *     - req.body
 *     - req.params
 *     - req.query
 *
 * - If validation succeeds:
 *     ✔ Replaces the original request data with the validated/sanitized version
 *     ✔ Passes control to the next middleware/controller
 *
 * - If validation fails:
 *     ❌ Stops the request immediately
 *     ❌ Returns a 400 Bad Request response
 *
 * Security Impact:
 * This is a CRITICAL layer for:
 *   - Input validation (OWASP Top 10)
 *   - Data integrity
 *   - Preventing malformed or malicious payloads
 *
 * Key Principle:
 *   "Validate early, trust nothing."
 *
 * -----------------------------------------------------------------------------
 */

import type { NextFunction, Request, Response } from "express";

// Represents a DTO class constructor.
// Example: class CreateUserDTO { constructor(data) { ... } }
// This is used so DTOs can be dynamically instantiated:
//   new CreateUserDTO(req.body)

type DTOConstructor<T> = new (data: unknown) => T;

/**
 * Generic validator function type.
 * Accepts raw input and returns validated/transformed data.
 */
type ValidatorFunction<T> = (data: unknown) => T;

// Type guard that tells TypeScript whether the validator
// should be treated like a class constructor.
// Why this is needed:
// TypeScript cannot automatically distinguish between:
// - constructable (new Class())
// - callable (function())
// This function tells TypeScript:
// "If this returns true, treat validator as a constructor"

const isDTOConstructor = <T>(
  validator: DTOConstructor<T> | ValidatorFunction<T>
): validator is DTOConstructor<T> => {
  return (
    typeof validator === "function" &&
    "prototype" in validator &&
    !!validator.prototype &&
    validator.prototype.constructor === validator
  );
};

/**
 * Core validation engine.
 *
 * This function abstracts the validation logic so the middleware
 * doesn't care whether it's using a DTO or a function.
 *
 * Behavior:
 * - If validator is a class → instantiate it (runs constructor validation)
 * - If validator is a function → call it directly
 *
 * This allows a unified interface for validation.
 */
const runValidation = <T>(
  validator: DTOConstructor<T> | ValidatorFunction<T>,
  data: unknown
): T => {
  if (isDTOConstructor(validator)) {
    // instantiate the class
    return new validator(data);
  }

  // call the function
  return validator(data);
};

/**
 * Middleware to validate request body (req.body).
 *
 * Flow:
 * 1. Takes incoming raw request body
 * 2. Passes it through validation (DTO or function)
 * 3. If valid → replaces req.body with sanitized version
 * 4. If invalid → sends 400 response and stops execution
 *
 * Why replace req.body?
 * → Ensures downstream code ONLY sees validated data
 */
export const validateBody =
  <T>(validator: DTOConstructor<T> | ValidatorFunction<T>) =>
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Run raw request body through validation (DTO or function)
      const validatedBody = runValidation(validator, req.body);
      // If valid, replace req.body with sanitized version
      req.body = validatedBody;
      next();
    } catch (error) {
      // If raw request body is invalid, send 400 response and stop execution
      const message =
        error instanceof Error ? error.message : "Invalid request body";

      res.status(400).json({
        success: false,
        error: message,
      });
    }
  };

/**
 * Middleware to validate route parameters (req.params).
 *
 * Example:
 *   /bootcamps/:id → validates "id"
 *
 * Important for:
 *   - Mongo ObjectId validation
 *   - Preventing malformed route access
 */
export const validateParams =
  <T>(validator: DTOConstructor<T> | ValidatorFunction<T>) =>
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Validates whether or not request parameters are in the correct format
      const validatedParams = runValidation(validator, req.params);
      req.params = validatedParams as Request["params"];
      next();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Invalid route parameters";

      res.status(400).json({
        success: false,
        error: message,
      });
    }
  };

/**
 * Middleware to validate query parameters (req.query).
 *
 * Example:
 *   ?page=1&limit=10&sort=name
 *
 * Important for:
 *   - Pagination safety
 *   - Preventing abuse of filtering/sorting logic
 */
export const validateQuery =
  <T>(validator: DTOConstructor<T> | ValidatorFunction<T>) =>
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const validatedQuery = runValidation(validator, req.query);

      // Clear the existing query object, then copy the validated values onto it.
      // req.query is getter-based, so mutate it instead of reassigning it.
      Object.keys(req.query).forEach((key) => {
        delete (req.query as Record<string, unknown>)[key];
      });

      Object.assign(req.query as Record<string, unknown>, validatedQuery);

      next();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Invalid query parameters";

      res.status(400).json({
        success: false,
        error: message,
      });
    }
  };
