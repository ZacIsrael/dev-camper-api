// MongoDB module
import mongoose, { Schema, model } from "mongoose";

import type { UserType } from "../types/user.interface.js";

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

// schema for "users" collection
const userSchema = new Schema<UserType>({
  name: {
    type: String,
    required: [true, "Please add a name"],
    // can't have the same name as another bootcamp document in the collection
    unique: true,
    // remove leading and trailing white space
    trim: true,
    maxLength: [50, "Name can't be longer than 50 characters"],
  },
  email: {
    type: String,
    required: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please add a valid email"],
    // no 2 users/accounts can have the sam email
    unique: true,
  },
  role: {
    type: String,
    required: true,
    enum: ["user", "publisher"],
    default: "user",
  },
  password: {
    type: String,
    required: true,
    minLength: 6,
    // Prevents password from being displayed when
    // a user is retrieved via an API call.
    select: false,
  },
});

// create and export this User model
export const User = model<UserType>("User", userSchema);
