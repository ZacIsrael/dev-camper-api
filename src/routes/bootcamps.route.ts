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
  uploadBootcampPhoto,
} from "../controllers/bootcamps.controller.js";

import { validateParams } from "../middleware/validate.middleware.js";
import { IdParamDTO, BootcampIdParamDTO } from "../dtos/params.dto.js";

import { addCourse, getCourses } from "../controllers/courses.controller.js";

import { protect, authorize } from "../middleware/auth.middleware.js";
import { addReview, getReviews } from "../controllers/reviews.controller.js";

const router = express.Router();

// Get all bootcamps
router.get("/", getBootcamps);

// Get all bootcamps within a certain distance (mile radius) of a zipcode
router.get("/radius/:zipcode/:distance", getBootcampsWithinARadius);

// Get a bootcamp with a specific id
router.get("/:id", validateParams(IdParamDTO), getBootcampById);

// Get all courses that belong to a certain bootcamp
router.get(
  "/:bootcampId/courses",
  validateParams(BootcampIdParamDTO),
  getCourses
);

// Get all reviews that belong to a certain bootcamp
router.get(
  "/:bootcampId/reviews",
  validateParams(BootcampIdParamDTO),
  getReviews
);

// add a course to a certain bootcamp
router.post(
  "/:bootcampId/courses",
  validateParams(BootcampIdParamDTO),
  protect,
  authorize("publisher", "admin"),
  addCourse
);

// add a review to a certain bootcamp
router.post(
  "/:bootcampId/reviews",
  validateParams(BootcampIdParamDTO),
  protect,
  addReview
);
// Add a bootcamp
router.post("/", protect, authorize("publisher", "admin"), addBootcamp);

// Replace a bootcamp
router.put("/:id", validateParams(IdParamDTO), protect, authorize("publisher", "admin"), replaceBootcamp);

// Update a bootcamp
router.patch(
  "/:id",
  validateParams(IdParamDTO),
  protect,
  authorize("publisher", "admin"),
  updateBootcamp
);

// Upload a photo to a bootcamp
router.patch(
  "/:id/photo",
  validateParams(IdParamDTO),
  protect,
  authorize("publisher", "admin"),
  uploadBootcampPhoto
);

// Delete a bootcamp
router.delete(
  "/:id",
  validateParams(IdParamDTO),
  protect,
  authorize("publisher", "admin"),
  deleteBootcamp
);

export default router;
