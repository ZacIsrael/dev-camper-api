// This interface defines the structure of a Review MongoDB Document.
// In other words, it reflects exactly what a document entry
// looks like in the "reviews" collection in MongoDB.

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

// MongoDB module
import { Document, Schema, Types } from "mongoose";

export interface ReviewType {
  // When creating a Review, _id doesn’t exist yet. But when reading or updating reviews, it will.
  _id: Types.ObjectId;
  // title of teh review
  title: string;
  // the actual review
  text: string;
  // rating of the review (1 - 10)
  rating: number;
  // id of the bootcamp that this review is about
  bootcamp: Types.ObjectId;
  // id of the user that left this review
  user: Types.ObjectId;
}
