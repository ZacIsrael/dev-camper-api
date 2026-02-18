// This file validates and sanitizes incoming API request data
// before it is used to create a User document

/*

    Example User structure:

    {
		"_id": "5d7a514b5d2c12c7449be042",
		"name": "Admin Account",
		"email": "admin@gmail.com",
		"role": "user",
		"password": "123456"
	}

*/

import { isBoolean, isNonEmptyString, isNumber } from "../utils/helpers.js";

// Regex used to validate email format (matches mongoose schema)
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// DTO representing the expected request body for creating a User
// Enforces the same constraints defined in the mongoose schema
export class CreateUserDTO {
  name: string;
  email: string;
  role?: "user" | "publisher";
  password: string;

  // Constructor receives raw request body data
  // Uses Partial to allow missing optional fields
  constructor(data: Partial<CreateUserDTO>) {
    // Validate presence and format of name
    if (!isNonEmptyString(data.name)) {
      throw new Error("Please add a name");
    }

    // Trim name to remove extra whitespace
    const name = data.name.trim();

    // Enforce max length defined in schema
    if (name.length > 50) {
      throw new Error("Name can't be longer than 50 characters");
    }

    // Assign validated name to DTO
    this.name = name;

    if (!isNonEmptyString(data.email)) {
      throw new Error("Email must be a non-empty string");
    }

    // Trim email
    const email = data.email.trim();

    // Enforce email regex from schema
    if (!EMAIL_REGEX.test(email)) {
      throw new Error("Please add a valid email");
    }

    // Assign validated email
    this.email = email;

    // If role is provided, validate it
    if (data.role !== undefined) {
      if (!isNonEmptyString(data.role)) {
        throw new Error(
          'If provided, role must be a non-empty string: "user" or "publisher"'
        );
      }

      if (data.role !== "user" && data.role !== "publisher") {
        throw new Error(
          'Please add a valid role for the user: "user" or "publisher"'
        );
      }

      // Assign validated role
      this.role = data.role;
    }

    if (!isNonEmptyString(data.password)) {
      throw new Error("Please enter a password");
    }

    this.password = data.password;
  }
}

// DTO representing the expected request body for logging a user in
export class LoginDTO {
  email: string;
  password: string;

  constructor(data: any) {
    if (!isNonEmptyString(data.email)) {
      throw new Error("Email must be a non-empty string");
    }

    // Trim email
    const email = data.email.trim();

    // Enforce email regex from schema
    if (!EMAIL_REGEX.test(email)) {
      throw new Error("Please add a valid email");
    }

    // Assign validated email
    this.email = email;

    if (!isNonEmptyString(data.password)) {
      throw new Error("Please provide a password");
    }
    this.password = data.password;
  }
}
