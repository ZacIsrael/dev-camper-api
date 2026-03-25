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
import { IdParamDTO } from "../dtos/params.dto.js";
import {
  validateParams,
  validateQuery,
} from "../middleware/validate.middleware.js";
import { authorize, protect } from "../middleware/auth.middleware.js";
import { UserQueryDTO } from "../dtos/query.dto.js";

const router = express.Router();

// Get all users
router.get(
  "/",
  validateQuery(UserQueryDTO),
  protect,
  authorize("admin"),
  getAllUsers
);

// Create a user
router.post("/", protect, authorize("admin"), createUser);

// Get user by id
router.get(
  "/:id",
  validateParams(IdParamDTO),
  protect,
  authorize("admin"),
  getUserById
);

// Update a user
router.patch(
  "/:id",
  validateParams(IdParamDTO),
  protect,
  authorize("admin"),
  updateUser
);

// Delete a user
router.delete(
  "/:id",
  validateParams(IdParamDTO),
  protect,
  authorize("admin"),
  deleteUser
);

export default router;
