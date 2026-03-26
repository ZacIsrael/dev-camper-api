// This file is responsible for handling API requests that come in for bootcamps

import type { Request, Response, NextFunction } from "express";
// Used to safely inspect and normalize file extensions
import path from "path";
import { bootcampService } from "../services/bootcamp.service.js";
import { asyncHandler } from "../middleware/async.middleware.js";
import { geocoder } from "../utils/geocoder.js";
import { Bootcamp } from "../models/bootcamp.model.js";
import { ErrorResponse } from "../utils/errorResponse.js";

// Only allow files with the following extensions to be uploaded
// for bootcamp photos
const ALLOWED_IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

const ALLOWED_IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];

/* ==== Implementation with middleware async handler ==== */
export const getBootcamps = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    // Only allow filtering on these fields (prevents injection via arbitrary keys)
    const ALLOWED_FILTER_FIELDS = [
      "name",
      "careers",
      "housing",
      "jobAssistance",
      "jobGuarantee",
      "averageCost",
    ];

    const { query } = req;
    console.log("req.query = ", query);
    // stores returned bootcamps
    let bootcamps;

    // message returned when not bootcamps are found
    let emptyReturnMsg = "";

    // message returned when bootcamps are found
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

        // Support nested operator filters like averageCost[gte]=1000
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
          // Direct equality filter for simple values like careers=Web Development
          safeFilter[key] = value;
        }
      }

      // debugging
      console.log("safeFilter = ", safeFilter);

      // Retrieve bootcamps using the allowlist-based safe filter
      bootcamps = await bootcampService.getFilteredBootcamps(
        safeFilter,
        selectFields,
        sortBy,
        paginationObj
      );

      // Convert safe filter to string for response/debug messages
      const safeFilterStr = JSON.stringify(safeFilter);

      // Message shown when no bootcamps match the applied filters
      emptyReturnMsg = `There are no bootcamps in the 'bootcamp' mongoDB collection that match filter = ${safeFilterStr}.`;
      foundBootcampMsg = `Successfully retrieved all bootcamps from the 'bootcamp' mongoDB collection that match the filter = ${safeFilterStr}.`;
    } else {
      // use service retrieve all bootcamps
      bootcamps = await bootcampService.getAllBootcamps(
        selectFields,
        sortBy,
        paginationObj
      );

      // Message shown when the collection exists but contains no bootcamps
      emptyReturnMsg =
        "There are no bootcamps in the 'bootcamp' mongoDB collection.";
      foundBootcampMsg =
        "Successfully retrieved all bootcamps from the 'bootcamp' mongoDB collection.";
    }

    // send response to route
    res.status(200).json({
      success: true,
      count: bootcamps.bootcamps.length,
      pagination: bootcamps.pagination,
      msg:
        // necessary message gets displayed depending on if the courses collection is empty or not
        bootcamps.bootcamps.length === 0 ? emptyReturnMsg : foundBootcampMsg,
      bootcamps: bootcamps.bootcamps,
    });
  }
);

export const getBootcampById = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    // id is already validated prior to this function being called
    // via middleware (see bootcamp route file)
    const { id } = req.params;

    // retrieve bootcamp with given id using bootcamp service
    const bootcamp = await bootcampService.getBootcampById(id);

    // 404: not found
    if (!bootcamp) {
      throw new ErrorResponse(`Bootcamp with id ${id} not found`, 404);
    }

    return res.status(200).json({
      success: true,
      msg: `Bootcamp with id = ${id} successfully retrieved.`,
      bootcamp,
    });
  }
);

export const getBootcampsWithinARadius = asyncHandler(
  // Async controller to get bootcamps within a given distance from a zipcode
  async (req: Request, res: Response, next: NextFunction) => {
    // Destructure zipcode and distance from route parameters
    const { zipcode, distance } = req.params;

    // Convert distance param (string) to a number
    const distanceNum = Number(distance);

    // Validate the distance is a real number
    if (Number.isNaN(distanceNum)) {
      // Return 400 if distance is not numeric
      return res.status(400).json({
        success: false,
        error: "Distance must be a number",
      });
    }

    // Convert the provided zipcode into latitude and longitude
    const loc = await geocoder.geocode(zipcode);

    // Extract latitude from geocoder response
    const lat = Number(loc[0].latitude);

    // Extract longitude from geocoder response
    const lng = Number(loc[0].longitude);

    // Define the Earth’s radius in miles (used for spherical calculations)
    const earthRadius = 3963;

    // Convert distance to radians for MongoDB geospatial query
    const radius = distanceNum / earthRadius;

    // Query bootcamps within the calculated spherical radius
    const bootcamps = await Bootcamp.find({
      location: {
        // Use MongoDB geospatial operator to find points within a sphere
        $geoWithin: {
          // Define the center point (longitude, latitude) and search radius
          $centerSphere: [[lng, lat], radius],
        },
      },
    });

    // Return successful response with matching bootcamps
    res.status(200).json({
      success: true,
      count: bootcamps.length,
      data: bootcamps,
    });
  }
);

export const addBootcamp = asyncHandler(
  async (req: any, res: Response, next: NextFunction) => {
    // add logged in user's id to the body of the request
    req.body.user = req.user.id;
    // see what's in the body of the request
    console.log("addBootcamp: req.body = ", req.body);

    // Check to see if the logged in user has already uploaded a bootcamp
    const { bootcamps, pagination } =
      await bootcampService.getFilteredBootcamps(
        { user: req.user.id },
        null,
        null,
        // no pagination necessary
        { page: 1, limit: 0, skip: 0 }
      );

    // If the logged in user has already uploaded a bootcamp and they are NOT an admin,
    // throw an error because if a user is NOT an admin, then they can only upload 1 bootcamp.
    if (bootcamps.length > 0 && req.user.role !== "admin") {
      throw new ErrorResponse(
        `User with id ${req.user.id} has already published a bootcamp`,
        400
      );
    }


    // use service to add bootcamp
    const bootcamp = await bootcampService.createBootcamp(req.body);
    // send response to route
    res
      .status(201)
      .json({ success: true, msg: "Bootcamp successfully added.", bootcamp });
  }
);

export const updateBootcamp = asyncHandler(
  async (req: any, res: Response, next: NextFunction) => {
    // obtain the bootcamp's id from the route parameter
    // id is already validated via middleware function called in bootcamps route file
    const { id } = req.params;
    const { body } = req;

    // Ensure that the user making this request is the owner of the bootcamp
    let bootcamp = await bootcampService.getBootcampById(id);

    // Might be unnecessary because of middleware that protects routes
    // but you can never be too careful
    if (!req.user) {
      throw new ErrorResponse(
        "Bootcamp can't be updated; no user is logged in",
        401
      );
    }
    // 404: not found
    if (!bootcamp) {
      throw new ErrorResponse(`Bootcamp with id ${id} not found`, 404);
    }

    // Admins are the only people aside from the bootcamp's owner that can make changes to a bootcamp
    if (
      bootcamp.user.toString() !== req.user.id.toString() &&
      req.user.role !== "admin"
    ) {
      // The user making this request is not owner of this bootcamp
      throw new ErrorResponse(
        `User with id ${req.user.id} can't update bootcamp with id ${id} because they are not the owner.`,
        403
      );
    }

    // use service to update a bootcamp
    bootcamp = await bootcampService.updateBootcampById(id, body);

    // 404: not found
    if (!bootcamp) {
      // bootcamp with given id does not exist
      if (!bootcamp) {
        throw new ErrorResponse(`Bootcamp with id ${id} not found`, 404);
      }
    }

    // send response to route
    res.status(200).json({
      success: true,
      msg: `Bootcamp with id = ${id} successfully modified.`,
      bootcamp,
    });
  }
);

export const replaceBootcamp = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // obtain the bootcamp's id from the route parameter
  const { id } = req.params;

  // use service to replace a bootcamp

  // send response to route
  res.status(200).json({
    success: true,
    msg: `Bootcamp with id = ${id} successfully replaced.`,
  });
};

export const deleteBootcamp = asyncHandler(
  async (req: any, res: Response, next: NextFunction) => {
    // obtain the bootcamp's id from the route parameter
    // id is validated through middleware function called in bootcamps route file
    const { id } = req.params;

    // Ensure that the user making this request is the owner of the bootcamp
    let deleted = await bootcampService.getBootcampById(id);

    // Might be unnecessary because of middleware that protects routes
    // but you can never be too careful
    if (!req.user) {
      throw new ErrorResponse(
        "Bootcamp can't be deleted; no user is logged in",
        401
      );
    }
    // 404: not found
    if (!deleted) {
      // bootcamp with given id does not exist
      throw new ErrorResponse(`Bootcamp with id ${id} not found`, 404);
    }
    // Admins are the only people aside from the bootcamp's owner that can delete a bootcamp
    if (
      deleted.user.toString() !== req.user.id.toString() &&
      req.user.role !== "admin"
    ) {
      // The user making this request is not owner of this bootcamp
      throw new ErrorResponse(
        `User with id ${req.user.id} can't delete bootcamp with id ${id} because they are not the owner.`,
        403
      );
    }

    // use service to delete a bootcamp
    deleted = await bootcampService.deleteBootcampById(id);

    // send repsonse to route
    res.status(204).json({
      success: true,
      msg: `Bootcamp with id = ${id} successfully deleted.`,
      deleted,
    });
  }
);

// PATCH method: update a bootcamp with a photo
// PATCH /api/v1/bootcamps/:id/photo
export const uploadBootcampPhoto = asyncHandler(
  async (req: any, res: Response, next: NextFunction) => {
    // retrieve the bootcamp's id from the query parameters
    const { id } = req.params;

    // retrieve uploaded file(s)
    const { files } = req;

    // retrieve bootcamp with given id using bootcamp service
    let bootcamp = await bootcampService.getBootcampById(id);

    // 404: not found
    if (!bootcamp) {
      // bootcamp with given id does not exist
      throw new ErrorResponse(`Bootcamp with id ${id} not found`, 404);
    }

    // Ensure that the user making this request is the owner of the bootcamp
    bootcamp = await bootcampService.getBootcampById(id);

    // Might be unnecessary because of middleware that protects routes
    // but you can never be too careful
    if (!req.user) {
      throw new ErrorResponse(
        "Bootcamp can't be updated; no user is logged in",
        401
      );
    }
    // 404: not found
    if (!bootcamp) {
      // bootcamp with given id does not exist
      throw new ErrorResponse(`Bootcamp with id ${id} not found`, 404);
    }
    // Admins are the only people aside from the bootcamp's owner that can make changes to a bootcamp
    if (
      bootcamp.user.toString() !== req.user.id.toString() &&
      req.user.role !== "admin"
    ) {
      // The user making this request is not owner of this bootcamp
      throw new ErrorResponse(
        `User with id ${req.user.id} can't update bootcamp with id ${id} because they are not the owner.`,
        403
      );
    }

    // a file was not uploaded
    if (files === undefined || files === null) {
      throw new ErrorResponse("Please upload a file", 400);
    }

    const file = files.file;

    // extra null check; a file was not uploaded
    if (file === undefined || file === null) {
      throw new ErrorResponse("Please upload a file", 400);
    }
    // a file was uploaded
    // debugging
    // console.log("controller(uploadBootcampPhoto): File = ", file);
    /*

    Structure of req.files.file:

      {
        name: 'file-name.jpg',
        data: <Buffer ff d8 ff e0 00 10 4a 46 49 46 00 01 02 01 00 48 00 48 00 00 ff e2 0c 58 49 43 43 5f 50 52 4f 46 49 4c 45 00 01 01 00 00 0c 48 4c 69 6e 6f 02 10 00 00 ... 2083520 more bytes>,
        size: 2083570,
        encoding: '7bit',
        tempFilePath: '',
        truncated: false,
        mimetype: 'image/jpeg',
        md5: 'c94227df1c3fa58656d67e51fc699595',
        mv: [Function: mv]
      }

    */

    // User uploaded multiple files when they should've
    // only uploaded 1 image for this function
    if (Array.isArray(file)) {
      throw new ErrorResponse("Please only upload 1 file", 400);
    }

    const fileExtension = path.extname(file.name).toLowerCase();

    // Validate MIME type against strict allowlist to block unsafe formats (e.g., SVG, HTML)
    if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.mimetype)) {
      throw new ErrorResponse(
        "Please upload a valid image file (jpg, jpeg, png, or webp)",
        400
      );
    }

    // Validate file extension to ensure only safe image types are accepted (defense-in-depth)
    if (!ALLOWED_IMAGE_EXTENSIONS.includes(fileExtension)) {
      throw new ErrorResponse(
        "Please upload a valid image extension (jpg, jpeg, png, or webp)",
        400
      );
    }

    // Max size an uploaded file can be
    const maxSize = Number(process.env.MAX_FILE_UPLOAD) || 3000000;
    // Check file size
    if (file.size > maxSize) {
      throw new ErrorResponse(
        `Please upload a photo that is ${maxSize} bytes or less`,
        400
      );
    }

    // Create custom file name
    // const newFileName = `photo_${bootcamp._id}_${file.name}`;
    const newFileName = `photo_${bootcamp._id}${fileExtension}`;

    // Directory of where the file will be stored
    const uploadFileDirectory =
      (process.env.FILE_UPLOAD_PATH as string) || "./public/uploads";

    // uplaod the file to the specified directory
    file.mv(`${uploadFileDirectory}/${newFileName}`, async (err: any) => {
      if (err) {
        return res.status(500).json({
          success: false,
          error: `Issue with file upload`,
        });
      }

      // req.files.file is 1 image; now, the bootcamp can be updated with this image
      const updatedBootcamp = await bootcampService.updateBootcampById(id, {
        photo: newFileName,
      });

      // send response to route
      res.status(200).json({
        success: true,
        msg: `Successfully added photo = ${file.name} to bootcamp with id = ${id}.`,
        bootcamp: updatedBootcamp,
      });
    });
  }
);
