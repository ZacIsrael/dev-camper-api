// This file handles the interaction between the API & the review collection in MongoDB

import { Review } from "../models/review.model.js";
import type { Pagination } from "../types/pagination.interface.js";
import type { ReviewType } from "../types/review.interface.js";

export const reviewService = {
  // dto parameter is of type CreateReviewDTO (see reviewe.dto.ts)
  // this function returns a promise that has the structure of ReviewType (course interface)

  async createReview(dto: any): Promise<ReviewType | null> {
    // creates a review MongoDB document with cleaned up parameters passed in
    // from the data transfer object (dto) from course.dto.ts

    const review = new Review({
      title: dto.title,
      text: dto.text,
      rating: dto.rating,
      // user that uploaded the review
      user: dto.user,
      // bootcamp that this review belongs
      bootcamp: dto.bootcamp,
    });

    // create the new review db document
    return await review.save();
  },

  // Returns a promise that has an array of elements with the ReviewType structure
  async getAllReviews(
    filter: any,
    select: any,
    sortBy: any,
    paginationObj: any
  ): Promise<{ reviews: ReviewType[]; pagination: Pagination }> {
    // Retrieves all of the review documents from the reviews MongoDB collection

    // Build a separate query to calculate the total number of matching reviews
    // This is used strictly for pagination metadata (next / prev)
    let total = Review.find(filter);

    // Apply the same select/sort options to keep counts consistent with the main query
    if (select) total.select(select);
    if (sortBy) total.sort(sortBy);

    // Total number of reviews that match the filter (ignores pagination)
    const totalCount = await total.countDocuments();

    // Main query used to retrieve the actual review documents
    let query = Review.find(filter);

    // Apply field selection if provided
    if (select) query.select(select);

    // Apply sorting if provided
    if (sortBy) query.sort(sortBy);

    // Calculate the index of the last document on the current page
    const endIndex = paginationObj.page * paginationObj.limit;

    // paginationObj.skip is the same as the start index
    if (paginationObj?.skip >= 0) query.skip(paginationObj.skip);
    if (paginationObj?.limit > 0) query.limit(paginationObj.limit);

    // Execute the query and retrieve review results.
    // populate() allows for the entire bootcamp (and user) to be
    // returned instead of only returning its id.
    const reviews = await query
      .populate({
        // NOTE: the schema field is currently named "bootcamp" in review.model.ts
        path: "bootcamp",
        // only display the following fields from the bootcamp document
        select: "name description",
      })
      .populate({
        path: "user",
        // keep it minimal; controllers can override if needed
        select: "name email",
      });

    // Initialize pagination response object
    const resultPagination: Pagination = {
      next: undefined,
      prev: undefined,
    };

    // Determine if a next page exists
    if (endIndex < totalCount) {
      resultPagination.next = {
        page: paginationObj.page + 1,
        limit: paginationObj.limit,
      };
    }

    // Determine if a previous page exists
    if (paginationObj.skip > 0) {
      resultPagination.prev = {
        page: paginationObj.page - 1,
        limit: paginationObj.limit,
      };
    }

    // Return review results along with pagination metadata
    return { reviews, pagination: resultPagination };
  },

  // Retrieves a review with a given id
  async getReviewById(id: string): Promise<ReviewType | null> {
    const review = await Review.findById(id);

    // Return retrieved review
    // If it's null, that means it does not exist; gets handled in the controller
    return review;
  },

  // Updates a review with a given id
  async updateReviewById(
    id: string,
    body: Record<string, any>
  ): Promise<ReviewType | null> {
    // Finds a review by ID and applies partial updates from the request body
    // Returns the updated document instead of the original
    const review = await Review.findByIdAndUpdate(id, body, {
      new: true,
      // Ensures mongoose schema validators run on the update
      runValidators: true,
    });

    // Returns the updated review document
    // Null indicates the review was not found (handled in controller)
    return review;
  },

  // Deletes a review with a given id
  async deleteReviewById(id: string): Promise<ReviewType | null> {
    // Returns the deleted review or null if it never existed
    return await Review.findByIdAndDelete(id);
  },
};
