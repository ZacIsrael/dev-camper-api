// Import the Express framework for building HTTP servers
import express from "express";

// Import dotenv to load environment variables from a file
import dotenv from "dotenv";

// Import Node.js path utilities for resolving file paths
import path from "node:path";

// Import helper to convert module URL to file path (ESM-compatible)
import { fileURLToPath } from "node:url";

// Convert the current module URL into an absolute file path
const __filename = fileURLToPath(import.meta.url);

// Derive the directory name from the current file path
const __dirname = path.dirname(__filename);

// Load environment variables from a custom config file
dotenv.config({
  // Resolve the absolute path to config.env
  path: path.resolve(__dirname, "../config/config.env"),
});

// Create an Express application instance
const app = express();

// Default GET route
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      id: 0,
    },
  });
});

// Enable JSON body parsing for incoming requests
app.use(express.json());

// Read PORT from environment variables or fall back to 8000
const PORT = Number(process.env.PORT) || 8000;

// Start the server and listen for incoming connections
app.listen(PORT, () => {
  // Log confirmation that the server is running
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
