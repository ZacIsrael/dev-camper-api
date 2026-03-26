import type { Request, Response, NextFunction } from "express";
import { asyncHandler } from "../middleware/async.middleware.js";
import { userService } from "../services/user.service.js";
import { CreateUserDTO, UpdateUserDTO } from "../dtos/user.dto.js";
import { ErrorResponse } from "../utils/errorResponse.js";

export const getAllUsers = asyncHandler(
  async (req: any, res: Response, next: NextFunction) => {
    // Safe guard incase of accidental deletion of admin user when testing;
    // This will almost never happen in production
    if (!req.user) {
      throw new ErrorResponse("Authentication required", 401);
    }
    console.log("req.user = ", req.user);
    // message returned when not bootcamps are found
    let emptyReturnMsg = "There are no users in the 'user' mongoDB collection.";
    // message returned when bootcamps are found
    let foundUsersMsg =
      "Successfully retrieved all users from the 'user' mongoDB collection.";

    const results = await userService.getAllUsers(null, null, null);
    if (results === null) {
      throw new ErrorResponse("Error retrieving users", 500);
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
      throw new ErrorResponse("Authentication required", 401);
    }
    // debugging
    // console.log("req.user = ", req.user);
    if (!req.params.id) {
      throw new ErrorResponse("Add user id to query parameters", 400);
    }

    // middleware called in users route file validates the id
    const { id } = req.params;

    // retrieve the user
    const user = await userService.getUserById(id);

    if (user === null) {
      throw new ErrorResponse(`User with id = ${id} not found`, 404);
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
      throw new ErrorResponse("Authentication required", 401);
    }
    console.log("req.user = ", req.user);
    if (!req.body) {
      throw new ErrorResponse("Add body to this request", 400);
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
      throw new ErrorResponse("Authentication required", 401);
    }
    console.log("req.user = ", req.user);
    if (!req.params.id) {
      throw new ErrorResponse("Add user id to query parameters", 400);
    }

    // middleware called in users route file validates the id
    const { id } = req.params;

    if (!req.body) {
      throw new ErrorResponse("Add body to this request", 400);
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
      throw new ErrorResponse(
        `Update failed: user with id = ${id} not found`,
        404
      );
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
      // No user appears to be logged in
      throw new ErrorResponse("Authentication required", 401);
    }
    console.log("req.user = ", req.user);
    if (!req.params.id) {
      throw new ErrorResponse("Add user id to query parameters", 400);
    }

    // middleware called in users route file validates the id
    const { id } = req.params;

    // delete the user
    const userToBeDeleted = await userService.deleteUserById(id);

    // send response
    return res.status(204).json({
      success: true,
      msg: `User with id = ${id} successfully deleted.`,
      userToBeDeleted,
    });
  }
);
