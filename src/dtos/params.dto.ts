import { assertIsObject } from "../utils/helpers.js";
import { isValidObjectId, rejectUnknownFields } from "../utils/validation.js";


// Generic :id validator (for MongoDB)
// For routes like /bootcamps/:id, /courses/:id, /reviews/:id, /users/:id

export class IdParamDTO {
  id: string;

  constructor(data: unknown) {
    const payload = assertIsObject(data, "Route params must be a valid object");;

    rejectUnknownFields(payload, ["id"]);

    // Deconstruct payload object and retrieve id
    const { id } = payload;

    // Check if the id is in MongoDB document id format
    // This API is only integrated with MongoDB
    // For other APIs, implement a function that checks if the
    // id passed is in the correct format of an id in the respective
    // database.
    if (!isValidObjectId(id)) {
      throw new Error("Route parameter 'id' must be a valid Mongo ObjectId");
    }

    // Assign the validated id
    this.id = id;
  }
}

// Validator for nested bootcamp routes like /bootcamps/:bootcampId/courses
export class BootcampIdParamDTO {
  bootcampId: string;

  constructor(data: unknown) {
    // Ensure that the data passed is an object
    const payload = assertIsObject(data, "Route params must be a valid object");;

    rejectUnknownFields(payload, ["bootcampId"]);

    const { bootcampId } = payload;

    if (!isValidObjectId(bootcampId)) {
      throw new Error(
        "Route parameter 'bootcampId' must be a valid Mongo ObjectId"
      );
    }

    this.bootcampId = bootcampId;
  }
}
