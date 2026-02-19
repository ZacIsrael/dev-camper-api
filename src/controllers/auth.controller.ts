// This file is responsible for handling API requests that come in for authentication (register/login)

import type { Request, Response, NextFunction } from "express";

import bcrypt from "bcryptjs";

import { asyncHandler } from "../middleware/async.middleware.js";

import { CreateUserDTO, LoginDTO } from "../dtos/user.dto.js";
import { userService } from "../services/user.service.js";

import { isNonEmptyString } from "../utils/helpers.js";

export const register = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
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
      msg: "User successfully registered.",
      user: user,
      token,
    });
  }
);

export const login = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const dto = new LoginDTO(req.body);

    // look up user by email (includePassword = true)
    const user = await userService.getUserByEmail(dto.email, true);

    // invalid credentials (best practice not to reveal whether email exists)
    if (user === null) {
      return res.status(401).json({
        success: false,
        error: "Invalid credentials",
      });
    }

    // check to see if the password matches
    const isMatch = await user.matchPassword(dto.password);

    // password in the request does not match the password that is 
    // stored with the user with the specified email
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: "Invalid credentials",
      });
    }

    // Ensure that the password is NOT returned to the client
    (user as any).password = undefined;

    // user entered valid credential so generate token generate token
    const token = user.getSignedJwtToken();

    // send response 
    return res.status(200).json({
      success: true,
      msg: "Login successful.",
      user,
      token
    });
  }
);
