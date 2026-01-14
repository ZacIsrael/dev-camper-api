// This file validates and sanitizes incoming API request data
// before it is used to create a Course document

/*

Example Course structure:

   {
		"_id": "5d725a4a7b292f5f8ceff789",
		"title": "Front End Web Development",
		"description": "This course will provide you with all of the essentials to become a successful frontend web developer. You will learn to master HTML, CSS and front end JavaScript, along with tools like Git, VSCode and front end frameworks like Vue",
		"weeks": 8,
		"tuition": 8000,
		"minimumSkill": "beginner",
		"scholarhipsAvailable": true,
		"bootcamp": "5d713995b721c3bb38c1f5d0",
		"user": "5d7a514b5d2c12c7449be045"
    }
        
  */

import { isBoolean, isNonEmptyString, isNumber } from "../utils/helpers.js";

// DTO representing the expected request body for creating a Course
// Enforces the same constraints defined in the mongoose schema
export class CreateCourseDTO {
  title: string;

  description: string;
  weeks: number;
  tuition: number;
  minimumSkill: string;
  scholarhipsAvailable: boolean;
  // bootcamp will be passed in via the request's parameters
  // controller will handle its validation
  // bootcamp: string;
  // will come back to this once user schema has been implemented
  //   user: mongoose.Schema.ObjectId;

  // Constructor receives raw request body data
  // Uses Partial to allow missing optional fields
  constructor(data: Partial<CreateCourseDTO>) {
    if (!isNonEmptyString(data.title)) {
      throw new Error("Please add a title");
    }

    // Trim whitespace to prevent storing accidental leading/trailing spaces
    const title = data.title.trim();
    this.title = title;

    if (!isNonEmptyString(data.description)) {
      throw new Error("Please add a description");
    }

    // Trim whitespace to prevent storing accidental leading/trailing spaces
    const description = data.description.trim();
    this.description = description;

    if (!isNonEmptyString(data.minimumSkill)) {
      throw new Error("Please add a valid minimum skill level");
    }

    // Ensure minimumSkill matches one of the allowed enum values
    if (
      data.minimumSkill !== "beginner" &&
      data.minimumSkill !== "intermediate" &&
      data.minimumSkill !== "advanced"
    ) {
      throw new Error(
        "Please add a valid minimum skill level: beginner, intermediate, or advanced"
      );
    }

    this.minimumSkill = data.minimumSkill;

    if (!isNumber(data.weeks)) {
      throw new Error(
        "Please add a number for duration in weeks of this course"
      );
    }
    this.weeks = data.weeks;

    if (!isNumber(data.tuition)) {
      throw new Error("Please add a cost for the tuition of this course");
    }
    this.tuition = data.tuition;

    if (data.scholarhipsAvailable !== undefined) {
      if (!isBoolean(data.scholarhipsAvailable)) {
        throw new Error("scholarhipsAvailable must be a boolean");
      }
      this.scholarhipsAvailable = data.scholarhipsAvailable;
    } else {
      // Default to false if scholarshipsAvailable is not provided
      this.scholarhipsAvailable = false;
    }

    // if (!isNonEmptyString(data.bootcamp)) {
    //   throw new Error("Please enter an id for a bootcamp");
    // }

    // // Trim whitespace to prevent storing accidental leading/trailing spaces
    // const bootcampId = data.bootcamp.trim();
    // this.bootcamp = bootcampId;
  }
}
