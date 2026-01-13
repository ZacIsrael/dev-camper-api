// This file is responsible for handling API requests that come in for bootcamps

// Import the Express framework for building HTTP servers
import express from "express";
import type { Application, Request, Response, NextFunction } from "express";
import { CreateBootcampDTO } from "../dtos/bootcamp.dto.js";
import { ObjectId } from "mongodb";
import { bootcampService } from "../services/bootcamp.service.js";
import mongoose from "mongoose";
import { ErrorResponse } from "../utils/errorResponse.js";
import { asyncHandler } from "../middleware/async.middleware.js";
import { geocoder } from "../utils/geocoder.js";
import { Bootcamp } from "../models/bootcamp.model.js";

/* ==== Implementation with middleware async handler ==== */
export const getBootcamps = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
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
    const removeFields = ["select", "sort"];

    // Loop over removeFields and delete them from reqQuery
    removeFields.forEach((param) => delete reqQuery[param]);

    // debugging
    console.log("req.query after removing certain fileds: ", reqQuery);


    let selectFields = '';
    // Select fields (for what should be returned)
    if (query.select) {
      if (typeof query.select === 'string') {
        selectFields = query.select.split(",").join(' ');
      }
      console.log("fields = ", selectFields);
    }

    let sortBy = '';
    // Select fields (for what should be returned)
    if (query.sort) {
      if (typeof query.sort === 'string') {
        sortBy = query.sort.split(",").join(' ');
      }
      console.log("sortBy = ", sortBy);
    }

    if (Object.keys(req.query).length > 0) {
      // Query strings exist some filtering needs to be done

      // Convert the query object into a JSON string so it can be manipulated
      let queryStr = JSON.stringify(reqQuery);

      // Regex expression to replace supported comparison operators with MongoDB operators
      // Example: gt -> $gt, lte -> $lte
      queryStr = queryStr.replace(
        /\b(gt|gte|lt|lte|in)\b/g,
        (match) => `$${match}`
      );

      // debugging
      console.log("queryStr = ", queryStr);

      // Parse the modified query string back into an object
      // and pass it to the service for filtered database retrieval
      bootcamps = await bootcampService.getFilteredBootcamps(
        JSON.parse(queryStr), selectFields, sortBy
      );

      // Message shown when no bootcamps match the applied filters
      emptyReturnMsg = `There are no bootcamps in the 'bootcamp' mongoDB collection that match filter = ${queryStr}.`;
      foundBootcampMsg = `Successfully retrieved all bootcamps from the 'bootcamp' mongoDB collection that match the filter = ${queryStr}.`;
    } else {
      // use service retrieve all bootcamps
      bootcamps = await bootcampService.getAllBootcamps(selectFields, sortBy);

      // Message shown when the collection exists but contains no bootcamps
      emptyReturnMsg =
        "There are no bootcamps in the 'bootcamp' mongoDB collection.";
      foundBootcampMsg =
        "Successfully retrieved all bootcamps from the 'bootcamp' mongoDB collection.";
    }

    // send response to route
    res.status(200).json({
      success: true,
      msg:
        // necessary message gets displayed depending on if the videos collection is empty or not
        bootcamps.length === 0 ? emptyReturnMsg : foundBootcampMsg,
      bootcamps,
      length: bootcamps.length,
    });
  }
);

export const getBootcampById = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    //   400: invalid ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: `Invalid bootcamp id: ${id}`,
      });
    }

    // retrieve bootcamp with given id using bootcamp service
    const bootcamp = await bootcampService.getBootcampById(id);

    // 404: not found
    if (!bootcamp) {
      // bootcamp with given id does not exist
      return res.status(404).json({
        success: false,
        error: `Bootcamp with id ${id} not found`,
      });
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
  async (req: Request, res: Response, next: NextFunction) => {
    // see what's in the body of the request
    console.log("addBootcamp: req.body = ", req.body);

    // data transfer object (object that will contained the processed request)
    let dto: CreateBootcampDTO;

    // process the body of the request (see bootcampo.dto.js)
    dto = new CreateBootcampDTO(req.body);
    console.log("addBootcamp: dto = ", dto);

    // use service to add bootcamp
    const bootcamp = await bootcampService.createBootcamp(dto);
    // send response to route
    res
      .status(201)
      .json({ success: true, msg: "Bootcamp successfully added.", bootcamp });
  }
);

export const updateBootcamp = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    // obtain the bootcamp's id from the route parameter
    const { id } = req.params;
    const { body } = req;

    // 400: invalid ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: `Invalid bootcamp id: ${id}`,
      });
    }

    // use service to update a bootcamp
    const bootcamp = await bootcampService.updateBootcampById(id, body);

    // 404: not found
    if (!bootcamp) {
      // bootcamp with given id does not exist
      return res.status(404).json({
        success: false,
        error: `Bootcamp with id ${id} not found`,
      });
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
  async (req: Request, res: Response, next: NextFunction) => {
    // obtain the bootcamp's id from the route parameter
    const { id } = req.params;

    // 400: invalid ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: `Invalid bootcamp id: ${id}`,
      });
    }

    // use service to delete a bootcamp
    const deleted = bootcampService.deleteBootcampById(id);

    // 404: not found
    if (!deleted) {
      // bootcamp with given id does not exist
      return res.status(404).json({
        success: false,
        error: `Bootcamp with id ${id} not found`,
      });
    }

    // send repsonse to route
    res.status(204).json({
      success: true,
      msg: `Bootcamp with id = ${id} successfully deleted.`,
      deleted,
    });
  }
);

/* ==== Implementation without middleware async handler ==== */
/*
export const getBootcamps = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // use service retrieve all bootcamps
    const bootcamps = await bootcampService.getAllBootcamps();

    // send response to route
    res.status(200).json({
      success: true,
      msg:
        // necessary message gets displayed depending on if the videos collection is empty or not
        bootcamps.length === 0
          ? "There are no bootcamps in the 'bootcamp' mongoDB collection."
          : "Successfully retrieved all bootcamps from the 'bootcamp' mongoDB collection.",
      bootcamps,
      length: bootcamps.length
    });
  } catch (err: any) {
    // logs for debugging
    console.log("controller: err = ", err);
    console.log("controller: err.name = ", err.name);

    // error occured when retrieving all bootcamp documents from the bootcamp MongoDB collection
    // res.status(500).json({
    //   error: `Server Error (GET /api/v1/bootcamps): ${err.message}`,
    //   stack: err.stack,
    // });

    next(new ErrorResponse(err, 500));
  }
};

export const getBootcampById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;

  //   400: invalid ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      error: `Invalid bootcamp id: ${id}`,
    });
    // next(new ErrorResponse(`Invalid bootcamp id: ${id}`, 400));
  }

  try {
    // retrieve bootcamp with given id using bootcamp service
    const bootcamp = await bootcampService.getBootcampById(id);

    // 404: not found
    if (!bootcamp) {
      // bootcamp with given id does not exist
      return res.status(404).json({
        success: false,
        error: `Bootcamp with id ${id} not found`,
      });

      // next(new ErrorResponse(`Bootcamp with id ${id} not found`, 404));
      // return;
    }

    return res.status(200).json({
      success: true,
      msg: `Bootcamp with id = ${id} successfully retrieved.`,
      bootcamp,
    });
  } catch (err: any) {
    // logs for debugging
    console.log("controller: err = ", err);
    console.log("controller: err.name = ", err.name);

    // res.status(500).json({
    //   error: `Server Error (GET /api/v1/bootcamps/${id}): ${err.message}`,
    //   stack: err.stack,
    // });

    next(new ErrorResponse(err, 500));
  }
};

export const addBootcamp = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // see what's in the body of the request
  console.log("addBootcamp: req.body = ", req.body);

  // data transfer object (object that will contained the processed request)
  let dto: CreateBootcampDTO;

  // process the body of the request (see bootcampo.dto.js)
  try {
    dto = new CreateBootcampDTO(req.body);
    console.log("addBootcamp: dto = ", dto);
  } catch (err: any) {
    // Error stems from client-side/body of the request
    // see (bootcamp.dto.js) to see all possible error messages
    res.status(400).json({
      error: `Bad Request (POST /api/v1/bootcamps): ${err.message}`,
      stack: err.stack,
    });
    // console.log("controller: err = ", err);
    // console.log("controller: err.name = ", err.name);
    // next(new ErrorResponse(err, 400));
    return;

    // next(new ErrorResponse(`Bad Request (POST /api/v1/bootcamps)`, 400));
    // return;
  }

  try {
    // use service to add bootcamp
    const bootcamp = await bootcampService.createBootcamp(dto);
    // send response to route
    res
      .status(201)
      .json({ success: true, msg: "Bootcamp successfully added.", bootcamp });
  } catch (err: any) {
    // logs for debugging
    console.log("controller: err = ", err);
    console.log("controller: err.name = ", err.name);

    // Error inserting the bootcamp into the mongoDB collection

    // res.status(500).json({
    //   error: `Server Error (POST /api/v1/bootcamps): ${err.message}`,
    //   stack: err.stack,
    // });

    // if err.code = duplicate key, then set the status code to 400
    next(new ErrorResponse(err, 500));
    // next(new ErrorResponse(`Server Error (POST /api/v1/bootcamps))`, 500));
  }
};

export const updateBootcamp = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // obtain the bootcamp's id from the route parameter
  const { id } = req.params;
  const { body } = req;

  // 400: invalid ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      error: `Invalid bootcamp id: ${id}`,
    });

    // next(new ErrorResponse(`Invalid bootcamp id: ${id}`, 400));
  }

  try {
    // use service to update a bootcamp
    const bootcamp = await bootcampService.updateBootcampById(id, body);

    // 404: not found
    if (!bootcamp) {
      // bootcamp with given id does not exist
      return res.status(404).json({
        success: false,
        error: `Bootcamp with id ${id} not found`,
      });

      // next(new ErrorResponse(`Bootcamp with id ${id} not found`, 404));
    }

    // send response to route
    res.status(200).json({
      success: true,
      msg: `Bootcamp with id = ${id} successfully modified.`,
      bootcamp,
    });
  } catch (err: any) {
    // logs for debugging
    console.log("controller: err = ", err);
    console.log("controller: err.name = ", err.name);

    // return res.status(500).json({
    //   success: false,
    //   error: `Server Error (PATCH /api/v1/bootcamps/${id}): ${err.message}`,
    //   stack: err.stack,
    // });

    next(new ErrorResponse(err, 500));
  }
};

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

export const deleteBootcamp = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // obtain the bootcamp's id from the route parameter
  const { id } = req.params;

  // 400: invalid ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      error: `Invalid bootcamp id: ${id}`,
    });

    // next(new ErrorResponse(`Invalid bootcamp id: ${id}`, 400));
  }
  try {
    // use service to delete a bootcamp
    const deleted = bootcampService.deleteBootcampById(id);

    // 404: not found
    if (!deleted) {
      // bootcamp with given id does not exist
      return res.status(404).json({
        success: false,
        error: `Bootcamp with id ${id} not found`,
      });

      // next(new ErrorResponse(`Bootcamp with id ${id} not found`, 404));
    }

    // send repsonse to route
    res.status(204).json({
      success: true,
      msg: `Bootcamp with id = ${id} successfully deleted.`,
      deleted,
    });
  } catch (err: any) {
    // logs for debugging
    console.log("controller: err = ", err);
    console.log("controller: err.name = ", err.name);

    // return res.status(500).json({
    //   success: false,
    //   error: `Server Error (DELETE /api/v1/bootcamps/${id}): ${err.message}`,
    //   stack: err.stack,
    // });

    next(new ErrorResponse(err, 500));
  }
};
*/
