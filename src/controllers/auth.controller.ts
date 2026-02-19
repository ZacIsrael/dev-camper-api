// This file is responsible for handling API requests that come in for authentication (register/login)

import type { Request, Response, NextFunction } from "express";

import bcrypt from "bcryptjs";

import { asyncHandler } from "../middleware/async.middleware.js";

import { CreateUserDTO, LoginDTO } from "../dtos/user.dto.js";
import { userService } from "../services/user.service.js";

import { isNonEmptyString } from "../utils/helpers.js";
import type { UserType } from "../types/user.interface.js";
import type { UserDocument } from "../models/user.model.js";

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
    /*
    // user entered valid credential so generate token
    const token = user.getSignedJwtToken();

    // send response
    return res.status(200).json({
      success: true,
      msg: "Login successful.",
      user,
      token,
    });
    */

    sendTokenResponse(user, 200, res);
  }
);

// Retrieve token from model, create cookie and send response
// Helper function to generate a JWT, set it in an HTTP-only cookie,
// and send a standardized auth response back to the client
const sendTokenResponse = (
  user: UserDocument,
  statusCode: number,
  res: Response
) => {
  // Call the instance method on the user model to create a signed JWT
  const token = user.getSignedJwtToken();

  // Cookie configuration options 
  const options: {
    expires: Date;
    httpOnly: boolean;
    secure?: boolean;
  } = {
    // Set cookie expiration based on env variable (in days)
    expires: new Date(
      Date.now() +
        (Number(process.env.JWT_COOKIE_EXPIRES_IN) || 1) * 24 * 60 * 60 * 1000
    ),

    // Prevent client-side JavaScript from accessing the cookie (mitigates XSS attacks)
    httpOnly: true,
  };

  // Ensure cookies are only sent over HTTPS in production
  if (process.env.NODE_ENV === "production") {
    options.secure = true;
  }

  // Send response with JWT stored in cookie and included in JSON body
  res.status(statusCode).cookie("token", token, options).json({
    success: true,
    token,
  });
};
