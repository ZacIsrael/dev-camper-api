// Import Node.js file system module for reading JSON files
import fs from "node:fs";

// Import Mongoose for MongoDB connection and operations
import mongoose from "mongoose";

// Import colors to style console output
import colors from "colors";

// Import dotenv to load environment variables
import dotenv from "dotenv";

// Import path utilities for resolving file paths
import path from "node:path";

// Import helper to convert module URL to a file path (ESM)
import { fileURLToPath } from "node:url";

// Import MongoDB connection helper
// import { connectToMongoDB } from "./config/db.js";

// Convert the current module URL into an absolute file path
const __filename: string = fileURLToPath(import.meta.url);

// Derive the directory name from the current file path
const __dirname: string = path.dirname(__filename);

// Load environment variables from the config file
dotenv.config({
  // Resolve the absolute path to config.env
  path: path.resolve(__dirname, "./config/config.env"),
});

// Import the Bootcamp Mongoose model
import { Bootcamp } from "./models/bootcamp.model.js";
import type { BootcampType } from "./types/bootcamp.interface.js";

// Import the Course Mongoose model
import { Course } from "./models/course.model.js";
import type { CourseType } from "./types/course.interface.js";


// Establish a connection to MongoDB using the environment variable
await mongoose.connect(process.env.MONGO_DB_URI as string);

// Read and parse the bootcamps JSON seed file
const bootcamps: BootcampType[] = JSON.parse(
  // Read the file contents as UTF-8 text
  fs.readFileSync(`${__dirname}/../_data/bootcamps.json`, "utf-8")
);

// Read and parse the courses JSON seed file
const courses: CourseType[] = JSON.parse(
  // Read the file contents as UTF-8 text
  fs.readFileSync(`${__dirname}/../_data/courses.json`, "utf-8")
);

// Define an async function to import seed data
const importData = async (): Promise<void> => {
  try {
    // Insert bootcamp documents into the database
    await Bootcamp.create(bootcamps);

    // Insert course documents into the database
    // await Course.create(courses);

    // Log success message to the console
    console.log("Data imported....".green);

    // Exit the Node.js process successfully
    process.exit(0);
  } catch (err: unknown) {
    // Log any errors that occur during import
    console.error("Error importing data into database:", err);

    // Exit the process with a failure code
    process.exit(1);
  }
};

// Define an async function to import seed data
const deleteData = async (): Promise<void> => {
  try {
    // Delete bootcamp documents from the database
    await Bootcamp.deleteMany();

    // Delete course documents from the database
    // await Course.deleteMany();

    // Log success message to the console
    console.log("Data deleted....".red);

    // Exit the Node.js process successfully
    process.exit(0);
  } catch (err: unknown) {
    // Log any errors that occur during import
    console.error("Error deleting data from database:", err);

    // Exit the process with a failure code
    process.exit(1);
  }
};

if (process.argv[2] === "-i") {
  // npx tsx ./src/seeder.ts -i
  // Execute the data import function
  importData();
} else if (process.argv[2] === "-d") {
  // npx tsx ./src/seeder.ts -d
  // Execute data delete function
  deleteData();
}
