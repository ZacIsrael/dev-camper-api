// This file handles the interaction between the API & the bootcamp collection in MongoDB

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
};
