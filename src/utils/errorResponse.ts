import { Error } from "mongoose";

export class ErrorResponse {
  public statusCode: number;
  public error: Error;

  constructor(error: Error, statusCode: number) {
    this.error = error;

    // Set the HTTP status code for this custom error
    this.statusCode = statusCode;

    // Restore prototype chain (essential when extending built-ins)
    Object.setPrototypeOf(this, ErrorResponse.prototype);
  }
}
