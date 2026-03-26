// This file validates and sanitizes incoming API request data
// before it is used to create or update a Course document

import {
  assertIsObject,
  isBoolean,
  isNonEmptyString,
  isNumber,
  sanitizePlainText,
} from "../utils/helpers.js";
import mongoose from "mongoose";

const ALLOWED_MINIMUM_SKILLS = [
  "beginner",
  "intermediate",
  "advanced",
] as const;

type MinimumSkill = (typeof ALLOWED_MINIMUM_SKILLS)[number];

// DTO representing the expected request body for creating a Course
// Enforces the same constraints defined in the mongoose schema
export class CreateCourseDTO {
  title: string;
  description: string;
  weeks: number;
  tuition: number;
  minimumSkill: MinimumSkill;
  scholarhipsAvailable: boolean;
  user: mongoose.Types.ObjectId;

  constructor(data: unknown) {
    const payload = assertIsObject(data, "Request body must be a valid object");

    if (!isNonEmptyString(payload.title)) {
      throw new Error("Please add a title");
    }

    // Sanitize user-provided title input to strip malicious HTML/JS
    this.title = sanitizePlainText(payload.title);

    if (!isNonEmptyString(payload.description)) {
      throw new Error("Please add a description");
    }

    // Sanitize user-provided description input to strip malicious HTML/JS
    this.description = sanitizePlainText(payload.description);

    if (!isNonEmptyString(payload.minimumSkill)) {
      throw new Error("Please add a valid minimum skill level");
    }

    if (
      !ALLOWED_MINIMUM_SKILLS.includes(payload.minimumSkill as MinimumSkill)
    ) {
      throw new Error(
        "Please add a valid minimum skill level: beginner, intermediate, or advanced"
      );
    }

    this.minimumSkill = payload.minimumSkill as MinimumSkill;

    if (!isNumber(payload.weeks)) {
      throw new Error(
        "Please add a number for duration in weeks of this course"
      );
    }

    this.weeks = payload.weeks;

    if (!isNumber(payload.tuition)) {
      throw new Error("Please add a cost for the tuition of this course");
    }

    this.tuition = payload.tuition;

    if (payload.scholarhipsAvailable !== undefined) {
      if (!isBoolean(payload.scholarhipsAvailable)) {
        throw new Error("scholarhipsAvailable must be a boolean");
      }

      this.scholarhipsAvailable = payload.scholarhipsAvailable;
    } else {
      // Default to false if scholarhipsAvailable is not provided
      this.scholarhipsAvailable = false;
    }

    if (!isNonEmptyString(payload.user)) {
      throw new Error("Please add a user id");
    }

    if (!mongoose.Types.ObjectId.isValid(payload.user)) {
      throw new Error("Please add a valid user id");
    }

    this.user = new mongoose.Types.ObjectId(payload.user);
  }
}

// DTO representing the expected request body for updating a Course
// Allows partial updates while validating only the fields that are provided
export class UpdateCourseDTO {
  title?: string;
  description?: string;
  weeks?: number;
  tuition?: number;
  minimumSkill?: MinimumSkill;
  scholarhipsAvailable?: boolean;

  constructor(data: unknown) {
    const payload = assertIsObject(data, "Request body must be a valid object");

    if (
      payload.title === undefined &&
      payload.description === undefined &&
      payload.weeks === undefined &&
      payload.tuition === undefined &&
      payload.minimumSkill === undefined &&
      payload.scholarhipsAvailable === undefined
    ) {
      throw new Error(
        "At least one of the following fields must be updated: title, description, weeks, tuition, minimumSkill, scholarhipsAvailable"
      );
    }

    if (payload.title !== undefined) {
      if (!isNonEmptyString(payload.title)) {
        throw new Error("Please add a title");
      }

      this.title = sanitizePlainText(payload.title);
    }

    if (payload.description !== undefined) {
      if (!isNonEmptyString(payload.description)) {
        throw new Error("Please add a description");
      }

      this.description = sanitizePlainText(payload.description);
    }

    if (payload.minimumSkill !== undefined) {
      if (!isNonEmptyString(payload.minimumSkill)) {
        throw new Error("Please add a valid minimum skill level");
      }

      if (
        !ALLOWED_MINIMUM_SKILLS.includes(payload.minimumSkill as MinimumSkill)
      ) {
        throw new Error(
          "Please add a valid minimum skill level: beginner, intermediate, or advanced"
        );
      }

      this.minimumSkill = payload.minimumSkill as MinimumSkill;
    }

    if (payload.weeks !== undefined) {
      if (!isNumber(payload.weeks)) {
        throw new Error(
          "Please add a number for duration in weeks of this course"
        );
      }

      this.weeks = payload.weeks;
    }

    if (payload.tuition !== undefined) {
      if (!isNumber(payload.tuition)) {
        throw new Error("Please add a cost for the tuition of this course");
      }

      this.tuition = payload.tuition;
    }

    if (payload.scholarhipsAvailable !== undefined) {
      if (!isBoolean(payload.scholarhipsAvailable)) {
        throw new Error("scholarhipsAvailable must be a boolean");
      }

      this.scholarhipsAvailable = payload.scholarhipsAvailable;
    }
  }
}
