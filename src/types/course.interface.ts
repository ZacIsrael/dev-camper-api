// This interface defines the structure of a Course MongoDB Document.
// In other words, it reflects exactly what a document entry
// looks like in the "course" collection in MongoDB.

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

// MongoDB module
import mongoose, { Document, Schema } from "mongoose";

export interface CourseType extends Document {
  // When creating a Course, _id doesn’t exist yet. But when reading or updating documents, it will.
  _id: mongoose.Types.ObjectId;
  title: string;

  description: string;
  weeks: number;
  tuition: number;
  // enum: "beginner" or "intermediate"
  minimumSkill: string;
  scholarhipsAvailable: boolean;
  // id of a valid bootcamp
  bootcamp: mongoose.Types.ObjectId;
  // id of a valid user; Will come back to this once I've implemented the User schema
  //   user: mongoose.Types.ObjectId;

  createdAt: Date;
}
