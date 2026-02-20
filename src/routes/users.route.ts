// Routes for admins (retrieving users)

// Import the Express framework for building HTTP servers
import express from "express";
import {
  createUser,
  deleteUser,
  getAllUsers,
  getUserById,
  updateUser,
} from "../controllers/users.controller.js";
import { authorize, protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// Get all users
router.get("/", protect, authorize("admin"), getAllUsers);

// Create a user
router.post("/", protect, authorize("admin"), createUser);

// Get user by id
router.get("/:id", protect, authorize("admin"), getUserById);

// Update a user
router.patch("/:id", protect, authorize("admin"), updateUser);

// Delete a user
router.delete("/:id", protect, authorize("admin"), deleteUser);

export default router;
