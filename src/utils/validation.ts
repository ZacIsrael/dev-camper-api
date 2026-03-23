import mongoose from "mongoose";

/**
 * -----------------------------------------------------------------------------
 * VALIDATION UTILITIES
 * -----------------------------------------------------------------------------
 *
 * Purpose:
 * This file contains reusable input-validation helpers for incoming API data.
 * These utilities are meant to support DTOs, middleware, and route-level
 * validation by enforcing strict checks on untrusted input.
 *
 * Why this file exists:
 * - Keeps validation logic out of controllers
 * - Prevents duplication across DTOs
 * - Centralizes security-focused validation rules
 * - Makes validation behavior consistent across the application
 *
 * Key principle:
 *   "Validate early, validate strictly, trust nothing."
 *
 * What belongs here:
 * - unknown field rejection
 * - email validation
 * - password strength validation
 * - Mongo ObjectId validation
 * - number/integer validation
 * - enum/allowlist validation
 * - pagination/query validation
 *
 * -----------------------------------------------------------------------------
 */

/**
 * Ensures the incoming value is a plain object.
 * This helps prevent invalid shapes like arrays, null, strings, or numbers
 * from being treated like request payload objects.
 */
const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

/**
 * Rejects any properties that are not explicitly allowed.
 *
 * Why this matters:
 * - Prevents mass-assignment style issues
 * - Enforces allowlist-based validation
 * - Stops clients from sending unexpected fields
 */
export const rejectUnknownFields = (
  data: unknown,
  allowedFields: string[]
): void => {
  if (!isPlainObject(data)) {
    throw new Error("Request data must be a valid object");
  }

  const receivedFields = Object.keys(data);

  const unknownFields = receivedFields.filter(
    (field) => !allowedFields.includes(field)
  );

  if (unknownFields.length > 0) {
    throw new Error(`Unknown field(s): ${unknownFields.join(", ")}`);
  }
};

/**
 * Validates whether a value is a properly formatted email address.
 *
 * Note:
 * This checks format only. It does not prove the email actually exists.
 */
export const isValidEmail = (value: unknown): value is string => {
  if (typeof value !== "string") {
    return false;
  }

  const email = value.trim().toLowerCase();

  // Reasonably strict email format check for typical API use cases.
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  return emailRegex.test(email);
};

/**
 * Validates password strength.
 *
 * Current policy:
 * - must be a string
 * - must be at least 8 characters
 * - must not exceed 128 characters
 *
 * You can tighten this later if desired by requiring:
 * - uppercase letters
 * - lowercase letters
 * - numbers
 * - special characters
 */
export const isValidPassword = (value: unknown): value is string => {
  if (typeof value !== "string") {
    return false;
  }

  const password = value.trim();

  return password.length >= 8 && password.length <= 128;
};

/**
 * Validates whether a value is a valid MongoDB ObjectId.
 *
 * Important for route params like:
 * - /bootcamps/:id
 * - /courses/:id
 * - /reviews/:id
 * - /users/:id
 */
export const isValidObjectId = (value: unknown): value is string => {
  return typeof value === "string" && mongoose.Types.ObjectId.isValid(value);
};

/**
 * Validates whether a value is a positive number.
 *
 * Useful for:
 * - tuition
 * - distance
 * - radius
 * - numeric filters
 */
export const isPositiveNumber = (value: unknown): value is number => {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
};

/**
 * Validates whether a value is a non-negative number.
 *
 * Useful when zero is acceptable.
 */
export const isNonNegativeNumber = (value: unknown): value is number => {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
};

/**
 * Validates whether a value is a safe integer.
 *
 * Useful for:
 * - pagination values
 * - week counts
 * - whole-number numeric inputs
 */
export const isSafeInteger = (value: unknown): value is number => {
  return typeof value === "number" && Number.isSafeInteger(value);
};

/**
 * Validates whether a value is a positive safe integer.
 *
 * Useful for:
 * - page
 * - limit
 * - weeks
 */
export const isPositiveSafeInteger = (value: unknown): value is number => {
  return isSafeInteger(value) && value > 0;
};

/**
 * Ensures a value is one of the explicitly allowed enum values.
 *
 * This is allowlist validation and is safer than trying to block bad values.
 */
export const isAllowedEnumValue = <T extends string>(
  value: unknown,
  allowedValues: readonly T[]
): value is T => {
  return typeof value === "string" && allowedValues.includes(value as T);
};

/**
 * Parses a query value into a number safely.
 *
 * Query params arrive as strings, so this helper converts them into numbers
 * before validation.
 */
const parseQueryNumber = (value: unknown): number | null => {
  if (typeof value !== "string" || value.trim() === "") {
    return null;
  }

  const parsedValue = Number(value);

  return Number.isFinite(parsedValue) ? parsedValue : null;
};

/**
 * Validates common pagination query parameters.
 *
 * Supported fields:
 * - page
 * - limit
 *
 * Returns normalized numeric values if present.
 */
export const validatePaginationQuery = (
  query: unknown
): { page?: number; limit?: number } => {
  if (!isPlainObject(query)) {
    throw new Error("Query parameters must be a valid object");
  }

  const normalizedQuery: { page?: number; limit?: number } = {};

  if (query.page !== undefined) {
    const parsedPage = parseQueryNumber(query.page);

    if (parsedPage === null || !isPositiveSafeInteger(parsedPage)) {
      throw new Error("Query parameter 'page' must be a positive integer");
    }

    normalizedQuery.page = parsedPage;
  }

  if (query.limit !== undefined) {
    const parsedLimit = parseQueryNumber(query.limit);

    if (parsedLimit === null || !isPositiveSafeInteger(parsedLimit)) {
      throw new Error("Query parameter 'limit' must be a positive integer");
    }

    if (parsedLimit > 100) {
      throw new Error("Query parameter 'limit' cannot exceed 100");
    }

    normalizedQuery.limit = parsedLimit;
  }

  return normalizedQuery;
};

/**
 * Validates sort fields against an allowlist.
 *
 * Example accepted values:
 * - name
 * - -createdAt
 * - averageRating,-name
 */
export const validateSortFields = (
  sortValue: unknown,
  allowedFields: string[]
): string | undefined => {
  if (sortValue === undefined) {
    return undefined;
  }

  if (typeof sortValue !== "string" || sortValue.trim() === "") {
    throw new Error("Sort parameter must be a non-empty string");
  }

  const sortFields = sortValue.split(",").map((field) => field.trim());

  for (const rawField of sortFields) {
    const normalizedField = rawField.startsWith("-")
      ? rawField.slice(1)
      : rawField;

    if (!allowedFields.includes(normalizedField)) {
      throw new Error(`Invalid sort field: ${rawField}`);
    }
  }

  return sortFields.join(",");
};

/**
 * Validates select fields against an allowlist.
 *
 * Example accepted values:
 * - name,description
 * - averageRating,averageCost
 */
export const validateSelectFields = (
  selectValue: unknown,
  allowedFields: string[]
): string | undefined => {
  if (selectValue === undefined) {
    return undefined;
  }

  if (typeof selectValue !== "string" || selectValue.trim() === "") {
    throw new Error("Select parameter must be a non-empty string");
  }

  const selectedFields = selectValue.split(",").map((field) => field.trim());

  for (const field of selectedFields) {
    if (!allowedFields.includes(field)) {
      throw new Error(`Invalid select field: ${field}`);
    }
  }

  return selectedFields.join(",");
};
