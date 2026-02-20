import type { Request, Response, NextFunction } from "express";
import { asyncHandler } from "../middleware/async.middleware.js";
import { userService } from "../services/user.service.js";
import { CreateUserDTO, UpdateUserDTO } from "../dtos/user.dto.js";
import mongoose from "mongoose";

export const getAllUsers = asyncHandler(
  async (req: any, res: Response, next: NextFunction) => {
    // Safe guard incase of accidental deletion of admin user when testing;
    // This will almost never happen in production
    if (!req.user) {
      return res.status(401).json({
        success: false,
        // No user appears to be logged in
        error: "Authentication required",
      });
    }
    console.log("req.user = ", req.user);
    // message returned when not bootcamps are found
    let emptyReturnMsg = "There are no users in the 'user' mongoDB collection.";
    // message returned when bootcamps are found
    let foundUsersMsg =
      "Successfully retrieved all users from the 'user' mongoDB collection.";

    const results = await userService.getAllUsers(null, null, null);
    if (results === null) {
      return res.status(500).json({
        success: false,
        error: "Error retrieving users",
      });
    }

    // length of array of users
    const length = results.users.length;

    // Successfully retrieved all users
    res.status(200).json({
      success: true,
      users: results.users,
      count: length,
      msg: length === 0 ? emptyReturnMsg : foundUsersMsg,
    });
  }
);

export const getUserById = asyncHandler(
  async (req: any, res: Response, next: NextFunction) => {
    // Safe guard incase of accidental deletion of admin user when testing;
    // This will almost never happen in production
    if (!req.user) {
      return res.status(401).json({
        success: false,
        // No user appears to be logged in
        error: "Authentication required",
      });
    }
    console.log("req.user = ", req.user);
    if (!req.params.id) {
      return res.status(400).json({
        success: false,
        error: "Add user id to query parameters",
      });
    }

    const { id } = req.params;

    // 400: invalid ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: `Invalid user id: ${id}`,
      });
    }
    // retrieve the user
    const user = await userService.getUserById(id);

    if (user === null) {
      return res.status(404).json({
        success: false,
        error: `User with id = ${id} not found`,
      });
    }

    res.status(200).json({
      success: true,
      user,
    });
  }
);

// create user
export const createUser = asyncHandler(
  async (req: any, res: Response, next: NextFunction) => {
    // Safe guard incase of accidental deletion of admin user when testing;
    // This will almost never happen in production
    if (!req.user) {
      return res.status(401).json({
        success: false,
        // No user appears to be logged in
        error: "Authentication required",
      });
    }
    console.log("req.user = ", req.user);
    if (!req.body) {
      return res.status(400).json({
        success: false,
        error: "Add body to this request",
      });
    }
    // see what's in the body of the request
    console.log("register: req.body = ", req.body);

    // data transfer object (object that will contain the processed request)
    let dto: CreateUserDTO;

    // process and validate the body of the request (see user.dto.ts)
    dto = new CreateUserDTO(req.body);
    console.log("register: dto = ", dto);

    // Create the user via the service layer.
    // createUser returns a the newly created user MongoDB document and its jwt token
    const { user, token } = await userService.createUser(dto);

    // send response
    return res.status(201).json({
      success: true,
      msg: "Successfully created user.",
      user: user,
    });
  }
);

// update user
export const updateUser = asyncHandler(
  async (req: any, res: Response, next: NextFunction) => {
    // Safe guard incase of accidental deletion of admin user when testing;
    // This will almost never happen in production
    if (!req.user) {
      return res.status(401).json({
        success: false,
        // No user appears to be logged in
        error: "Authentication required",
      });
    }
    console.log("req.user = ", req.user);
    if (!req.params.id) {
      return res.status(400).json({
        success: false,
        error: "Add user id to query parameters",
      });
    }

    const { id } = req.params;

    // 400: invalid ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: `Invalid user id: ${id}`,
      });
    }
    if (!req.body) {
      return res.status(400).json({
        success: false,
        error: "Add body to this request",
      });
    }
    // see what's in the body of the request
    console.log("register: req.body = ", req.body);

    // data transfer object (object that will contain the processed request)
    let dto: UpdateUserDTO;

    // process and validate the body of the request (see user.dto.ts)
    dto = new UpdateUserDTO(req.body);
    console.log("register: dto = ", dto);

    // update the user
    const user = await userService.adminUpdateUserById(id, dto);

    if (user === null) {
      return res.status(404).json({
        success: false,
        error: `Update failed: user with id = ${id} not found`,
      });
    }

    // send response
    return res.status(200).json({
      success: true,
      msg: "Successfully updated user.",
      user: user,
    });
  }
);

// delete user
export const deleteUser = asyncHandler(
  async (req: any, res: Response, next: NextFunction) => {
    // Safe guard incase of accidental deletion of admin user when testing;
    // This will almost never happen in production
    if (!req.user) {
      return res.status(401).json({
        success: false,
        // No user appears to be logged in
        error: "Authentication required",
      });
    }
    console.log("req.user = ", req.user);
    if (!req.params.id) {
      return res.status(400).json({
        success: false,
        error: "Add user id to query parameters",
      });
    }

    const { id } = req.params;

    // 400: invalid ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: `Invalid user id: ${id}`,
      });
    }

    // delete the user
    const userToBeDeleted = await userService.deleteUserById(id);

    // if (userToBeDeleted === null) {
    //   return res.status(404).json({
    //     success: false,
    //     error: `Update failed: user with id = ${id} not found`,
    //   });
    // }

    // send response
    return res.status(204).json({
      success: true,
      msg: `User with id = ${id} successfully deleted.`,
      userToBeDeleted,
    });
  }
);
