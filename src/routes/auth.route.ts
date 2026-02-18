// Import the Express framework for building HTTP servers
import express from "express";
import type { Request, Response } from "express";
import {
  register,
  login
} from "../controllers/auth.controller.js";
import { addCourse, getCourses } from "../controllers/courses.controller.js";

const router = express.Router();

// Register a user
router.post("/register", register);
// User can login 
router.post("/login", login);

export default router;