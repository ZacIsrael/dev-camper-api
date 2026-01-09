import NodeGeocoder from "node-geocoder";

// Loads environment variables from a `.env` file into process.env
// Used for storing sensitive data like database credentials, API keys, etc.
import dotenv from "dotenv";

// Must be called immediately after importing to make env vars available
dotenv.config();

// Import Node.js path utilities for resolving file paths
import path from "node:path";

// Import helper to convert module URL to file path (ESM-compatible)
import { fileURLToPath } from "node:url";

// Convert the current module URL into an absolute file path
const __filename = fileURLToPath(import.meta.url);

// Derive the directory name from the current file path
const __dirname = path.dirname(__filename);

dotenv.config({
  // Resolve the absolute path to config.env
  path: path.resolve(__dirname, "../config/config.env"),
});

// Read provider from env
const provider = process.env.GEOCODER_PROVIDER;

// Fail fast if provider is missing
if (!provider) {
  throw new Error("GEOCODER_PROVIDER is missing");
}

// Read API key from env
const apiKey = process.env.GEOCODER_API_KEY;

// Fail fast if API key is missing
if (!apiKey) {
  throw new Error("GEOCODER_API_KEY is missing");
}

// necessary options for geocoder
const options = {
  provider: provider as NodeGeocoder.Providers,
  apiKey,
  formatter: null,
};

// export geocoder instance
export const geocoder = NodeGeocoder(options);
