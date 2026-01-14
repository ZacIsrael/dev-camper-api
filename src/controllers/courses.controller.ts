import type { Request, Response, NextFunction } from "express";
import { CreateCourseDTO } from "../dtos/course.dto.js";
import { courseService } from "../services/course.service.js";

import mongoose from "mongoose";
import { asyncHandler } from "../middleware/async.middleware.js";

import { Course } from "../models/course.model.js";
import { isNonEmptyString } from "../utils/helpers.js";
import { bootcampService } from "../services/bootcamp.service.js";

export const getCourses = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { query } = req;
    console.log("req.query = ", query);
    // stores returned courses
    let courses;

    // for /api/v1/bootcamps/:bootcampId/courses route
    const { bootcampId } = req.params;

    // message returned when courses are not found
    let emptyReturnMsg = "";

    // message returned when courses are found
    let foundBootcampMsg = "";

    // copy of req.query object
    const reqQuery = { ...query };

    // Build filter object (no JSON.parse needed)
    let filter: Record<string, any> = { ...reqQuery };

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

      // Convert to string only to run the regex operator replacement
      let queryStr = JSON.stringify(reqQuery);

      // Regex expression to replace supported comparison operators with MongoDB operators
      // Example: gt -> $gt, lte -> $lte
      queryStr = queryStr.replace(
        /\b(gt|gte|lt|lte|in)\b/g,
        (match) => `$${match}`
      );

      // debugging
      console.log("queryStr = ", queryStr);

      // Turn it back into an object (safe because queryStr is always valid JSON here)
      filter = JSON.parse(queryStr);

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

    // for /api/v1/bootcamps/:bootcampId/courses route
    // check to see if bootcampId was passed
    if (bootcampId !== undefined) {
      // ensure that the bootcamp id is a non-empty string
      if (!isNonEmptyString(bootcampId)) {
        return res.status(400).json({
          success: false,
          error: "bootcampId must be a non-empty string",
        });
      }

      //   400: invalid ObjectId
      if (!mongoose.Types.ObjectId.isValid(bootcampId)) {
        return res.status(400).json({
          success: false,
          error: `Invalid bootcamp id: ${bootcampId}`,
        });
      }

      // pass the id to the filter: { bootcamp: bootcampId}
      filter.bootcamp = bootcampId;

      // debugging
      console.log(`Bootcamp id ${bootcampId} exists. Filter = `, filter);

      // Message shown when no courses match the applied filters
      emptyReturnMsg = `There are no courses in the 'course' mongoDB collection that belong to the bootcamp that has an id = ${bootcampId}`;
      foundBootcampMsg = `Successfully retrieved all courses from the 'course' mongoDB collection that belong to the bootcamp that has an id = ${bootcampId}.`;
    }

    // debugging
    console.log(`Bootcamp id does not exist. Filter = `, filter);

    // Parse the modified query string back into an object
    // and pass it to the service for filtered database retrieval
    courses = await courseService.getAllCourses(
      filter,
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
        // necessary message gets displayed depending on if the courses collection is empty or not
        courses.courses.length === 0 ? emptyReturnMsg : foundBootcampMsg,
      courses: courses.courses,
    });
  }
);

export const getCourseById = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    //   400: invalid ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: `Invalid course id: ${id}`,
      });
    }

    // retrieve course with given id using course service
    const course = await courseService.getCourseById(id);

    // 404: not found
    if (!course) {
      // course with given id does not exist
      return res.status(404).json({
        success: false,
        error: `Course with id ${id} not found`,
      });
    }

    return res.status(200).json({
      success: true,
      msg: `Course with id = ${id} successfully retrieved.`,
      course,
    });
  }
);

// /api/v1/bootcamps/:bootcampId/courses route
export const addCourse = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { bootcampId } = req.params;

    if (bootcampId === undefined) {
      return res.status(400).json({
        success: false,
        error:
          "bootcampId must be added as a query parameter: /api/v1/bootcamps/:bootcampId/courses",
      });
    }

    // ensure that the bootcamp id is a non-empty string
    if (!isNonEmptyString(bootcampId)) {
      return res.status(400).json({
        success: false,
        error: "bootcampId must be a non-empty string",
      });
    }

    //   400: invalid ObjectId
    if (!mongoose.Types.ObjectId.isValid(bootcampId)) {
      return res.status(400).json({
        success: false,
        error: `Invalid bootcamp id: ${bootcampId}`,
      });
    }

    // check to see if a bootcamp with _id = bootcampId actually exists
    const bootcamp = await bootcampService.getBootcampById(bootcampId);

    if (bootcamp === null) {
      return res.status(404).json({
        success: false,
        error: `Bootcamp with id = ${bootcampId} not found`,
      });
    }

    // data transfer object (object that will contain the processed request)
    let dto: any;

    // process the body of the request (see course.dto.js)
    dto = new CreateCourseDTO(req.body);
    // bootcampId is retrieved from the request parameters; not the body of the request
    dto.bootcamp = bootcampId;
    console.log("addCourse: dto = ", dto);

    // use service to add course
    const course = await courseService.createCourse(dto);
    // send response to route
    res
      .status(201)
      .json({ success: true, msg: "Course successfully added.", course });
  }
);

export const updateCourse = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    // obtain the course's id from the route parameter
    const { id } = req.params;
    const { body } = req;

    // 400: invalid ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: `Invalid course id: ${id}`,
      });
    }

    // use service to update a course
    const course = await courseService.updateCourseById(id, body);

    // 404: not found
    if (!course) {
      // bootcamp with given id does not exist
      return res.status(404).json({
        success: false,
        error: `Course with id ${id} not found`,
      });
    }

    // send response to route
    res.status(200).json({
      success: true,
      msg: `Course with id = ${id} successfully modified.`,
      course,
    });
  }
);

export const deleteCourse = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    // obtain the course's id from the route parameter
    const { id } = req.params;

    // 400: invalid ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: `Invalid course id: ${id}`,
      });
    }

    // use service to delete a course
    const deleted = await courseService.deleteCourseById(id);

    // 404: not found
    if (!deleted) {
      // course with given id does not exist
      return res.status(404).json({
        success: false,
        error: `Course with id ${id} not found`,
      });
    }

    // send repsonse to route
    res.status(204).json({
      success: true,
      msg: `Course with id = ${id} successfully deleted.`,
      deleted,
    });
  }
);
