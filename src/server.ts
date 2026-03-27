// Import the Express framework for building HTTP servers
import express from "express";
import type { Application, Request, Response, NextFunction } from "express";

import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import rateLimit from "express-rate-limit";
import hpp from "hpp";
import cors from "cors";

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

// import custom middleware to prevent csrf
import { csrfProtection } from "./middleware/csrf.middleware.js";

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

// Limit each IP to 100 requests per 15 minutes
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  // return rate limit info in headers
  standardHeaders: true,
  legacyHeaders: false,
});

if (process.env.NODE_ENV === "development") {
  // development logging middleware
  app.use(morgan("dev"));
}

// Set secure HTTP headers
// app.use(helmet());
// Apply Helmet middleware with custom security configuration (adds secure HTTP headers)
app.use(
  helmet({
    // Configure Content Security Policy (CSP) to restrict what resources the browser can load
    contentSecurityPolicy: {
      directives: {
        // Default rule: only allow resources from this server (same origin)
        defaultSrc: ["'self'"],

        // Only allow JavaScript to be executed if it comes from this server
        scriptSrc: ["'self'"],

        // Allow styles from this server and inline styles (needed for some setups, but less secure)
        styleSrc: ["'self'", "'unsafe-inline'"],

        // Allow images from this server and base64-encoded images (data URLs)
        imgSrc: ["'self'", "data:"],

        // Allow fonts from this server and embedded (base64) fonts
        fontSrc: ["'self'", "data:"],

        // Restrict API/fetch/AJAX/WebSocket requests to this server only
        connectSrc: ["'self'"],

        // Block all plugins like Flash, Java applets (prevents legacy injection attacks)
        objectSrc: ["'none'"],

        // Prevent this app from being embedded in iframes (protects against clickjacking)
        frameAncestors: ["'none'"],

        // Restrict the base URL for relative links to this origin only
        baseUri: ["'self'"],

        // Only allow form submissions to this server
        formAction: ["'self'"],

        // Automatically upgrade HTTP requests to HTTPS (if applicable)
        upgradeInsecureRequests: [],
      },
    },

    // Disable strict cross-origin isolation (avoids issues in development environments)
    crossOriginEmbedderPolicy: false,
  })
);

// Enable Cross-Origin Resource Sharing (CORS)
// Allows frontend apps from different origins to
// communicate with this API
// app.use(cors());

// If I had a frontend app to connect to this api,
// this is how it would be done:

// Specifies which client origins are allowed to send requests
// to this API and enables cookies / auth headers to be included
// in cross-origin requests.
// Prevents random websites from hitting the API
app.use(
  cors({
    // frontend url goes here
    origin: ["http://localhost:3000"],
    // allow cookies and Authorization headers
    credentials: true,
  })
);

// app.use(logger);

// Apply rate limiting to all requests
app.use(limiter);

// Enable JSON body parsing for incoming requests
// and reject oversized payloads early.
app.use(express.json({ limit: "10kb" }));

// Parse URL-encoded form bodies and reject oversized payloads early.
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

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

// Prevent HTTP Parameter Pollution
app.use(hpp());

// Read PORT from environment variables or fall back to 8000
const PORT = Number(process.env.PORT) || 8000;

const API_VERSION = 1;

// Register file upload middleware to handle multipart/form-data requests
// This parses incoming file uploads and attaches them to 'req.files'
// so uploaded files can be accessed in controllers and route handlers
// app.use(fileUpload());

app.use(
  fileUpload({
    // Limit file size globally to 5MB (prevents large payload attacks)
    limits: { fileSize: 5 * 1024 * 1024 },

    // Automatically reject requests that exceed limits
    abortOnLimit: true,

    // Strip unsafe characters from filenames
    safeFileNames: true,

    // Message sent if the file is too large
    responseOnLimit: "File size limit exceeded",

    // Preserve file extensions while sanitizing names
    preserveExtension: true,

    // if necessary, create an upload foldder
    createParentPath: true,
  })
);

// Apply CSRF protection middleware globally to block unauthorized state-changing requests
// Enforces same-site/origin checks and requires a custom CSRF header for added security
app.use(csrfProtection);

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
