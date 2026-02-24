import type { ReviewType } from "../types/review.interface.js";
import mongoose, {
  Document,
  Schema,
  model,
  type HydratedDocument,
} from "mongoose";

// Adds TypeScript awareness for custom static methods on the Course model
interface ReviewModel extends mongoose.Model<ReviewType> {
  getAverageRating(bootcampId: mongoose.Types.ObjectId): Promise<void>;
}
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

// schema for "reviews" collection
const reviewSchema = new Schema<ReviewType>({
  title: {
    type: String,
    required: [true, "Please add a title for this review"],
    maxLength: 100,
  },
  text: {
    type: String,
    required: [true, "Please add text for the body of this review"],
  },
  rating: {
    type: Number,
    required: [true, "Please give this review a rating (1-10)"],
    min: 1,
    max: 10,
  },
  bootcamp: {
    type: mongoose.Schema.ObjectId,
    required: true,
    ref: "Bootcamp",
  },
  user: {
    type: mongoose.Schema.ObjectId,
    required: true,
    ref: "User",
  },
});

// Create a compound unique index to ensure a user can only submit one review per bootcamp
reviewSchema.index({ bootcamp: 1, user: 1 }, { unique: true });

// Static method to calculate the average course tuition for a given bootcamp
reviewSchema.statics.getAverageRating = async function (
  bootcampId: mongoose.Types.ObjectId
): Promise<void> {
  // Log whenever this static method is invoked
  console.log(
    "Review model: getAverageRating() called: bootcampId = ",
    bootcampId
  );

  // Run a MongoDB aggregation pipeline on the Review collection
  const obj = await this.aggregate<{
    _id: mongoose.Types.ObjectId;
    averageRating: number;
  }>([
    {
      // Match only reviews that belong to the provided bootcamp ID
      $match: { bootcamp: bootcampId },
    },
    {
      // Group all matched reviews by bootcamp ID
      $group: {
        _id: "$bootcamp",
        // Calculate the average value of the rating field
        averageRating: { $avg: "$rating" },
      },
    },
  ]);

  // Log the aggregation result for debugging and verification
  console.log("Review model: getAverageRating() called: obj = ", obj);

  try {
    // Get the Bootcamp model from Mongoose's model registry
    // This avoids relying on 'this.model()', which TS may not recognize here
    const Bootcamp = mongoose.model("Bootcamp");

    // If no courses remain, clear/reset averageRating on the bootcamp
    if (!obj.length) {
      await Bootcamp.findByIdAndUpdate(bootcampId, {
        averageRating: undefined,
      });
      return;
    }

    // Round the average up to the nearest 10 (ex: 8734 -> 8740)
    const roundedAvg = Math.ceil(obj[0].averageRating / 10) * 10;

    // Literal average
    const avg = obj[0].averageRating;

    // Update the bootcamp's stored averageRating field
    await Bootcamp.findByIdAndUpdate(bootcampId, {
      averageRating: avg,
    });
  } catch (err: any) {
    console.log("Review model: getAverageRating() called: err =", err);
  }
};

// Generate average rating (getAverageRating()) after a review has been saved
reviewSchema.post("save", async function (this: ReviewType) {
  // `this` is the saved Course DOCUMENT instance
  // The document has a `bootcamp` ObjectId that tells us which bootcamp it belongs to
  const bootcampId = this.bootcamp;

  // Call the static method directly on the Review MODEL
  // This avoids using `this.constructor`, which TypeScript types as just `Function`
  await Review.getAverageRating(bootcampId);
});

// Re-calculate average cost AFTER a review has been removed
// Query middleware that runs AFTER 'findOneAndDelete()' / 'findByIdAndDelete()'
reviewSchema.post("findOneAndDelete", async function (doc) {
  if (!doc?.bootcamp) return;

  await Review.getAverageRating(doc.bootcamp);
});
export const Review = model<ReviewType, ReviewModel>("Review", reviewSchema);
