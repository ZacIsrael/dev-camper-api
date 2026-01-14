import type { Request, Response, NextFunction } from "express";
import { CreateCourseDTO } from "../dtos/course.dto.js";
import { courseService } from "../services/course.service.js";

import mongoose from "mongoose";
import { asyncHandler } from "../middleware/async.middleware.js";

import { Course } from "../models/course.model.js";

export const getCourses = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { query } = req;
    console.log("req.query = ", query);
    // stores returned courses
    let courses;
    // default value for filter if it does not exist
    let queryStr = "";

    // message returned when courses are not found
    let emptyReturnMsg = "";

    // message returned when courses are found
    let foundBootcampMsg = "";

    // copy of req.query object
    const reqQuery = { ...query };

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

    if (Object.keys(req.query).length > 0) {
      // Query strings exist some filtering needs to be done

      // Convert the query object into a JSON string so it can be manipulated
      queryStr = JSON.stringify(reqQuery);

      // Regex expression to replace supported comparison operators with MongoDB operators
      // Example: gt -> $gt, lte -> $lte
      queryStr = queryStr.replace(
        /\b(gt|gte|lt|lte|in)\b/g,
        (match) => `$${match}`
      );

      // debugging
      console.log("queryStr = ", queryStr);

      // Message shown when no courses match the applied filters
      emptyReturnMsg = `There are no courses in the 'course' mongoDB collection that match filter = ${queryStr}.`;
      foundBootcampMsg = `Successfully retrieved all courses from the 'course' mongoDB collection that match the filter = ${queryStr}.`;
    } else {
      // Message shown when the collection exists but contains no courses
      emptyReturnMsg =
        "There are no courses in the 'course' mongoDB collection.";
      foundBootcampMsg =
        "Successfully retrieved all courses from the 'course' mongoDB collection.";
    }

    // Parse the modified query string back into an object
    // and pass it to the service for filtered database retrieval
    courses = await courseService.getAllCourses(
      JSON.parse(queryStr),
      selectFields,
      sortBy,
      paginationObj
    );

    // send response to route
    res.status(200).json({
      success: true,
      count: courses.courses.length,
      pagination: courses.pagination,
      msg:
        // necessary message gets displayed depending on if the videos collection is empty or not
        courses.courses.length === 0 ? emptyReturnMsg : foundBootcampMsg,
      courses: courses.courses,
    });
  }
);
