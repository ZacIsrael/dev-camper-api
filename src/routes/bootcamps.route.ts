// Import the Express framework for building HTTP servers
import express from "express";
import type { Request, Response } from "express";
import {
  addBootcamp,
  deleteBootcamp,
  getBootcampById,
  getBootcamps,
  replaceBootcamp,
  updateBootcamp,
} from "../controllers/bootcamps.controller.js";

const router = express.Router();

// Get all bootcamps
router.get("/", getBootcamps);

// Get a bootcamp with a specific id
router.get("/:id", getBootcampById);

// Add a bootcamp
router.post("/", addBootcamp);

// Replace a bootcamp
router.put("/:id", replaceBootcamp);

// Update a bootcamp
router.patch("/:id", updateBootcamp);

// Delete a bootcamp
router.delete("/:id", deleteBootcamp);

export default router;
