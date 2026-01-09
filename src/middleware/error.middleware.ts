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

  let message;
  let statusCode;

  // Mongo duplicate key error
  if (err.error instanceof MongoServerError && err.error.code === 11000) {
    statusCode = 400;
    message =
      "Duplicate field value entered; A bootcamp with that name already exists.";
  }

  res.status(statusCode || err.statusCode).json({
    success: false,
    error: message || err.message,
  });
};
