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

import {
  isAllowedEnumValue,
  isValidEmail,
  isValidPassword,
  rejectUnknownFields,
} from "../utils/validation.js";
import {
  assertIsObject,
  isNonEmptyString,
  sanitizePlainText,
} from "../utils/helpers.js";

// A user can also be an "admin" BUT that will not be allowed via
// public regostration.
const PUBLIC_USER_ROLES = ["user", "publisher"] as const;

// DTO representing the expected request body for creating a User
// Enforces the same constraints defined in the mongoose schema
export class CreateUserDTO {
  name: string;
  email: string;
  role?: (typeof PUBLIC_USER_ROLES)[number];
  password: string;

  constructor(data: unknown) {
    // ensure that data is an object
    const payload = assertIsObject(data, "Request body must be a valid object");
    // Only allow exact fields expected for PUBLIC registration
    rejectUnknownFields(data, ["name", "email", "role", "password"]);
    const { name, email, role, password } = payload;
    // Validate presence and format of name
    if (!isNonEmptyString(name)) {
      throw new Error("Name field is required and must be a non-empty string.");
    }

    // Sanitize user-provided name input to strip malicious HTML/JS (XSS prevention)
    const sanitizedName = sanitizePlainText(name.trim());

    // Enforce max length defined in schema
    if (sanitizedName.length > 50) {
      throw new Error("Name can't be longer than 50 characters");
    }

    // Assign validated name to DTO
    this.name = sanitizedName;

    // Ensure that the email passed in is valid
    if (!isValidEmail(email)) {
      throw new Error("A Valid email is required");
    }

    // Trim email and make it lowercase (entries in the database need to be consistent)
    const normalizedEmail = email.trim().toLocaleLowerCase();

    // Assign validated email
    this.email = normalizedEmail;

    // If role is provided, validate it
    if (role !== undefined) {
      if (!isAllowedEnumValue(role, PUBLIC_USER_ROLES)) {
        throw new Error("Role must be either 'user' or 'publisher'");
      }

      this.role = role;
    } else {
      // if no role is passed in the request body, the default is "user"
      this.role = "user";
    }

    // Validate password.
    if (!isValidPassword(password)) {
      throw new Error("Password must be between 8 and 128 characters");
    }

    // Assign password
    this.password = password;
  }
}

// DTO representing the expected request body for logging a user in
export class LoginDTO {
  email: string;
  password: string;

  constructor(data: unknown) {
    // ensure that data parameter is an object
    const payload = assertIsObject(data, "Request body must be a valid object");

    // Only allow login credentials.
    rejectUnknownFields(payload, ["email", "password"]);

    // Destructure payload object
    const { email, password } = payload;

    // Validate email.
    if (!isValidEmail(email)) {
      throw new Error("A valid email address is required");
    }

    // Trim email and make it lowercase (entries in the database need to be consistent)
    const normalizedEmail = email.trim().toLowerCase();

    // Assign validated email
    this.email = normalizedEmail;

    // Validate password presence/shape.
    if (typeof password !== "string" || password.trim().length === 0) {
      throw new Error("Password is required");
    }

    // Assign password
    this.password = password;
  }
}

// DTO representing the expected request body for when a user forgot their password
export class ForgotPasswordDTO {
  email: string;

  constructor(data: unknown) {
    // Ensure that the data parameter is a valid object
    const payload = assertIsObject(data, "Request body must be a valid object");

    // Only allow email for forgot-password requests.
    rejectUnknownFields(payload, ["email"]);

    // Destructure payload object
    const { email } = payload;

    // Validate email
    if (!isValidEmail(email)) {
      throw new Error("A valid email address is required");
    }

    // Assign trimmed & lowercased validated email; entries in the database need to be consistent
    this.email = email.trim().toLowerCase();
  }
}

// DTO representing the expected request body for updating a user (admin's perspective)
export class UpdateUserDTO {
  email?: string;
  name?: string;
  password?: string;

  constructor(data: unknown) {
    // Ensure that the data parameter is a valid object
    const payload = assertIsObject(data, "Request body must be a valid object");

    // Only allow fields users are permitted to update here.
    rejectUnknownFields(payload, ["name", "email"]);

    // Destructure obejct
    const { name, email } = payload;
    if (email === undefined && name === undefined) {
      throw new Error(
        "At least one of the following fields must be updated: name, email"
      );
    }
    if (email !== undefined) {
      // Ensure that the email passed in is valid
      if (!isValidEmail(email)) {
        throw new Error("A valid email address is required");
      }

      // Assign trimmed & lowercased validated email; entries in the database need to be consistent
      this.email = email.trim().toLowerCase();
    }

    if (name !== undefined) {
      if (!isNonEmptyString(name)) {
        throw new Error("Name must be a non-empty string");
      }

      // Sanitize user-provided name input to strip malicious HTML/JS (XSS prevention)
      const sanitizedName = sanitizePlainText(name.trim());

      // Enforce max length defined in schema
      if (sanitizedName.length > 50) {
        throw new Error("Name must be less than 50 characters");
      }

      // Assign validated name to DTO
      this.name = sanitizedName;
    }
  }
}

// DTO that allows a user to update their password
export class UpdatePasswordDTO {
  currentPassword: string;
  newPassword: string;

  constructor(data: unknown) {
    // Ensure that the data passed in is an object
    const payload = assertIsObject(data, "Request body must be a valid object");

    rejectUnknownFields(payload, ["currentPassword", "newPassword"]);

    // Destructure payload
    const { currentPassword, newPassword } = payload;

    if (typeof currentPassword !== "string" || currentPassword.trim() === "") {
      throw new Error("Current password is required");
    }

    // Ensure that the newPassword is of valid password format
    if (!isValidPassword(newPassword)) {
      throw new Error("New password must be between 8 and 128 characters");
    }

    this.currentPassword = currentPassword;
    this.newPassword = newPassword;
  }
}
