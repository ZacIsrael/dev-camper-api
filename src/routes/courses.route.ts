// Import the Express framework for building HTTP servers
import express from "express";

import { getCourseById, getCourses } from "../controllers/courses.controller.js";


const router = express.Router();

// Get all courses
router.get("/", getCourses);

// Get course by id
router.get("/:id", getCourseById)


export default router;