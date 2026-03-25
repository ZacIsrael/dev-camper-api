// This file handles ALL errors that occur when inserting or
// retrieving data from MongoDB. Yes, these are "server" side
// errors BUT but depending on the message, they could be
// due to a bad request from the client.
//
// Purpose:
// - standardizes all error responses across the API
// - converts known database/application errors into clean HTTP responses
// - prevents raw internal errors from leaking directly to clients

// Notes:
// - controllers/services should throw ErrorResponse for expected operational errors
// - unknown/unhandled errors fall back to a default 500 Server Error response

import type { NextFunction, Request, Response } from "express";
import { MongoServerError } from "mongodb";
import { ErrorResponse } from "../utils/errorResponse.js";

export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Debugging logs
  // console.log("errorHandler middleware: err = ", err);

  // Default fallback response
  let message = "Server Error";
  let statusCode = 500;

  // Handle custom application errors first.
  // These are the errors we intentionally throw from controllers/services.
  if (err instanceof ErrorResponse) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
    });
  }

  // Normalize built-in Error objects.
  if (err instanceof Error) {
    message = err.message;
  }

  // Mongo duplicate key error
  if (err instanceof MongoServerError && err.code === 11000) {
    const keys = err.keyValue ? Object.keys(err.keyValue) : [];
    const fields = keys.length > 0 ? keys.join(", ") : "field";
    const values = err.keyValue ? Object.values(err.keyValue).join(", ") : "";

    statusCode = 409;
    message =
      keys.length > 1
        ? `Duplicate ${fields} values entered (${values}); those values already exist.`
        : `Duplicate ${fields} value entered (${values}); that value already exists.`;

    return res.status(statusCode).json({
      success: false,
      error: message,
    });
  }

  // Normalize invalid Mongo ObjectId / cast errors.
  // Common when a malformed :id reaches Mongoose.
  if (err instanceof Error && "name" in err && err.name === "CastError") {
    return res.status(400).json({
      success: false,
      error: "Resource not found: invalid identifier format",
    });
  }

  // Normalize Mongoose validation errors.
  // Example: required fields missing, enum mismatch, min/max failures.
  if (err instanceof Error && "name" in err && err.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      error: message,
    });
  }

  // Final fallback from unexpected/unhandled errors
  res.status(statusCode).json({
    success: false,
    error: message,
  });
};
