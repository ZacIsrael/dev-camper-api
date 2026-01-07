// This file validates and sanitizes incoming API request data
// before it is used to create a Bootcamp document
import type { Career } from "../types/career.type.js";

// Regex used to validate email format (matches mongoose schema)
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

// Utility function to check if a value is a boolean
// Prevents truthy / falsy non-boolean values
const isBoolean = (value: unknown): value is boolean =>
  typeof value === "boolean";

// Utility function to ensure a value is a non-empty trimmed string
// Used for required string validation
const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

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

  // Constructor receives raw request body data
  // Uses Partial to allow missing optional fields
  constructor(data: Partial<CreateBootcampDTO>) {
    // -------------------- Required data --------------------

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

    // Validate presence and format of description
    if (!isNonEmptyString(data.description)) {
      throw new Error("Please add a description");
    }

    // Trim description to remove extra whitespace
    const description = data.description.trim();

    // Enforce max length defined in schema
    if (description.length > 165) {
      throw new Error("Description can't be longer than 165 characters");
    }

    // Assign validated description to DTO
    this.description = description;

    // Validate presence of address
    if (!isNonEmptyString(data.address)) {
      throw new Error("Please add an address");
    }

    // Trim and assign address
    this.address = data.address.trim();

    // Validate careers array exists and is not empty
    if (!Array.isArray(data.careers) || data.careers.length === 0) {
      throw new Error("Please add at least one career");
    }

    // Temporary array to store validated careers
    const careers: Career[] = [];

    // Validate each career value against allowed enum
    for (const c of data.careers) {
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

    // -------------------- Optional data --------------------

    // Validate website if provided
    if (data.website !== undefined) {
      if (!isNonEmptyString(data.website)) {
        throw new Error("Website must be a non-empty string");
      }

      // Trim website URL
      const website = data.website.trim();

      // Enforce URL regex from schema
      if (!WEBSITE_REGEX.test(website)) {
        throw new Error("Please use a valid URL with HTTP or HTTPS");
      }

      // Assign validated website
      this.website = website;
    }

    // Validate phone number if provided
    if (data.phone !== undefined) {
      if (!isNonEmptyString(data.phone)) {
        throw new Error("Phone must be a non-empty string");
      }

      // Trim phone number
      const phone = data.phone.trim();

      // Enforce max length defined in schema
      if (phone.length > 20) {
        throw new Error("Phone number can't be longer than 20 characters");
      }

      // Assign validated phone number
      this.phone = phone;
    }

    // Validate email if provided
    if (data.email !== undefined) {
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
    }

    // Validate housing flag if provided
    if (data.housing !== undefined) {
      if (!isBoolean(data.housing))
        throw new Error("housing must be a boolean");

      // Assign validated boolean
      this.housing = data.housing;
    }

    // Validate job assistance flag if provided
    if (data.jobAssistance !== undefined) {
      if (!isBoolean(data.jobAssistance))
        throw new Error("jobAssistance must be a boolean");

      // Assign validated boolean
      this.jobAssistance = data.jobAssistance;
    }

    // Validate job guarantee flag if provided
    if (data.jobGuarantee !== undefined) {
      if (!isBoolean(data.jobGuarantee))
        throw new Error("jobGuarantee must be a boolean");

      // Assign validated boolean
      this.jobGuarantee = data.jobGuarantee;
    }

    // Validate GI Bill acceptance flag if provided
    if (data.acceptGi !== undefined) {
      if (!isBoolean(data.acceptGi))
        throw new Error("acceptGi must be a boolean");

      // Assign validated boolean
      this.acceptGi = data.acceptGi;
    }
  }
}
