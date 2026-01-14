// Import the Express framework for building HTTP servers
import express from "express";

import { getCourses } from "../controllers/courses.controller.js";


const router = express.Router();

// Get all courses
router.get("/", getCourses);


export default router;