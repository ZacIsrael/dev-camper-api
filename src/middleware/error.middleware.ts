// This file handles ALL errors that occur when inserting or retrieving data from MongoDB
// Yes, these are "server" side errors BUT but depending on the message, they could be
// due to a bad request from the user.

import type { NextFunction, Request, Response } from "express";
import { MongoServerError } from "mongodb";

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Debugging logs
  console.log("errorHandler middleware: err = ", err);

  // console.log("errorHandler middleware: err.stack = ", err.stack);
  // console.log("errorHandler middleware: err.name = ", err.name);

  let message: string = err?.message || "Server Error";
  let statusCode: number = err?.statusCode || 500;

  // Normalize "original" error just incase it gets wrapped
  const originalErr = err?.error ?? err;

  // Mongo duplicate key error
  if (originalErr instanceof MongoServerError && originalErr.code === 11000) {
    // Extract the field name(s) that violated a unique index from a MongoDB duplicate key error
    // Falls back to a generic label if Mongo does not provide key details
    const keys = originalErr?.keyValue ? Object.keys(originalErr.keyValue) : [];

    // Build a human-readable list of duplicate fields (or a generic label)
    const fields = keys.length > 0 ? keys.join(", ") : "field";
    // 409 Conflict is the correct HTTP status for duplicate resource violations
    statusCode = 409;

    // Adjust message grammar based on whether one or multiple fields caused the conflict
    message =
      keys.length > 1
        ? `Duplicate ${fields} value entered; a bootcamp with those values (${fields}) already exists.`
        : `Duplicate ${fields} value entered; a bootcamp with that ${fields} value already exists.`;
  }

  res.status(statusCode).json({
    success: false,
    error: message,
  });
};
