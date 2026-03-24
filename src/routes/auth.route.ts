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
  updatePassword,
  logout,
} from "../controllers/auth.controller.js";

import {
  CreateUserDTO,
  ForgotPasswordDTO,
  LoginDTO,
  UpdatePasswordDTO,
  UpdateUserDTO,
} from "../dtos/user.dto.js";
import { validateBody } from "../middleware/validate.middleware.js";

import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// Register a user
router.post("/register", validateBody(CreateUserDTO), register);

// User can login
router.post("/login", validateBody(LoginDTO), login);

// Log a user out
router.post("/logout", logout);

// Retrieves the user that's currently logged in
router.get("/me", protect, getMe);

// Executed when a user clicks "Forgot password" on the frontend
router.post("/forgotpassword", validateBody(ForgotPasswordDTO), forgotPassword);

// Executed when a user resets their password
router.patch("/resetpassword/:resettoken", resetPassword);

// Executed when a user wants to update their name and/or email
router.patch("/updatedetails", protect, validateBody(UpdateUserDTO), updateDetails);

// Executed when a user wants to update their password
router.patch(
  "/updatepassword",
  protect,
  validateBody(UpdatePasswordDTO),
  updatePassword
);


export default router;
