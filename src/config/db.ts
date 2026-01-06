// This file is used to connect to this application's databases

// MongoDB module
import mongoose from "mongoose";

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
  path: path.resolve(__dirname, "./config.env"),
});

// connect to mongoDB database
async function connectToMongoDB() {
  try {
    // "as string" ensures that the Mongo DB URI is a string
    // local host testing
    const conn = await mongoose.connect(process.env.MONGO_DB_URI as string);

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (err) {
    console.error("Error connecting to MongoDB: ", err);
    process.exit(1);
  }
}

export { connectToMongoDB };
