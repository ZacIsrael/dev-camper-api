// Import the Express framework for building HTTP servers
import express from "express";

import { getReviews, addReview } from "../controllers/reviews.controller.js";

import { protect, authorize } from "../middleware/auth.middleware.js";

const router = express.Router();

// Get all reviews
router.get("/", getReviews);

// Get review by id
// router.get("/:id", getReviewById);

// Update a review
// router.patch("/:id", protect, updateReview);

// Delete a review (only the user the wrote the rview or an admin should be able to delete it)
// router.delete("/:id", protect, deleteReview);

export default router;
