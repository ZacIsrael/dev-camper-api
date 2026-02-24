import type { ReviewType } from "../types/review.interface.js";
import mongoose, {
  Document,
  Schema,
  model,
  type HydratedDocument,
} from "mongoose";
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
    maxLength: 100
  },
  text: {
    type: String,
    required: [true, "Please add text for the body of this review"],

  },
  rating: {
    type: Number,
    required: [true, "Please give this review a rating (1-10)"],
    min: 1,
    max: 10
  },
  bootcmap: {
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

export const Review = model<ReviewType>("Review", reviewSchema);
