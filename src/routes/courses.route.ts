// Import the Express framework for building HTTP servers
import express from "express";

import {
  deleteCourse,
  getCourseById,
  getCourses,
  updateCourse,
} from "../controllers/courses.controller.js";

import { UpdateCourseDTO } from "../dtos/course.dto.js";

import {
  validateParams,
  validateQuery,
  validateBody
} from "../middleware/validate.middleware.js";
import { CourseQueryDTO } from "../dtos/query.dto.js";
import { IdParamDTO } from "../dtos/params.dto.js";
import { protect, authorize } from "../middleware/auth.middleware.js";

const router = express.Router();

// Get all courses
router.get("/", validateQuery(CourseQueryDTO), getCourses);

// Get course by id
router.get("/:id", validateParams(IdParamDTO), getCourseById);

// Update a course
router.patch(
  "/:id",
  validateParams(IdParamDTO),
  validateBody(UpdateCourseDTO),
  protect,
  authorize("publisher", "admin"),
  updateCourse
);

// Delete a course
router.delete(
  "/:id",
  validateParams(IdParamDTO),
  protect,
  authorize("publisher", "admin"),
  deleteCourse
);

export default router;
