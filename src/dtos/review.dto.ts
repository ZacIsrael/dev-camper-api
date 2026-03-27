// This file validates and sanitizes incoming API request data
// before it is used to create a Review document

/*

    Example Review structure:

   {
		"_id": "5d7a514b5d2c12c7449be020",
		"title": "Learned a ton!",
		"text": "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec viverra feugiat mauris id viverra. Duis luctus ex sed facilisis ultrices. Curabitur scelerisque bibendum ligula, quis condimentum libero fermentum in. Aenean erat erat, aliquam in purus a, rhoncus hendrerit tellus. Donec accumsan justo in felis consequat sollicitudin. Fusce luctus mattis nunc vitae maximus. Curabitur semper felis eu magna laoreet scelerisque",
		"rating": "8",
		"bootcamp": "5d713995b721c3bb38c1f5d0",
		"user": "5c8a1d5b0190b214360dc033"
	}

*/

import {
  assertIsObject,
  isBoolean,
  isNonEmptyString,
  isNumber,
  sanitizePlainText,
} from "../utils/helpers.js";
import mongoose from "mongoose";

// DTO representing the expected request body for creating a Course
// Enforces the same constraints defined in the mongoose schema
export class CreateReviewDTO {
  title: string;
  text: string;
  rating: number;

  constructor(data: unknown) {
    const payload = assertIsObject(data, "Request body must be a valid object");
    if (!isNonEmptyString(payload.title)) {
      throw new Error("Please add a title");
    }

    // Sanitize user-provided title input to strip malicious HTML/JS (XSS prevention)
    const title = sanitizePlainText(payload.title);

    if (title.length > 100) {
      throw new Error("Title must be 100 characters or less.");
    }
    this.title = title;

    if (!isNonEmptyString(payload.text)) {
      throw new Error("Please add a review");
    }

    // Sanitize user-provided text input to strip malicious HTML/JS (XSS prevention)
    const text = sanitizePlainText(payload.text);
    this.text = text;

    if (!isNumber(payload.rating)) {
      throw new Error("Please give this bootcamp a valid rating (1-10)");
    }

    if (payload.rating > 10 || payload.rating < 1) {
      throw new Error("Please give this bootcamp a valid rating (1-10)");
    }
    this.rating = payload.rating;
  }
}

// DTO representing the expected request body for updating a review
export class UpdateReviewDTO {
  title?: string;
  text?: string;
  rating?: number;

  constructor(data: any) {
    if (
      data.title === undefined &&
      data.text === undefined &&
      data.rating === undefined
    ) {
      throw new Error(
        "At least one of the following fields must be updated: title, text, rating"
      );
    }
    if (data.title !== undefined) {
      if (!isNonEmptyString(data.title)) {
        throw new Error("Please add a title");
      }

      // Trim whitespace to prevent storing accidental leading/trailing spaces
      // const title = data.title.trim();

      // Sanitize user-provided title input to strip malicious HTML/JS (XSS prevention)
      const title = sanitizePlainText(data.title);

      if (title.length > 100) {
        throw new Error("Title must be 100 characters or less.");
      }
      this.title = title;
    }

    if (data.text !== undefined) {
      if (!isNonEmptyString(data.text)) {
        throw new Error("Please add a review");
      }

      // Trim whitespace to prevent storing accidental leading/trailing spaces
      // const text = data.text.trim();

      // Sanitize user-provided text input to strip malicious HTML/JS (XSS prevention)
      const text = sanitizePlainText(data.text);
      this.text = text;
    }

    if (data.rating !== undefined) {
      if (!isNumber(data.rating)) {
        throw new Error("Please give this bootcamp a valid rating (1-10)");
      }

      if (data.rating > 10 || data.rating < 1) {
        throw new Error("Please give this bootcamp a valid rating (1-10)");
      }
      this.rating = data.rating;
    }
  }
}
