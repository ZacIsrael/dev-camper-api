// This file validates and sanitizes incoming API request data
// before it is used to create a Bootcamp document
import type { Career } from "../types/career.type.js";
import {
  assertIsObject,
  isBoolean,
  isNonEmptyString,
  sanitizePlainText,
} from "../utils/helpers.js";
import { isValidEmail } from "../utils/validation.js";

// Regex used to validate website URLs (matches mongoose schema)
const WEBSITE_REGEX =
  /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/;

// Allowed career values (must stay in sync with mongoose enum)
const CAREER_VALUES: Career[] = [
  "Web Development",
  "Mobile Development",
  "UI/UX",
  "Data Science",
  "Business",
  "Other",
];

// Type guard that verifies a value is a valid Career enum
// Helps narrow unknown input to the Career union type
const isCareer = (value: unknown): value is Career => {
  return typeof value === "string" && CAREER_VALUES.includes(value as Career);
};

// DTO representing the expected request body for creating a bootcamp
// Enforces the same constraints defined in the mongoose schema
export class CreateBootcampDTO {
  // Bootcamp name (required)
  name: string;

  // Bootcamp description (required)
  description: string;

  // Optional website URL
  website?: string;

  // Optional contact phone number
  phone?: string;

  // Optional contact email
  email?: string;

  // Physical address (required, used for geocoding)
  address: string;

  // List of supported careers (required)
  careers: Career[];

  // Indicates whether housing is offered
  housing?: boolean;

  // Indicates whether job assistance is offered
  jobAssistance?: boolean;

  // Indicates whether a job guarantee is offered
  jobGuarantee?: boolean;

  // Indicates whether GI Bill is accepted
  acceptGi?: boolean;

  constructor(data: unknown) {
    const payload = assertIsObject(data, "Request body must be a valid object");
    //  Required data

    // Validate presence and format of name
    if (!isNonEmptyString(payload.name)) {
      throw new Error("Please add a name");
    }

    // Sanitize user-provided name input to strip malicious HTML/JS (XSS prevention)
    const name = sanitizePlainText(payload.name);

    // Enforce max length defined in schema
    if (name.length > 50) {
      throw new Error("Name can't be longer than 50 characters");
    }

    // Assign validated name to DTO
    this.name = name;

    // Validate presence and format of description
    if (!isNonEmptyString(payload.description)) {
      throw new Error("Please add a description");
    }

    // Sanitize user-provided description input to strip malicious HTML/JS (XSS prevention)
    const description = sanitizePlainText(payload.description);

    // Enforce max length defined in schema
    if (description.length > 165) {
      throw new Error("Description can't be longer than 165 characters");
    }

    // Assign validated description to DTO
    this.description = description;

    // Validate presence of address
    if (!isNonEmptyString(payload.address)) {
      throw new Error("Please add an address");
    }

    // Sanitize user-provided address input to strip malicious HTML/JS (XSS prevention)
    this.address = sanitizePlainText(payload.address);

    // Validate careers array exists and is not empty
    if (!Array.isArray(payload.careers) || payload.careers.length === 0) {
      throw new Error("Please add at least one career");
    }

    // Temporary array to store validated careers
    const careers: Career[] = [];

    // Validate each career value against allowed enum
    for (const c of payload.careers) {
      if (!isCareer(c)) {
        throw new Error(
          `Invalid career: "${String(c)}". Must be one of: ${CAREER_VALUES.join(
            ", "
          )}`
        );
      }

      // Push validated career into array
      careers.push(c);
    }

    // Assign validated careers array
    this.careers = careers;

    // Optional data

    // Validate website if provided
    if (payload.website !== undefined) {
      if (!isNonEmptyString(payload.website)) {
        throw new Error("Website must be a non-empty string");
      }

      // Trim website URL
      const website = payload.website.trim();

      // Enforce URL regex from schema
      if (!WEBSITE_REGEX.test(website)) {
        throw new Error("Please use a valid URL with HTTP or HTTPS");
      }

      // Assign validated website
      this.website = website;
    }

    // Validate phone number if provided
    if (payload.phone !== undefined) {
      if (!isNonEmptyString(payload.phone)) {
        throw new Error("Phone must be a non-empty string");
      }

      // Trim phone number
      const phone = payload.phone.trim();

      // Enforce max length defined in schema
      if (phone.length > 20) {
        throw new Error("Phone number can't be longer than 20 characters");
      }

      // Assign validated phone number
      this.phone = phone;
    }

    // Validate email if provided
    if (payload.email !== undefined) {
      if (!isNonEmptyString(payload.email)) {
        throw new Error("Email must be a non-empty string");
      }

      // Trim email
      const email = payload.email.trim();

      // Ensure that the email is valid
      if (!isValidEmail(email)) {
        throw new Error("Please add a valid email");
      }

      // Assign validated email
      this.email = email;
    }

    // Validate housing flag if provided
    if (payload.housing !== undefined) {
      if (!isBoolean(payload.housing))
        throw new Error("housing must be a boolean");

      // Assign validated boolean
      this.housing = payload.housing;
    }

    // Validate job assistance flag if provided
    if (payload.jobAssistance !== undefined) {
      if (!isBoolean(payload.jobAssistance))
        throw new Error("jobAssistance must be a boolean");

      // Assign validated boolean
      this.jobAssistance = payload.jobAssistance;
    }

    // Validate job guarantee flag if provided
    if (payload.jobGuarantee !== undefined) {
      if (!isBoolean(payload.jobGuarantee))
        throw new Error("jobGuarantee must be a boolean");

      // Assign validated boolean
      this.jobGuarantee = payload.jobGuarantee;
    }

    // Validate GI Bill acceptance flag if provided
    if (payload.acceptGi !== undefined) {
      if (!isBoolean(payload.acceptGi))
        throw new Error("acceptGi must be a boolean");

      // Assign validated boolean
      this.acceptGi = payload.acceptGi;
    }
  }
}
