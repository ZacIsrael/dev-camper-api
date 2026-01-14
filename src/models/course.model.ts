import mongoose, {
  Document,
  Schema,
  model,
  type HydratedDocument,
} from "mongoose";
import type { CourseType } from "../types/course.interface.js";

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

// schema for "course" collection
const courseSchema = new Schema<CourseType>({
  title: {
    type: String,
    required: [true, "Please add a title for the course"],
  },
  description: {
    type: String,
    required: [true, "Please add a description"],

    maxLength: [250, "Description can't be longer than 250 characters"],
  },
  weeks: {
    type: Number,
    required: [true, "Please enter a duration for the course (in # of weeks)"],
  },
  tuition: {
    type: Number,
    required: [
      true,
      "Please enter a dollar amount for the cost of this course",
    ],
  },
  minimumSkill: {
    type: String,
    required: true,
    enum: ["beginner", "intermediate", "advanced"],
  },
  scholarhipsAvailable: {
    type: Boolean,
    default: false,
  },
  bootcamp: {
    type: mongoose.Schema.ObjectId,
    required: true,
    ref: "Bootcamp",
  },
  // Will come back to this once I've implemented the User schema
//   user: {
//     type: mongoose.Schema.ObjectId,
//     required: true,
//     ref: "User",
//   },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// create and export this Course model
export const Course = model<CourseType>("Course", courseSchema);
