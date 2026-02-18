// MongoDB module
import mongoose, { Schema, model } from "mongoose";

import type { UserType } from "../types/user.interface.js";

// Import the Mongoose document type for proper `this` typing
import type { HydratedDocument } from "mongoose";

import bcrypt from "bcryptjs";

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
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Encrypt password using bcrypt

// Pre-save middleware that hashes the user's password
// Runs automatically whenever a user document is saved

userSchema.pre("save", async function () {
  // `this` refers to the document being saved
  const user = this as HydratedDocument<UserType>;

  // Only hash if password was modified
  // Prevents re-hashing when updating other fields
  if (!user.isModified("password")) return;

  // Generate salt (10 rounds is standard)
  const salt = await bcrypt.genSalt(10);

  // Hash password and replace plaintext value
  user.password = await bcrypt.hash(user.password, salt);
});

// create and export this User model
export const User = model<UserType>("User", userSchema);
