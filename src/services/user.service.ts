// This file handles the interaction between the API & the users collection in MongoDB

import type { CreateUserDTO } from "../dtos/user.dto.js";
import { User } from "../models/user.model.js";
import type { UserDocument } from "../models/user.model.js";
import type { UserType } from "../types/user.interface.js";
import type { Pagination } from "../types/pagination.interface.js";

export const userService = {
  // dto parameter is of type CreateUserDTO (see user.dto.ts)
  // this function returns a promise that has the structure of UserType (user interface)
  async createUser(
    dto: CreateUserDTO
  ): Promise<{ user: UserDocument; token: string }> {
    // Creates a user MongoDB document with cleaned up parameters passed in
    // from the data transfer object (dto) from user.dto.ts
    const user = new User({
      name: dto.name,
      email: dto.email,
      role: dto.role,
      password: dto.password,
    });
    // Saves the created user into the users MongoDB collection
    const savedUser = await user.save();
    // Create jwt token
    const token = savedUser.getSignedJwtToken();

    // return newly created user and jwt token back to the controller function
    return { user: savedUser, token };
  },

  // returns a promise that has an array of elements with the UserType structure
  async getAllUsers(
    select: any,
    sortBy: any,
    paginationObj: any
  ): Promise<{ users: UserType[]; pagination: Pagination }> {
    // Build a separate query to calculate the total number of users
    // This is used strictly for pagination metadata (next / prev)
    let total = User.find();

    // Apply the same select/sort options to keep counts consistent with the main query
    if (select) total.select(select);
    if (sortBy) total.sort(sortBy);

    // Total number of users
    const totalCount = await total.countDocuments();

    // Main query used to retrieve the actual user documents
    let query = User.find();

    // Apply field selection if provided
    if (select) query.select(select);

    // Apply sorting if provided
    if (sortBy) query.sort(sortBy);

    // Calculate the index of the last document on the current page
    const endIndex = paginationObj.page * paginationObj.limit;

    // paginationObj.skip is the same as the start index
    if (paginationObj?.skip >= 0) query.skip(paginationObj.skip);
    if (paginationObj?.limit > 0) query.limit(paginationObj.limit);

    // Execute the query and retrieve users
    const users = await query;

    // Initialize pagination response object
    const resultPagination: Pagination = {
      next: undefined,
      prev: undefined,
    };

    // Determine if a next page exists
    if (endIndex < totalCount) {
      resultPagination.next = {
        page: paginationObj.page + 1,
        limit: paginationObj.limit,
      };
    }

    // Determine if a previous page exists
    if (paginationObj.skip > 0) {
      resultPagination.prev = {
        page: paginationObj.page - 1,
        limit: paginationObj.limit,
      };
    }

    // Return user results along with pagination metadata
    return { users, pagination: resultPagination };
  },

  // returns a promise containing filtered users and pagination metadata
  async getFilteredUsers(
    filter: any,
    select: any,
    sortBy: any,
    paginationObj: any
  ): Promise<{ users: UserType[]; pagination: Pagination }> {
    // Build a separate query to calculate the total number of matching users
    // This is used strictly for pagination metadata (next / prev)
    let total = User.find(filter);

    // Apply the same select/sort options to keep counts consistent with the main query
    if (select) total.select(select);
    if (sortBy) total.sort(sortBy);

    // Total number of users that match the filter (ignores pagination)
    const totalCount = await total.countDocuments();

    // Main query used to retrieve the actual user documents
    let query = User.find(filter);

    // Apply field selection if provided
    if (select) query.select(select);

    // Apply sorting if provided
    if (sortBy) query.sort(sortBy);

    // Calculate the index of the last document on the current page
    const endIndex = paginationObj.page * paginationObj.limit;

    // paginationObj.skip is the same as the start index
    if (paginationObj?.skip >= 0) query.skip(paginationObj.skip);
    if (paginationObj?.limit > 0) query.limit(paginationObj.limit);

    // Execute the query and retrieve users
    const users = await query;

    // Initialize pagination response object
    const resultPagination: Pagination = {
      next: undefined,
      prev: undefined,
    };

    // Determine if a next page exists
    if (endIndex < totalCount) {
      resultPagination.next = {
        page: paginationObj.page + 1,
        limit: paginationObj.limit,
      };
    }

    // Determine if a previous page exists
    if (paginationObj.skip > 0) {
      resultPagination.prev = {
        page: paginationObj.page - 1,
        limit: paginationObj.limit,
      };
    }

    // Return user results along with pagination metadata
    return { users, pagination: resultPagination };
  },

  // Retrieves a user with a given id
  async getUserById(id: string): Promise<UserType | null> {
    // Note: password is excluded by default due to select: false in the schema
    const user = await User.findById(id);

    // Return retrieved user (or null if not found)
    return user;
  },

  // Retrieves a user by email (useful for login flows)
  async getUserByEmail(
    email: string,
    includePassword = false
  ): Promise<UserDocument | null> {
    // Create the query once
    const query = User.findOne({ email });

    // Mutate the query (no reassignment)
    if (includePassword) {
      query.select("+password");
    }

    // Execute and return
    return await query.exec();
  },

  // Updates a user with a given id
  async updateUserById(id: string, body: object): Promise<UserType | null> {
    // Finds a user by ID and applies partial updates from the request body
    // Returns the updated document instead of the original
    const user = await User.findByIdAndUpdate(id, body, {
      new: true,
      // Ensures mongoose schema validators run on the update
      runValidators: true,
    });

    // Return updated user (or null if not found)
    return user;
  },

  // Deletes a user with a given id
  async deleteUserById(id: string): Promise<UserType | null> {
    // Returns the deleted user or null if it never existed
    return await User.findByIdAndDelete(id);
  },

  // Sets password reset fields for a user (forgot password flow support)
  async setPasswordResetFields(
    userId: string,
    resetPasswordToken: string,
    resetPasswordExpire: Date
  ): Promise<UserType | null> {
    // Update reset fields; return updated user doc
    return await User.findByIdAndUpdate(
      userId,
      { resetPasswordToken, resetPasswordExpire },
      { new: true, runValidators: true }
    );
  },

  // Clears password reset fields (after successful reset)
  async clearPasswordResetFields(userId: string): Promise<UserType | null> {
    return await User.findByIdAndUpdate(
      userId,
      { resetPasswordToken: undefined, resetPasswordExpire: undefined },
      { new: true, runValidators: true }
    );
  },
};
