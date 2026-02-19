// This file handles the interaction between the API & the bootcamp collection in MongoDB

import type { ObjectId } from "mongoose";
import type { CreateBootcampDTO } from "../dtos/bootcamp.dto.js";
import { Bootcamp } from "../models/bootcamp.model.js";
import type { BootcampType } from "../types/bootcamp.interface.js";
import type { Pagination } from "../types/pagination.interface.js";

export const bootcampService = {
  // dto parameter is of type CreateBootcampDTO (see bootcamp.dto.ts)
  // this function returns a promise that has the structure of BootcampType (bootcamp interface)
  async createBootcamp(dto: CreateBootcampDTO): Promise<BootcampType> {
    // creates a bootcamp MongoDB document with cleaned up parameters passed in
    // from the data transfer object (dto) from bootcamp.dto.ts
    const bootcamp = new Bootcamp({
      name: dto.name,
      user: dto.user,
      description: dto.description,
      website: dto.website,
      phone: dto.phone,
      email: dto.email,
      address: dto.address,
      careers: dto.careers,
      housing: dto.housing,
      jobAssistance: dto.jobAssistance,
      jobGuarantee: dto.jobGuarantee,
      acceptGi: dto.acceptGi,
      // for now until I implement how to create a location entry
      //   location: null,
    });

    // saves the created video into the bootcamp MongoDB collection
    return await bootcamp.save();
  },
  // returns a promise that has an array of elements with the BootcampType structure
  async getAllBootcamps(
    select: any,
    sortBy: any,
    paginationObj: any
  ): Promise<{ bootcamps: BootcampType[]; pagination: Pagination }> {
    // retrieves all of the bootcamp documents from the bootcamp MongoDB collection

    // total # of bootcamps in the collection
    // Build a separate query to calculate the total number of bootcamps
    // This is used strictly for pagination metadata (next / prev)
    let total = Bootcamp.find();

    // Apply the same select/sort options to keep counts consistent with the main query
    if (select) total.select(select);
    if (sortBy) total.sort(sortBy);

    // Total number of bootcamps
    let totalCount = await total.countDocuments();

    // Main query used to retrieve the actual bootcamp documents
    let query = Bootcamp.find();

    // Apply field selection if provided
    if (select) query.select(select);

    // Apply sorting if provided
    if (sortBy) query.sort(sortBy);

    // Calculate the index of the last document on the current page
    const endIndex = paginationObj.page * paginationObj.limit;

    // spaginationObj.skip is the same as the start index
    if (paginationObj?.skip >= 0) query.skip(paginationObj.skip);
    if (paginationObj?.limit > 0) query.limit(paginationObj.limit);

    // Execute the query and retrieve bootcamp results

    // populate() will allows for an array of courses to be displayed.
    // Refer to Bootcamp model (bootcamp.model.ts) to
    // see the definition of the virtual courses field
    let bootcamps = await query.populate("courses");

    // Initialize pagination response object
    let resultPagination: Pagination = {
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

    // Return bootcamp results along with pagination metadata
    return { bootcamps: bootcamps, pagination: resultPagination };
  },

  // returns a promise containing filtered bootcamps and pagination metadata
  async getFilteredBootcamps(
    filter: any,
    select: any,
    sortBy: any,
    paginationObj: any
  ): Promise<{ bootcamps: BootcampType[]; pagination: Pagination }> {
    // retrieves all of the bootcamp documents from the
    // bootcamp MongoDB collection that match the specified filter

    // Build a separate query to calculate the total number of matching bootcamps
    // This is used strictly for pagination metadata (next / prev)
    let total = Bootcamp.find(filter);

    // Apply the same select/sort options to keep counts consistent with the main query
    if (select) total.select(select);
    if (sortBy) total.sort(sortBy);

    // Total number of bootcamps that match the filter (ignores pagination)
    let totalCount = await total.countDocuments();

    // Main query used to retrieve the actual bootcamp documents
    let query = Bootcamp.find(filter);

    // Apply field selection if provided
    if (select) query.select(select);

    // Apply sorting if provided
    if (sortBy) query.sort(sortBy);

    // Calculate the index of the last document on the current page
    const endIndex = paginationObj.page * paginationObj.limit;

    // spaginationObj.skip is the same as the start index
    if (paginationObj?.skip >= 0) query.skip(paginationObj.skip);
    if (paginationObj?.limit > 0) query.limit(paginationObj.limit);

    // Execute the query and retrieve bootcamp results

    // populate() will allows for an array of courses to be displayed.
    // Refer to Bootcamp model (bootcamp.model.ts) to
    // see the definition of the virtual courses field
    let bootcamps = await query.populate("courses");

    // Initialize pagination response object
    let resultPagination: Pagination = {
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

    // Return bootcamp results along with pagination metadata
    return { bootcamps: bootcamps, pagination: resultPagination };
  },

  // Retrieves a bootcamp with a given id
  async getBootcampById(id: string): Promise<BootcampType | null> {
    const bootcamp = await Bootcamp.findById(id);

    // return retrieved bootcamp
    // if it's null, that means it does not exist; gets handled in the controller
    return bootcamp;
  },

  // Updates a bootcamp with a given id
  async updateBootcampById(
    id: string,
    body: Object
  ): Promise<BootcampType | null> {
    // Finds a bootcamp by ID and applies partial updates from the request body
    // Returns the updated document instead of the original
    const bootcamp = await Bootcamp.findByIdAndUpdate(id, body, {
      new: true,
      // Ensures mongoose schema validators run on the update
      runValidators: true,
    });
    // Returns the updated bootcamp document
    // Null indicates the bootcamp was not found (handled in controller)
    return bootcamp;
  },

  // Deletes a bootcamp with a given id
  async deleteBootcampById(id: string) {
    // returns the deleted bootcamp or null if it never existed
    return await Bootcamp.findByIdAndDelete(id);
  },
};
