// Import the Express framework for building HTTP servers
import express from "express";

import {
  deleteCourse,
  getCourseById,
  getCourses,
  updateCourse,
} from "../controllers/courses.controller.js";

const router = express.Router();

// Get all courses
router.get("/", getCourses);

// Get course by id
router.get("/:id", getCourseById);

// Update a course
router.patch("/:id", updateCourse);

// Delete a course
router.delete("/:id", deleteCourse);

export default router;
