// MongoDB module
import mongoose, { Schema, model, Model } from "mongoose";

import crypto from "crypto";

import type { UserType } from "../types/user.interface.js";

// Import the Mongoose document type for proper `this` typing
import type { HydratedDocument } from "mongoose";

// Instance methods that exist on a hydrated user document
export type UserMethods = {
  // Returns signed JWT string
  getSignedJwtToken(): string;

  // Compares entered password with hashed password
  matchPassword(enteredPassword: string): Promise<boolean>;

  // Generates a reset token; used for resetting password
  getResetPasswordToken(): string;
};

// The actual document type returned by Mongoose (fields + methods)
export type UserDocument = HydratedDocument<UserType, UserMethods>;

type UserModel = Model<UserType, {}, UserMethods>;

import bcrypt from "bcryptjs";

// Import the jwt module which contains sign function
import jwt from "jsonwebtoken";

// Import jwt types for proper TypeScript safety
import type { Secret, SignOptions } from "jsonwebtoken";

// Loads environment variables from a `.env` file into process.env
// Used for storing sensitive data like database credentials, API keys, etc.
import dotenv from "dotenv";

// Import Node.js path utilities for resolving file paths
import path from "node:path";

// Import helper to convert module URL to file path (ESM-compatible)
import { fileURLToPath } from "node:url";

// Must be called immediately after importing to make env vars available
dotenv.config();

// Convert the current module URL into an absolute file path
const __filename = fileURLToPath(import.meta.url);

// Derive the directory name from the current file path
const __dirname = path.dirname(__filename);

// Load environment variables from custom config env file
dotenv.config({
  // Resolve the absolute path to config.env
  path: path.resolve(__dirname, "../config/config.env"),
});

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
const userSchema = new Schema<UserType, UserModel, UserMethods>({
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
    enum: ["user", "publisher", "admin"],
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
  const user = this as UserDocument;

  // Only hash if password was modified
  // Prevents re-hashing when updating other fields
  if (!user.isModified("password")) return;

  // Generate salt (10 rounds is standard)
  const salt = await bcrypt.genSalt(10);

  // Hash password and replace plaintext value
  user.password = await bcrypt.hash(user.password, salt);
});

// Sign JWT token and return
userSchema.methods.getSignedJwtToken = function (): string {
  // Pull secret from env
  const jwtSecret = process.env.JWT_SECRET;

  // Fail fast if missing (prevents sign() overload issues)
  if (!jwtSecret) {
    throw new Error("JWT_SECRET is not defined in environment variables");
  }

  // Pull expiry from env and provide a safe default
  const expiresIn: SignOptions["expiresIn"] = (process.env.JWT_EXPIRES_IN ??
    "1d") as SignOptions["expiresIn"];

  // Return the signed token
  return jwt.sign({ id: this._id.toString() }, jwtSecret as Secret, {
    expiresIn,
  });
};

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (
  enteredPassword: string
): Promise<boolean> {
  // `this` is the hydrated user document
  const user = this as UserDocument;

  // Compare plaintext password with hashed password
  return await bcrypt.compare(enteredPassword, user.password);
};

// Generate and hash password token
userSchema.methods.getResetPasswordToken = function () {
  // Generate token
  const resetToken = crypto.randomBytes(20).toString("hex");

  // Hash token and set to resetPasswordToken field
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // Set expiration of token to 10 minutes (user has 10 minutes to
  // reset their password before thye'll have to generate another hash
  // by clicking "forgot password" on the front end)
  this.resetPasswordExpire = new Date(Date.now() + 10 * 60 * 1000);

  // Return non-hashed token (what gets emailed to the user)
  return resetToken;
};

// create and export this User model
// export const User = model<UserType>("User", userSchema);
export const User = model<UserType, UserModel>("User", userSchema);
