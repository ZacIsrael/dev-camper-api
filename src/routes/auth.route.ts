// Import the Express framework for building HTTP servers
import express from "express";
import type { Request, Response } from "express";
import {
  register,
  login,
  getMe,
  forgotPassword,
  resetPassword,
  updateDetails,
} from "../controllers/auth.controller.js";
import { addCourse, getCourses } from "../controllers/courses.controller.js";

import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// Register a user
router.post("/register", register);
// User can login
router.post("/login", login);

// Retrieves the user that's currently logged in
router.get("/me", protect, getMe);

// Executed when a user click "Forgot password" on the frontend
router.post("/forgotpassword", forgotPassword);

// Executed when a user resets their password
router.patch("/resetpassword/:resettoken", resetPassword);

// Executed when a user wants to update their name and/or email
router.patch("/updatedetails", protect, updateDetails);

export default router;
