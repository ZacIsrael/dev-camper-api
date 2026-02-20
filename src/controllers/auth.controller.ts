// This file is responsible for handling API requests that come in for authentication (register/login)

import type { Request, Response, NextFunction } from "express";

import bcrypt from "bcryptjs";

import crypto from "crypto";

import { asyncHandler } from "../middleware/async.middleware.js";

import {
  CreateUserDTO,
  ForgotPasswordDTO,
  LoginDTO,
} from "../dtos/user.dto.js";
import { userService } from "../services/user.service.js";

import { isNonEmptyString } from "../utils/helpers.js";
import type { UserType } from "../types/user.interface.js";
import type { UserDocument } from "../models/user.model.js";

// Import dotenv to load environment variables from a file
import dotenv from "dotenv";

// Import Node.js path utilities for resolving file paths
import path from "node:path";

// Import helper to convert module URL to file path (ESM-compatible)
import { fileURLToPath } from "node:url";
import { sendEmail } from "../utils/sendEmail.js";

// Convert the current module URL into an absolute file path
const __filename = fileURLToPath(import.meta.url);

// Derive the directory name from the current file path
const __dirname = path.dirname(__filename);

// Load environment variables from a custom config file
dotenv.config({
  // Resolve the absolute path to config.env
  path: path.resolve(__dirname, "../config/config.env"),
});

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

// Get the currently authenticated user's profile
export const getMe = asyncHandler(
  async (req: any, res: Response, next: NextFunction) => {
    // req.user is populated by the protect middleware (auth.middleware.ts) after JWT verification
    const user = await userService.getUserById(req.user.id);

    res.status(200).json({
      success: true,
      data: user,
    });
  }
);

// Patch request for updating a user's name & email
export const updateDetails = asyncHandler(
  async (req: any, res: Response, next: NextFunction) => {
    // Makes no sense to call this function if neither the user's name or email is getting updated
    if (!req.body.name && !req.body.email) {
      return res.status(400).json({
        success: false,
        error: "Must add a name, email, or both to be updated",
      });
    }

    // Build update object dynamically
    const fieldsToUpdate: { name?: string; email?: string } = {};

    // if a name is in the body, update it
    if (req.body.name) fieldsToUpdate.name = req.body.name;
    // if an email is in the body, update it
    if (req.body.email) fieldsToUpdate.email = req.body.email;

    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "User fields can't be updated; No user is logged in",
      });
    }
    // req.user is populated by the protect middleware (auth.middleware.ts) after JWT verification
    const user = await userService.updateUserById(req.user.id, fieldsToUpdate);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }
    res.status(200).json({
      success: true,
      data: user,
    });
  }
);

// Patch request to update a logged in user's password
export const updatePassword = asyncHandler(
  async (req: any, res: Response, next: NextFunction) => {
    if (!req.user.id) {
      return res.status(401).json({
        success: false,
        error: "User fields can't be updated; No user is logged in",
      });
    }

    if (!req.body.currentPassword) {
      return res.status(400).json({
        success: false,
        error: "Enter your current password",
      });
    }

    if (!req.body.newPassword) {
      return res.status(400).json({
        success: false,
        error: "Add a new password",
      });
    }

    // req.user is populated by the protect middleware (auth.middleware.ts) after JWT verification
    const user = await userService.getUserByIdWithPassword(req.user.id);

    if (user === null) {
      return res.status(404).json({
        success: false,
        error: `User with id = ${req.user.id} not found`,
      });
    }

    // check if the (hashed) current password from the request body matches the (hashed) password in the database
    // if they don't match, then the password will not be updated

    if (!(await user.matchPassword(req.body.currentPassword))) {
      return res.status(401).json({
        success: false,
        error: "Password is incorrect",
      });
    }

    const updatedUser = await userService.updatePasswordById(
      user._id.toString(),
      req.body.newPassword
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    sendTokenResponse(updatedUser, 200, res);

    // res.status(200).json({
    //   success: true,
    //   data: updatedUser,
    // });
  }
);

// function that allows a user to creat a new password
export const forgotPassword = asyncHandler(
  async (req: any, res: Response, next: NextFunction) => {
    const dto = new ForgotPasswordDTO(req.body);

    const user = await userService.getUserByEmail(dto.email, false);

    if (user === null) {
      return res.status(404).json({
        success: false,
        error: `User with email = ${dto.email} not found`,
      });
    }

    // Generate reset token (plain token returned; hashed token + expiry set on user doc)
    const resetToken = user.getResetPasswordToken();

    // Persist hashed token + expiry using your service (NOT undefined)
    await userService.setPasswordResetFields(
      user._id.toString(),
      // set by getResetPasswordToken()
      user.resetPasswordToken!,
      // set by getResetPasswordToken()
      user.resetPasswordExpire!
    );

    if (!req.protocol) {
      return res.status(400).json({
        success: false,
        error: `The request protocol does not exist`,
      });
    }

    const resetUrl = `${req.protocol}://${req.get(
      "host"
    )}/api/v1/auth/resetpassword/${resetToken}`;

    const message =
      `You are receiving this email because you (or someone else) has requested a password reset.\n\n` +
      `Please make a PATCH request to:\n\n${resetUrl}`;

    try {
      await sendEmail({
        email: user.email,
        subject: "Password reset token",
        message,
      });

      return res.status(200).json({
        success: true,
        data: "Email sent",
      });
    } catch (err: any) {
      console.log(err);

      // Clear reset fields via user service (avoids null + avoids undefined params)
      await userService.clearPasswordResetFields(user._id.toString());

      return res.status(500).json({
        success: false,
        error: "Email could not be sent",
      });
    }
  }
);

// Patch request for resetting a forgotten password
export const resetPassword = asyncHandler(
  async (req: any, res: Response, next: NextFunction) => {
    // extract reset token from query parameters
    const { resettoken } = req.params;

    if (!resettoken) {
      return res.status(400).json({
        success: false,
        error: "Bad Request: resettoken is not in query parameters",
      });
    }

    // Get the hashed token
    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(resettoken)
      .digest("hex");

    // Retrieve the user using the resettoken
    const user = await userService.getUserByValidResetToken(resetPasswordToken);

    if (!user) {
      return res.status(400).json({
        success: false,
        error: "Invalid or expired token",
      });
    }

    // check to see if a password was sent in the body of the request
    if (!req.body.password) {
      return res.status(400).json({
        success: false,
        error: "Enter a new password",
      });
    }

    const newPassword = req.body.password;

    // middleware in user.model.ts will automatically encrypt the new password
    const updatedUser = await userService.updatePasswordById(
      user._id.toString(),
      newPassword
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }
    // Clear reset fields after successful password update (avoids null + avoids undefined params)
    await userService.clearPasswordResetFields(user._id.toString());

    sendTokenResponse(updatedUser, 200, res);

    // res.status(200).json({
    //   success: true,
    //   data: user,
    // });
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
