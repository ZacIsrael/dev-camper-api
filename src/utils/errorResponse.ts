export class ErrorResponse extends Error {
  public statusCode: number;

  constructor(message: string, statusCode: number) {
    // Call the parent Error constructor with the message
    super(message);

    // Set the HTTP status code for this custom error
    this.statusCode = statusCode;

    // Restore prototype chain (essential when extending built-ins)
    Object.setPrototypeOf(this, ErrorResponse.prototype);
  }
}
