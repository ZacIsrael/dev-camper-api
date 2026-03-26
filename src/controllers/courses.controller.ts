import type { Request, Response, NextFunction } from "express";
import { CreateCourseDTO, UpdateCourseDTO } from "../dtos/course.dto.js";
import { courseService } from "../services/course.service.js";

// import mongoose from "mongoose";
import { asyncHandler } from "../middleware/async.middleware.js";
import { ErrorResponse } from "../utils/errorResponse.js";
import { isNonEmptyString } from "../utils/helpers.js";
import { bootcampService } from "../services/bootcamp.service.js";

export const getCourses = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    // Only allow filtering on these fields (prevents injection via arbitrary keys)
    const ALLOWED_FILTER_FIELDS = [
      "title",
      "minimumSkill",
      "tuition",
      "weeks",
      "scholarhipsAvailable",
      "bootcamp",
    ];

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
      // Query strings exist, so filtering needs to be done

      // Only allow these MongoDB-style comparison operators in filter queries
      const ALLOWED_FILTER_OPERATORS = ["gt", "gte", "lt", "lte", "in"];

      // Safe filter object that will be passed to MongoDB
      const safeFilter: Record<string, any> = {};

      // Loop through each query parameter after removing reserved fields
      for (const key in reqQuery) {
        // Ignore any field that is not explicitly allowed for filtering
        if (!ALLOWED_FILTER_FIELDS.includes(key)) continue;

        const value = reqQuery[key];

        // Support nested operator filters like tuition[gte]=5000
        if (
          typeof value === "object" &&
          value !== null &&
          !Array.isArray(value)
        ) {
          const operatorObj: Record<string, any> = {};

          for (const op in value as Record<string, any>) {
            // Ignore any operator that is not explicitly allowed
            if (!ALLOWED_FILTER_OPERATORS.includes(op)) continue;

            operatorObj[`$${op}`] = (value as Record<string, any>)[op];
          }

          // Only attach the field if at least one valid operator survived
          if (Object.keys(operatorObj).length > 0) {
            safeFilter[key] = operatorObj;
          }
        } else {
          // Direct equality filter for simple values like minimumSkill=beginner
          safeFilter[key] = value;
        }
      }

      // Use allowlist-based filter instead of raw query-derived filter
      filter = safeFilter;

      // debugging
      console.log("safeFilter = ", safeFilter);

      const safeFilterStr = JSON.stringify(safeFilter);

      // Message shown when no courses match the applied filters
      emptyReturnMsg = `There are no courses in the 'course' mongoDB collection that match filter = ${safeFilterStr}.`;
      foundBootcampMsg = `Successfully retrieved all courses from the 'course' mongoDB collection that match the filter = ${safeFilterStr}.`;
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
        throw new ErrorResponse("bootcampId must be a non-empty string", 400);
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
    console.log(`Bootcamp id exists. Filter = `, filter);

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
    // id is already validated in middleware called in courses route file
    const { id } = req.params;

    // retrieve course with given id using course service
    const course = await courseService.getCourseById(id);

    // 404: not found
    if (!course) {
      throw new ErrorResponse(`Course with id ${id} not found`, 404);
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
  async (req: any, res: Response, next: NextFunction) => {
    // Might be unnecessary because of middleware that protects routes
    // but you can never be too careful
    if (!req.user) {
      throw new ErrorResponse(
        "Course can't be added; no user is logged in",
        401
      );
    }

    // add logged in user's id to the body of the request
    req.body.user = req.user.id;
    // debugging: see what's in the body of the request
    console.log("addCourse: req.body = ", req.body);

    const { bootcampId } = req.params;

    if (bootcampId === undefined) {
      throw new ErrorResponse(
        "bootcampId must be included in the route parameters",
        400
      );
    }

    // Ensure that the bootcamp id is a non-empty string
    if (!isNonEmptyString(bootcampId)) {
      throw new ErrorResponse("bootcampId must be a non-empty string", 400);
    }

    // 400: invalid ObjectId
    // This is unnecessary now due to middleware called in
    // the route that calls this function (bootcamps route file)
    // if (!mongoose.Types.ObjectId.isValid(bootcampId)) {
    //   return res.status(400).json({
    //     success: false,
    //     error: `Invalid bootcamp id: ${bootcampId}`,
    //   });
    // }

    // check to see if a bootcamp with _id = bootcampId actually exists
    const bootcamp = await bootcampService.getBootcampById(bootcampId);

    // 404: bootcamp not found
    if (bootcamp === null) {
      throw new ErrorResponse(
        `Bootcamp with id = ${bootcampId} not found`,
        404
      );
    }

    // Only the owner of the bootcamp or an admin can add a course to a bootcamp
    if (
      bootcamp.user.toString() !== req.user.id.toString() &&
      req.user.role !== "admin"
    ) {
      throw new ErrorResponse(
        `User with id ${req.user.id} is not authorized to add a course to bootcamp with id = ${bootcampId}`,
        403
      );
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
  async (req: any, res: Response, next: NextFunction) => {
    // obtain the course's id from the route parameter
    const { id } = req.params;
    const { body } = req;

    // Might be unnecessary because of middleware that protects routes
    // but you can never be too careful
    if (!req.user) {
      throw new ErrorResponse(
        "Course can't be updated; no user is logged in",
        401
      );
    }

    // This line is actually unnecessary
    // add logged in user's id to the body of the request
    // req.body.user = req.user.id;

    // see what's in the body of the request
    console.log("updateCourse: req.body = ", req.body);

    // check if course exists; retrieve user id
    let course = await courseService.getCourseById(id);

    // 404: not found
    if (!course) {
      throw new ErrorResponse(`Course with id ${id} not found`, 404);
    }

    // Only the owner of the course or an admin can add modify a course
    if (
      course.user.toString() !== req.user.id.toString() &&
      req.user.role !== "admin"
    ) {
      throw new ErrorResponse(
        `User with id ${req.user.id} is not authorized to modify a course with id = ${id}`,
        403
      );
    }

    // data transfer object (object that will contain the processed request)
    let dto: UpdateCourseDTO;
    // process and validate the body of the request (see course.dto.ts)
    dto = new UpdateCourseDTO(req.body);
    console.log("updateCourse: dto = ", dto);

    // use service to update a course
    course = await courseService.updateCourseById(id, dto);

    // send response to route
    res.status(200).json({
      success: true,
      msg: `Course with id = ${id} successfully modified.`,
      course,
    });
  }
);

export const deleteCourse = asyncHandler(
  async (req: any, res: Response, next: NextFunction) => {
    // obtain the course's id from the route parameter
    // id is already validated via the middleware that
    // gets called in the route before this function is called (courses route file)
    const { id } = req.params;

    // debugging
    // console.log("deleteCourse (before adding req.user): req.body = ", req.body);

    // Might be unnecessary because of middleware that protects routes
    // but you can never be too careful
    if (!req.user) {
      throw new ErrorResponse(
        `Course with id = ${id} can't be deleted; no user is logged in`,
        401
      );
    }

    // debugging
    // console.log("deleteCourse: req.user = ", req.user);

    // check if course exists; retrieve user id
    let courseToDelete = await courseService.getCourseById(id);

    // 404: not found
    if (!courseToDelete) {
      throw new ErrorResponse(`Course with id ${id} not found`, 404);
    }

    // Only the owner of the course or an admin can delete a course
    if (
      courseToDelete.user.toString() !== req.user.id.toString() &&
      req.user.role !== "admin"
    ) {
      throw new ErrorResponse(
        `User with id ${req.user.id} is not authorized to delete the course with id = ${id}`,
        403
      );
    }

    // use service to delete a course
    courseToDelete = await courseService.deleteCourseById(id);

    // send repsonse to route
    res.status(204).json({
      success: true,
      msg: `Course with id = ${id} successfully deleted.`,
      deleted: courseToDelete,
    });
  }
);
