// This interface defines the structure of a User MongoDB Document.
// In other words, it reflects exactly what a document entry
// looks like in the "users" collection in MongoDB.

/*

    Example User structure:

    {
		"_id": "5d7a514b5d2c12c7449be042",
		"name": "Admin Account",
		"email": "admin@gmail.com",
		"role": "user",
		"password": "123456"
	}

*/

// MongoDB module
import mongoose, { Document, Schema } from "mongoose";

export interface UserType extends Document {
  // When creating a User, _id doesn’t exist yet. But when reading or updating users, it will.
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  // enum: "user" or "publisher"
  role: string;
  password: string;
  resetPasswordToken: string;
  resetPasswordExpire: Date;
  createdAt: Date;
}
