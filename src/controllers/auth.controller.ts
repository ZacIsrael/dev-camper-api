// This file is responsible for handling API requests that come in for authentication (register/login)

import type { Request, Response, NextFunction } from "express";

import { asyncHandler } from "../middleware/async.middleware.js";

import { CreateUserDTO } from "../dtos/user.dto.js";
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
    // obtain email/password from request body
    const { email, password } = req.body as {
      email?: unknown;
      password?: unknown;
    };

    // validate email
    if (!isNonEmptyString(email)) {
      return res.status(400).json({
        success: false,
        error: "Please provide an email",
      });
    }

    // validate password
    if (!isNonEmptyString(password)) {
      return res.status(400).json({
        success: false,
        error: "Please provide a password",
      });
    }

    // look up user by email (includePassword = true so we can compare)
    const user = await userService.getUserByEmail(email, true);

    // invalid credentials (do not reveal whether email exists)
    if (user === null) {
      return res.status(401).json({
        success: false,
        error: "Invalid credentials",
      });
    }

    // ==========================
    // TEMP BASELINE PASSWORD CHECK
    // ==========================
    // Right now your user.model.ts does not show hashing or a matchPassword method,
    // so this is a plaintext compare baseline.
    //
    // Once you add hashing (bcrypt) in a pre-save hook, replace this with:
    // const isMatch = await bcrypt.compare(password, user.password);
    const isMatch = user.password === password;

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: "Invalid credentials",
      });
    }

    // Ensure password isn't returned to the client
    (user as any).password = undefined;

    // send response (token logic will be added later if your course does JWT)
    return res.status(200).json({
      success: true,
      msg: "Login successful.",
      user,
    });
  }
);
