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

import { isBoolean, isNonEmptyString, isNumber } from "../utils/helpers.js";
import mongoose from "mongoose";

// DTO representing the expected request body for creating a Course
// Enforces the same constraints defined in the mongoose schema
export class CreateReviewDTO {
  title: string;
  text: string;
  rating: number;
  // user that uploaded the review
  user: mongoose.Types.ObjectId;
  // bootcamp that this review belongs
  bootcamp: mongoose.Types.ObjectId;

  constructor(data: Partial<CreateReviewDTO>) {
    if (!isNonEmptyString(data.title)) {
      throw new Error("Please add a title");
    }

    // Trim whitespace to prevent storing accidental leading/trailing spaces
    const title = data.title.trim();

    if (title.length > 100) {
      throw new Error("Title must be 100 characters or less.");
    }
    this.title = title;

    if (!isNonEmptyString(data.text)) {
      throw new Error("Please add a review");
    }

    // Trim whitespace to prevent storing accidental leading/trailing spaces
    const text = data.text.trim();
    this.text = text;

    if (!isNumber(data.rating)) {
      throw new Error("Please give this bootcamp a valid rating (1-10)");
    }

    if (data.rating > 10 || data.rating < 1) {
      throw new Error("Please give this bootcamp a valid rating (1-10)");
    }
    this.rating = data.rating;

    if (!isNonEmptyString(data.user)) {
      throw new Error("Please add a user id");
    }

    // Check that the data.user is in the proper format of a Mongoose id
    if (!mongoose.Types.ObjectId.isValid(data.user)) {
      throw new Error("Please add a valid user id");
    }

    // Assign validated user to DTO
    this.user = data.user;

    if (!isNonEmptyString(data.bootcamp)) {
      throw new Error("Please add a bootcamp id");
    }

    // Check that the data.bootcamp is in the proper format of a Mongoose id
    if (!mongoose.Types.ObjectId.isValid(data.user)) {
      throw new Error("Please add a valid bootcamp id");
    }

    // Assign validated bootcamp to DTO
    this.bootcamp = data.bootcamp;
  }
}
