/**
 * Custom application error class used to standardize errors across the API.
 *
 * Purpose:
 * - attaches an HTTP status code to an error
 * - preserves the normal JavaScript Error behavior
 * - allows controllers/services to throw errors consistently
 * - works cleanly with the global error-handling middleware
 */
export class ErrorResponse extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);

    this.statusCode = statusCode;
    this.isOperational = true;

    // Restore prototype chain so instanceof checks work correctly.
    Object.setPrototypeOf(this, ErrorResponse.prototype);

    // Captures stack trace without including this constructor in it.
    Error.captureStackTrace(this, this.constructor);
  }
}
