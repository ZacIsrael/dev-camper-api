// Import the Express framework for building HTTP servers
import express from "express";

import {
  getReviews,
  addReview,
  updateReview,
  getReviewById,
  deleteReview,
} from "../controllers/reviews.controller.js";

import { validateParams } from "../middleware/validate.middleware.js";
import { IdParamDTO } from "../dtos/params.dto.js";

import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// Get all reviews
router.get("/", getReviews);

// Get review by id
router.get("/:id", validateParams(IdParamDTO), getReviewById);

// Update a review
router.patch("/:id", validateParams(IdParamDTO), protect, updateReview);

// Delete a review (only the user that wrote the review or an admin should be able to delete it)
router.delete("/:id", validateParams(IdParamDTO), protect, deleteReview);

export default router;
