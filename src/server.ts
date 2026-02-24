// Import the Express framework for building HTTP servers
import express from "express";
import type { Application, Request, Response, NextFunction } from "express";

import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";

// Used for styling messages that are logged to the console.
import colors from "colors";

import cookieParser from "cookie-parser";

// Import dotenv to load environment variables from a file
import dotenv from "dotenv";

// Import Node.js path utilities for resolving file paths
import path from "node:path";

// Express middleware used to parse and handle incoming file upload requests
// (multipart/form-data) and expose uploaded files on `req.files`
import fileUpload from "express-fileupload";

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
import coursesRouter from "./routes/courses.route.js";
import authRouter from "./routes/auth.route.js";
import usesrRouter from "./routes/users.route.js";
import reviewsRouter from "./routes/reviews.route.js";

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

// Set secure HTTP headers
app.use(helmet());

// app.use(logger);

// Enable JSON body parsing for incoming requests
app.use(express.json());

// Middleware that parses cookies from incoming HTTP requests
// and makes them available on req.cookies
app.use(cookieParser());

// Sanitize request data to prevent NoSQL operator injection
app.use((req, res, next) => {
  mongoSanitize.sanitize(req.body);
  mongoSanitize.sanitize(req.query);
  mongoSanitize.sanitize(req.params);
  next();
});

// Read PORT from environment variables or fall back to 8000
const PORT = Number(process.env.PORT) || 8000;

const API_VERSION = 1;

// Register file upload middleware to handle multipart/form-data requests
// This parses incoming file uploads and attaches them to 'req.files'
// so uploaded files can be accessed in controllers and route handlers
app.use(fileUpload());

// Configure Express to serve static files (such as uploaded photos)
// from the root-level 'public' directory
app.use(express.static(path.join(__dirname, "../public")));

// mount the routes
app.use(`/api/v${API_VERSION}/bootcamps`, bootcampsRouter);
app.use(`/api/v${API_VERSION}/courses`, coursesRouter);
app.use(`/api/v${API_VERSION}/auth`, authRouter);
app.use(`/api/v${API_VERSION}/users`, usesrRouter);
app.use(`/api/v${API_VERSION}/reviews`, reviewsRouter);

// use custom error handler middleware
app.use(errorHandler);

// default GET route
app.get("/", (req: Request, res: Response): void => {
  res.send("Welcome to the Dev Camper API!");
});

// Start the server and listen for incoming connections
app.listen(PORT, () => {
  // Log confirmation that the server is running
  console.log(
    `Server running in ${process.env.NODE_ENV} mode on port ${PORT}`.yellow.bold
  );
});
