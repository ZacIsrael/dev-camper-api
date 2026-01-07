// This file is responsible for handling API requests that come in for bootcamps

// Import the Express framework for building HTTP servers
import express from "express";
import type { Application, Request, Response, NextFunction } from "express";
import { CreateBootcampDTO } from "../dtos/bootcamp.dto.js";
import { bootcampService } from "../services/bootcamp.service.js";

export const getBootcamps = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // use service retrieve all bootcamps

  // send response to route
  res.status(200).json({ success: true, msg: "Show all bootcamps." });
};

export const getBootcampById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // obtain the bootcamp's id from the route parameter
  const { id } = req.params;

  // use service retrieve specific

  // send response to route
  res.status(200).json({
    success: true,
    msg: `Bootcamp with id = ${id} successfully retrieved.`,
  });
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
    res.status(500).json({
      error: `Server Error (POST /api/v1/bootcamps): ${err.message}`,
      stack: err.stack,
    });
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

export const updateBootcamp = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // obtain the bootcamp's id from the route parameter
  const { id } = req.params;

  // use service to update a bootcamp

  // send response to route
  res.status(200).json({
    success: true,
    msg: `Bootcamp with id = ${id} successfully modified.`,
  });
};

export const deleteBootcamp = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // obtain the bootcamp's id from the route parameter
  const { id } = req.params;

  // use service to delete a bootcamp

  // send repsonse to route
  res.status(200).json({
    success: true,
    msg: `Bootcamp with id = ${id} successfully deleted.`,
  });
};
