// This file contains a list of helper functions
// that will get commonly reused

// Import sanitize-html library to clean user input and
// remove malicious HTML/JS
import sanitizeHtml from "sanitize-html";

// Utility function to check if a value is a boolean
// Prevents truthy / falsy non-boolean values
export const isBoolean = (value: unknown): value is boolean =>
  typeof value === "boolean";

// Utility function to ensure a value is a non-empty trimmed string
// Used for required string validation
export const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

// Utility function to check if a value is a boolean
// Prevents truthy / falsy non-boolean values

// Utility function to check if a value is a valid number
// Prevents NaN, Infinity, and non-number values
export const isNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

// Utility function to sanitize user-provided text input (prevents XSS payloads)
export const sanitizePlainText = (value: string): string =>
  // Sanitize input by trimming whitespace and stripping ALL HTML tags/attributes
  sanitizeHtml(value.trim(), {
    // Disallow all HTML tags (forces plain text only)
    allowedTags: [],
    // Disallow all HTML attributes (removes things like onerror, onclick, etc.)
    allowedAttributes: {},
  });
