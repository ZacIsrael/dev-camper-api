// This file is responsible for handling API requests that come in for bootcamps

// Import the Express framework for building HTTP servers
import express from "express";
import type { Application, Request, Response, NextFunction } from "express";

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
  // use service retrieve specific

  // send response to route
  res.status(200).json({
    success: true,
    msg: `Bootcamp with id = ${req.params.id} successfully retrieved.`,
  });
};

export const addBootcamp = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // use service to add bootcamp

  // send response to route
  res.status(200).json({ success: true, msg: "Bootcamp successfully added." });
};

export const replaceBootcamp = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // use service to replace a bootcamp

  // send response to route
  res.status(200).json({
    success: true,
    msg: `Bootcamp with id = ${req.params.id} successfully replaced.`,
  });
};

export const updateBootcamp = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // use service to update a bootcamp

  // send response to route
  res.status(200).json({
    success: true,
    msg: `Bootcamp with id = ${req.params.id} successfully modified.`,
  });
};

export const deleteBootcamp = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // use service to delete a bootcamp

  // send repsonse to route
  res.status(200).json({
    success: true,
    msg: `Bootcamp with id = ${req.params.id} successfully deleted.`,
  });
};
