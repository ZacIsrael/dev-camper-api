// Import the Express framework for building HTTP servers
import express from "express";
import type { Application, Request, Response, NextFunction } from "express";

// Used for styling messages that are logged to the console.
import colors from "colors";

// Import dotenv to load environment variables from a file
import dotenv from "dotenv";

// Import Node.js path utilities for resolving file paths
import path from "node:path";

// Import helper to convert module URL to file path (ESM-compatible)
import { fileURLToPath } from "node:url";

// import morgan middleware logger
import morgan from "morgan";

// custom error handler middleware
import { errorHandler } from "./middleware/error.middleware.js";

import { connectToMongoDB } from "./config/db.js";
// import custom middleware logger function
// import { logger } from "./middleware/auxillary.middleware.js";

// import routes
import bootcampsRouter from "./routes/bootcamps.route.js";

// Convert the current module URL into an absolute file path
const __filename = fileURLToPath(import.meta.url);

// Derive the directory name from the current file path
const __dirname = path.dirname(__filename);

// Load environment variables from a custom config file
dotenv.config({
  // Resolve the absolute path to config.env
  path: path.resolve(__dirname, "./config/config.env"),
});

// connect to the MongoDB database
connectToMongoDB();

// Create an Express application instance
const app: Application = express();

if (process.env.NODE_ENV === "development") {
  // development logging middleware
  app.use(morgan("dev"));
}

// app.use(logger);

// Enable JSON body parsing for incoming requests
app.use(express.json());

// Read PORT from environment variables or fall back to 8000
const PORT = Number(process.env.PORT) || 8000;

const API_VERSION = 1;

// mount the routes
app.use(`/api/v${API_VERSION}/bootcamps`, bootcampsRouter);

// use custom error handler middleware
app.use(errorHandler);

// default GET route
app.get("/", (req: Request, res: Response): void => {
  res.send("Welcome to the Dev Camper API!");
});

// Start the server and listen for incoming connections
app.listen(PORT, () => {
  // Log confirmation that the server is running
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`.yellow.bold);
});
