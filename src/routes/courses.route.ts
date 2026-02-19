// Import the Express framework for building HTTP servers
import express from "express";

import {
  deleteCourse,
  getCourseById,
  getCourses,
  updateCourse,
} from "../controllers/courses.controller.js";

import { protect } from "../middleware/auth.middleware.js";


const router = express.Router();

// Get all courses
router.get("/", getCourses);

// Get course by id
router.get("/:id", getCourseById);

// Update a course
router.patch("/:id", protect, updateCourse);

// Delete a course
router.delete("/:id", protect, deleteCourse);

export default router;
