// This file handles the interaction between the API & the bootcamp collection in MongoDB

import type { ObjectId } from "mongoose";
import type { CreateBootcampDTO } from "../dtos/bootcamp.dto.js";
import { Bootcamp } from "../models/bootcamp.model.js";
import type { BootcampType } from "../types/bootcamp.interface.js";

export const bootcampService = {
  // dto parameter is of type CreateBootcampDTO (see bootcamp.dto.ts)
  // this function returns a promise that has the structure of BootcampType (bootcamp interface)
  async createBootcamp(dto: CreateBootcampDTO): Promise<BootcampType> {
    // creates a bootcamp MongoDB document with cleaned up parameters passed in
    // from the data transfer object (dto) from bootcamp.dto.ts
    const bootcamp = new Bootcamp({
      name: dto.name,
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
  async getAllBootcamps(sort: any): Promise<BootcampType[]> {
    // retrieves all of the bootcamp documents from the bootcamp MongoDB collection
    return await Bootcamp.find().select(sort);
  },

  // returns a promise that has an array of elements with the BootcampType structure
  async getFilteredBootcamps(filter: any, sort: any): Promise<BootcampType[]> {
    // retrieves all of the bootcamp documents from the
    // bootcamp MongoDB collection that match the specified filter
    return await Bootcamp.find(filter).select(sort);
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
