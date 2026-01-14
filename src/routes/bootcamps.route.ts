// Import the Express framework for building HTTP servers
import express from "express";
import type { Request, Response } from "express";
import {
  addBootcamp,
  deleteBootcamp,
  getBootcampById,
  getBootcamps,
  getBootcampsWithinARadius,
  replaceBootcamp,
  updateBootcamp,
} from "../controllers/bootcamps.controller.js";
import { addCourse, getCourses } from "../controllers/courses.controller.js";

const router = express.Router();

// Get all bootcamps
router.get("/", getBootcamps);

// Get a bootcamp with a specific id
router.get("/:id", getBootcampById);

// Get all bootcamps within a certain distance (mile radius) of a zipcode
router.get("/radius/:zipcode/:distance", getBootcampsWithinARadius);

// Get all courses that belong to a certain bootcamp
router.get("/:bootcampId/courses", getCourses);

// add a course to a certain bootcamp
router.post("/:bootcampId/courses", addCourse);

// Add a bootcamp
router.post("/", addBootcamp);

// Replace a bootcamp
router.put("/:id", replaceBootcamp);

// Update a bootcamp
router.patch("/:id", updateBootcamp);

// Delete a bootcamp
router.delete("/:id", deleteBootcamp);

export default router;
