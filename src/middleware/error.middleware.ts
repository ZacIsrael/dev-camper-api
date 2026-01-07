import type { NextFunction, Request, Response } from "express";

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // log error stack to the console
  console.log("err.stack = ", err.stack.red);

  res.status(500).json({
    success: false,
    error: err.message,
  });
};
