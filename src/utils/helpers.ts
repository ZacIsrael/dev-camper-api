// This file contains a list of helper functions
// that will get commonly reused

// Utility function to check if a value is a boolean
// Prevents truthy / falsy non-boolean values
export const isBoolean = (value: unknown): value is boolean =>
  typeof value === "boolean";

// Utility function to ensure a value is a non-empty trimmed string
// Used for required string validation
export const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;
