// This file is responsible for handling API requests that come in for bootcamps

// Import the Express framework for building HTTP servers
import express from "express";
import type { Application, Request, Response, NextFunction } from "express";
import { CreateBootcampDTO } from "../dtos/bootcamp.dto.js";
import { ObjectId } from "mongodb";
import { bootcampService } from "../services/bootcamp.service.js";
import mongoose from "mongoose";
import { ErrorResponse } from "../utils/errorResponse.js";

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
    });
  } catch (err: any) {
    // error occured when retrieving all bootcamp documents from the bootcamp MongoDB collection
    // res.status(500).json({
    //   error: `Server Error (GET /api/v1/bootcamps): ${err.message}`,
    //   stack: err.stack,
    // });

    next(new ErrorResponse(`Server Error (GET /api/v1/bootcamps`, 500));
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
    next(new ErrorResponse(`Invalid bootcamp id: ${id}`, 400));
  }

  try {
    // retrieve bootcamp with given id using bootcamp service
    const bootcamp = await bootcampService.getBootcampById(id);

    // 404: not found
    if (!bootcamp) {
      // bootcamp with given id does not exist
      next(new ErrorResponse(`Bootcamp with id ${id} not found`, 404));
    }

    return res.status(200).json({
      success: true,
      msg: `Bootcamp with id = ${id} successfully retrieved.`,
      bootcamp,
    });
  } catch (err: any) {
    next(new ErrorResponse(`Server Error (GET /api/v1/bootcamps/${id})`, 500));
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
    // res.status(400).json({
    //   error: `Bad Request (POST /api/v1/bootcamps): ${err.message}`,
    //   stack: err.stack,
    // });
    // return;

    next(new ErrorResponse(`Bad Request (POST /api/v1/bootcamps)`, 400));
    return;
  }

  try {
    // use service to add bootcamp
    const bootcamp = await bootcampService.createBootcamp(dto);
    // send response to route
    res
      .status(201)
      .json({ success: true, msg: "Bootcamp successfully added.", bootcamp });
  } catch (err: any) {
    // Error inserting the bootcamp into the mongoDB collection
    // res.status(500).json({
    //   error: `Server Error (POST /api/v1/bootcamps): ${err.message}`,
    //   stack: err.stack,
    // });

    next(new ErrorResponse(`Server Error (POST /api/v1/bootcamps))`, 500));
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
    // return res.status(400).json({
    //   success: false,
    //   error: `Invalid bootcamp id: ${id}`,
    // });

    next(new ErrorResponse(`Invalid bootcamp id: ${id}`, 400));
  }

  try {
    // use service to update a bootcamp
    const bootcamp = await bootcampService.updateBootcampById(id, body);

    // 404: not found
    if (!bootcamp) {
      // bootcamp with given id does not exist
      //   return res.status(404).json({
      //     success: false,
      //     error: `Bootcamp with id ${id} not found`,
      //   });

      next(new ErrorResponse(`Bootcamp with id ${id} not found`, 404));
    }

    // send response to route
    res.status(200).json({
      success: true,
      msg: `Bootcamp with id = ${id} successfully modified.`,
      bootcamp,
    });
  } catch (err: any) {
    // return res.status(500).json({
    //   success: false,
    //   error: `Server Error (PATCH /api/v1/bootcamps/${id}): ${err.message}`,
    //   stack: err.stack,
    // });

    next(
      new ErrorResponse(`Server Error (PATCH /api/v1/bootcamps/${id})`, 500)
    );
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
    // return res.status(400).json({
    //   success: false,
    //   error: `Invalid bootcamp id: ${id}`,
    // });

    next(new ErrorResponse(`Invalid bootcamp id: ${id}`, 400));
  }
  try {
    // use service to delete a bootcamp
    const deleted = bootcampService.deleteBootcampById(id);

    // 404: not found
    if (!deleted) {
      // bootcamp with given id does not exist
      //   return res.status(404).json({
      //     success: false,
      //     error: `Bootcamp with id ${id} not found`,
      //   });

      next(new ErrorResponse(`Bootcamp with id ${id} not found`, 404));
    }

    // send repsonse to route
    res.status(204).json({
      success: true,
      msg: `Bootcamp with id = ${id} successfully deleted.`,
      deleted,
    });
  } catch (err: any) {
    // return res.status(500).json({
    //   success: false,
    //   error: `Server Error (DELETE /api/v1/bootcamps/${id}): ${err.message}`,
    //   stack: err.stack,
    // });

    next(
      new ErrorResponse(`Server Error (DELETE /api/v1/bootcamps/${id})`, 500)
    );
  }
};
