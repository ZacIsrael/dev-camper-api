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

// Adds TypeScript awareness for custom static methods on the Course model
interface CourseModel extends mongoose.Model<CourseType> {
  getAverageCost(bootcampId: mongoose.Types.ObjectId): Promise<void>;
}

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
  // User that uploaded the Course
  user: {
    type: mongoose.Schema.ObjectId,
    required: true,
    ref: "User",
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

// Static method to calculate the average course tuition for a given bootcamp
courseSchema.statics.getAverageCost = async function (
  bootcampId: mongoose.Types.ObjectId
): Promise<void> {
  // Log whenever this static method is invoked
  console.log(
    "Course model: getAverageCost() called: bootcampId = ",
    bootcampId
  );

  // Run a MongoDB aggregation pipeline on the Course collection
  const obj = await this.aggregate<{
    _id: mongoose.Types.ObjectId;
    averageCost: number;
  }>([
    {
      // Match only courses that belong to the provided bootcamp ID
      $match: { bootcamp: bootcampId },
    },
    {
      // Group all matched courses by bootcamp ID
      $group: {
        _id: "$bootcamp",
        // Calculate the average value of the tuition field
        averageCost: { $avg: "$tuition" },
      },
    },
  ]);

  // Log the aggregation result for debugging and verification
  console.log("Course model: getAverageCost() called: obj = ", obj);

  try {
    // Get the Bootcamp model from Mongoose's model registry
    // This avoids relying on 'this.model()', which TS may not recognize here
    const Bootcamp = mongoose.model("Bootcamp");

    // If no courses remain, clear/reset averageCost on the bootcamp
    if (!obj.length) {
      await Bootcamp.findByIdAndUpdate(bootcampId, {
        averageCost: undefined, // or 0 if you prefer
      });
      return;
    }

    // Round the average up to the nearest 10 (ex: 8734 -> 8740)
    const roundedAvg = Math.ceil(obj[0].averageCost / 10) * 10;

    // Literal average
    const avg = obj[0].averageCost;

    // Update the bootcamp's stored averageCost field
    await Bootcamp.findByIdAndUpdate(bootcampId, {
      averageCost: avg,
    });
  } catch (err: any) {
    console.log("Course model: getAverageCost() called: err =", err);
  }
};

// Generate average cost (getAverageCost()) after a course has been saved
courseSchema.post("save", async function (this: CourseType) {
  // `this` is the saved Course DOCUMENT instance
  // The document has a `bootcamp` ObjectId that tells us which bootcamp it belongs to
  const bootcampId = this.bootcamp;

  // Call the static method directly on the Course MODEL
  // This avoids using `this.constructor`, which TypeScript types as just `Function`
  await Course.getAverageCost(bootcampId);
});

// Re-calculate average cost AFTER a course has been removed
// Query middleware that runs AFTER 'findOneAndDelete()' / 'findByIdAndDelete()'
courseSchema.post("findOneAndDelete", async function (doc) {
  // In a post query hook, 'doc' is the Course document that was deleted
  // If nothing was deleted, 'doc' will be null
  if (!doc?.bootcamp) return;

  // Now the course is already gone from the DB,
  // so aggregation will compute the NEW correct average
  await Course.getAverageCost(doc.bootcamp);
});

// create and export this Course model
// export const Course = model<CourseType>("Course", courseSchema);
export const Course = model<CourseType, CourseModel>("Course", courseSchema);
