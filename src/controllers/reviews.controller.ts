import type { Request, Response, NextFunction } from "express";
import { asyncHandler } from "../middleware/async.middleware.js";
import { isNonEmptyString } from "../utils/helpers.js";

import { reviewService } from "../services/review.service.js";
import { bootcampService } from "../services/bootcamp.service.js";
import { CreateReviewDTO, UpdateReviewDTO } from "../dtos/review.dto.js";
import { ErrorResponse } from "../utils/errorResponse.js";

// GET /api/v1/bootcamps/:bootcampId/reviews route
// GET /api/v1/reviews route
export const getReviews = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    // Only allow filtering on these fields (prevents injection via arbitrary keys)
    const ALLOWED_FILTER_FIELDS = ["title", "rating", "bootcamp", "user"];
    const { query } = req;
    console.log("req.query = ", query);
    // stores returned reviews
    //   let reviews;

    // for /api/v1/bootcamps/:bootcampId/reviews route
    const { bootcampId } = req.params;

    // message returned when reviews are not found
    let emptyReturnMsg = "";

    // message returned when reviews are found
    let foundBootcampMsg = "";

    // copy of req.query object
    const reqQuery = { ...query };

    // Build filter object
    let filter: Record<string, any> = {};

    // Fields to exclude from the request's query strings
    const removeFields = ["select", "sort", "page", "limit"];

    // Loop over removeFields and delete them from reqQuery
    removeFields.forEach((param) => delete reqQuery[param]);

    // debugging
    console.log("req.query after removing certain fileds: ", reqQuery);

    let selectFields = "";
    // Select fields (for what should be returned)
    if (query.select) {
      if (typeof query.select === "string") {
        selectFields = query.select.split(",").join(" ");
      }
      console.log("fields = ", selectFields);
    }

    let sortBy = "";
    // Sort fields (for what the response should be sorted by)
    if (query.sort) {
      if (typeof query.sort === "string") {
        sortBy = query.sort.split(",").join(" ");
      }
      console.log("sortBy = ", sortBy);
    }

    // Pagination
    // Default values
    let page = 1;
    let limit = 25;
    // Page number (for pagination)
    if (query.page) {
      if (typeof query.page === "string") {
        const parsedPage = Number(query.page);

        // Ensure page is a valid positive number
        if (!Number.isNaN(parsedPage) && parsedPage > 0) {
          page = parsedPage;
        }
      }
    }

    // Limit number (number of results per page)
    if (query.limit) {
      if (typeof query.limit === "string") {
        const parsedLimit = Number(query.limit);

        // Ensure limit is a valid positive number
        if (!Number.isNaN(parsedLimit) && parsedLimit > 0) {
          limit = parsedLimit;
        }
      }
    }

    let skip = (page - 1) * limit;

    // pagination object to be passed to the service functions
    let paginationObj = {
      skip,
      page,
      limit,
    };

    if (Object.keys(reqQuery).length > 0) {
      // Only allow these MongoDB-style comparison operators
      const ALLOWED_FILTER_OPERATORS = ["gt", "gte", "lt", "lte", "in"];

      // Safe filter object that will be passed to MongoDB
      const safeFilter: Record<string, any> = {};

      for (const key in reqQuery) {
        // Ignore any field not explicitly allowed
        if (!ALLOWED_FILTER_FIELDS.includes(key)) continue;

        const value = reqQuery[key];

        // Handle operator-based filters like rating[gte]=4
        if (
          typeof value === "object" &&
          value !== null &&
          !Array.isArray(value)
        ) {
          const operatorObj: Record<string, any> = {};

          for (const op in value as Record<string, any>) {
            if (!ALLOWED_FILTER_OPERATORS.includes(op)) continue;

            operatorObj[`$${op}`] = (value as Record<string, any>)[op];
          }

          if (Object.keys(operatorObj).length > 0) {
            safeFilter[key] = operatorObj;
          }
        } else {
          // Direct equality filter
          safeFilter[key] = value;
        }
      }

      filter = safeFilter;

      console.log("safeFilter = ", safeFilter);

      const safeFilterStr = JSON.stringify(safeFilter);

      emptyReturnMsg = `There are no reviews in the 'review' mongoDB collection that match filter = ${safeFilterStr}.`;
      foundBootcampMsg = `Successfully retrieved all reviews from the 'review' mongoDB collection that match the filter = ${safeFilterStr}.`;
    } else {
      // Message shown when the collection exists but contains no courses
      emptyReturnMsg =
        "There are no reviews in the 'review' mongoDB collection.";
      foundBootcampMsg =
        "Successfully retrieved all reviews from the 'review' mongoDB collection.";
    }

    // for /api/v1/bootcamps/:bootcampId/reviews route
    // check to see if bootcampId was passed
    if (bootcampId !== undefined) {
      // ensure that the bootcamp id is a non-empty string
      if (!isNonEmptyString(bootcampId)) {
        throw new ErrorResponse("bootcampId must be a non-empty string", 400);
      }

      // pass the id to the filter: { bootcamp: bootcampId}
      filter.bootcamp = bootcampId;

      // debugging
      console.log(`Bootcamp id ${bootcampId} exists. Filter = `, filter);

      // Message shown when no courses match the applied filters
      emptyReturnMsg = `There are no reviews in the 'review' mongoDB collection that belong to the bootcamp that has an id = ${bootcampId}`;
      foundBootcampMsg = `Successfully retrieved all reviews from the 'review' mongoDB collection that belong to the bootcamp that has an id = ${bootcampId}.`;
    }

    // debugging
    console.log(`Bootcamp id does not exist. Filter = `, filter);

    // Parse the modified query string back into an object
    // and pass it to the service for filtered database retrieval
    const { reviews, pagination } = await reviewService.getAllReviews(
      filter,
      selectFields,
      sortBy,
      paginationObj
    );

    // send response to route
    res.status(200).json({
      success: true,
      count: reviews.length,
      pagination: pagination,
      msg:
        // necessary message gets displayed depending on if the courses collection is empty or not
        reviews.length === 0 ? emptyReturnMsg : foundBootcampMsg,
      reviews,
    });
  }
);

// /api/v1/reviews/:id route
export const getReviewById = asyncHandler(
  async (req: any, res: Response, next: NextFunction) => {
    const { id } = req.params;

    // retrieve the review
    const review = await reviewService.getReviewById(id);

    if (review === null) {
      throw new ErrorResponse(`Review with id = ${id} not found`, 404);
    }

    // return review to the client
    res.status(200).json({
      success: true,
      review,
    });
  }
);

// /api/v1/bootcamps/:bootcampId/reviews route
export const addReview = asyncHandler(
  async (req: any, res: Response, next: NextFunction) => {
    // Might be unnecessary because of middleware that protects routes
    // but you can never be too careful
    if (!req.user.id) {
      throw new ErrorResponse(
        `Review can't be added; No user is logged in`,
        401
      );
    }

    // add logged in user's id to the body of the request
    req.body.user = req.user.id;
    // see what's in the body of the request
    console.log("addReview: req.body = ", req.body);

    const { bootcampId } = req.params;

    if (bootcampId === undefined) {
      return res.status(400).json({
        success: false,
        error:
          "bootcampId must be added as a query parameter: /api/v1/bootcamps/:bootcampId/reviews",
      });
    }

    // ensure that the bootcamp id is a non-empty string
    if (!isNonEmptyString(bootcampId)) {
      throw new ErrorResponse("bootcampId must be a non-empty string", 400);
    }

    // check to see if a bootcamp with _id = bootcampId actually exists
    const bootcamp = await bootcampService.getBootcampById(bootcampId);

    if (bootcamp === null) {
      throw new ErrorResponse(
        `Bootcamp with id = ${bootcampId} not found`,
        404
      );
    }

    if (bootcamp.user.toString() === req.user.id) {
      throw new ErrorResponse(
        `Bootcamp owner can't write a review for their own bootcamp.`,
        403
      );
    }

    // data transfer object (object that will contain the processed request)
    let dto: any;

    // process the body of the request (see review.dto.js)
    dto = new CreateReviewDTO(req.body);
    // bootcampId is retrieved from the request parameters; not the body of the request
    dto.bootcamp = bootcampId;
    console.log("addReview: dto = ", dto);

    // use service to add review
    const review = await reviewService.createReview(dto);
    // send response to route
    res
      .status(201)
      .json({ success: true, msg: "Review successfully added.", review });
  }
);

// /api/v1/reviews/:id route
export const updateReview = asyncHandler(
  async (req: any, res: Response, next: NextFunction) => {
    // Might be unnecessary because of middleware that protects routes
    // but you can never be too careful
    if (!req.user.id) {
      throw new ErrorResponse(
        `Review can't be updated; No user is logged in`,
        401
      );
    }

    // This line is unnecessary
    // add logged in user's id to the body of the request
    // req.body.user = req.user.id;
    // see what's in the body of the request
    // console.log("updateReview: req.body = ", req.body);

    // review id
    const { id } = req.params;

    // check if review exists
    let review = await reviewService.getReviewById(id);

    // 404: not found
    if (!review) {
      // review with given id does not exist
      throw new ErrorResponse(`Review with id ${id} not found`, 404);
    }

    // Only the user that wrote the review or an admin can add/modify a review
    if (
      review.user.toString() !== req.user.id.toString() &&
      req.user.role !== "admin"
    ) {
      throw new ErrorResponse(
        `User with id ${req.user.id} is not authorized to modify the review with id = ${id}`,
        403
      );
    }

    // sanitize the body of the update request
    let dto: UpdateReviewDTO;
    dto = new UpdateReviewDTO(req.body);

    // use service to update the review
    review = await reviewService.updateReviewById(id, dto);

    // send response to route
    res.status(200).json({
      success: true,
      msg: `Review with id = ${id} successfully modified.`,
      review,
    });
  }
);

// delete review
export const deleteReview = asyncHandler(
  async (req: any, res: Response, next: NextFunction) => {
    // reusable review variable
    let reviewToBeDeleted;
    // Safe guard incase of accidental deletion of user when testing;
    // This will almost never happen in production
    if (!req.user.id) {
      throw new ErrorResponse("Authentication required", 401);
    }
    console.log("req.user = ", req.user);
    if (!req.params.id) {
      throw new ErrorResponse("Add review id to query parameters", 400);
    }

    const { id } = req.params;

    // check to see if the review actually exists
    reviewToBeDeleted = await reviewService.getReviewById(id);

    if (reviewToBeDeleted === null) {
      throw new ErrorResponse(`Review with id = ${id} not found`, 404);
    }

    // Only the user that wrote the review or an admin can delete a review
    if (
      reviewToBeDeleted.user.toString() !== req.user.id.toString() &&
      req.user.role !== "admin"
    ) {
      throw new ErrorResponse(
        `User with id ${req.user.id} is not authorized to delete the review with id = ${id}`,
        400
      );
    }

    // delete the review
    reviewToBeDeleted = await reviewService.deleteReviewById(id);

    // send response
    return res.status(204).json({
      success: true,
      msg: `Review with id = ${id} successfully deleted.`,
      reviewToBeDeleted,
    });
  }
);
