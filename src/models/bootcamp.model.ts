// MongoDB module
import mongoose, {
  Document,
  Schema,
  model,
  type HydratedDocument,
} from "mongoose";

import type { BootcampType } from "../types/bootcamp.interface.js";

import slugify from "slugify";

import { geocoder } from "../utils/geocoder.js";

/*

Example Bootcamp structure:

    {
		"_id": "5d713995b721c3bb38c1f5d0",
		"user": "5d7a514b5d2c12c7449be045",
		"name": "Devworks Bootcamp",
		"description": "Devworks is a full stack JavaScript Bootcamp located in the heart of Boston that focuses on the technologies you need to get a high paying job as a web developer",
		"website": "https://devworks.com",
		"phone": "(111) 111-1111",
		"email": "enroll@devworks.com",
		"address": "233 Bay State Rd Boston MA 02215",
		"careers": ["Web Development", "UI/UX", "Business"],
		"housing": true,
		"jobAssistance": true,
		"jobGuarantee": false,
		"acceptGi": true
	}

*/

// schema for "bootcamp" collection
const bootcampSchema = new Schema<BootcampType>(
  {
    name: {
      type: String,
      required: [true, "Please add a name"],
      // can't have the same name as another bootcamp document in the collection
      unique: true,
      // remove leading and trailing white space
      trim: true,
      maxLength: [50, "Name can't be longer than 50 characters"],
    },
    // User that uploaded the Bootcamp
    user: {
      type: mongoose.Schema.ObjectId,
      required: true,
      ref: "User",
    },
    // URL friendly version of the name
    slug: String,
    description: {
      type: String,
      required: [true, "Please add a description"],

      maxLength: [250, "Description can't be longer than 250 characters"],
    },
    website: {
      type: String,
      match: [
        /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/,
        "Please use a valid URL with HTTP or HTTPS",
      ],
    },
    phone: {
      type: String,
      maxLength: [20, "Phone number can't be longer than 20 characters"],
    },
    email: {
      type: String,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please add a valid email"],
    },
    address: {
      type: String,
      required: [true, "Please add an address"],
    },
    location: {
      // GeoJSON Point
      type: {
        type: String,
        enum: ["Point"],
        // required: true,
        // just for now until I learn how to add a location
        required: false,
      },
      coordinates: {
        type: [Number],
        // required: true,
        // just for now until I learn how to add a location
        required: false,
        index: "2dsphere",
      },
      formattedAddress: String,
      street: String,
      city: String,
      state: String,
      zipcode: String,
      country: String,
    } as any,

    careers: {
      type: [String],
      required: true,
      enum: [
        "Web Development",
        "Mobile Development",
        "UI/UX",
        "Data Science",
        "Business",
        "Other",
      ],
    },

    averageRating: {
      type: Number,
      min: [1, "Rating must be at least 1"],
      max: [10, "Rating can't be more than 10"],
    },

    averageCost: Number,

    photo: {
      type: String,
      // points to an image titled no-photo.jpg (will be on the frontend)
      default: "no-photo.jpg",
    },

    housing: {
      type: Boolean,
      default: false,
    },
    jobAssistance: {
      type: Boolean,
      default: false,
    },
    jobGuarantee: {
      type: Boolean,
      default: false,
    },
    acceptGi: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  // Schema options object (3rd argument / options param) that controls how documents are serialized
  {
    // Controls what happens when you a document is sent as JSON (ex: res.json(bootcamp))
    toJSON: {
      // Ensures virtual fields (computed / not stored in MongoDB) are included in JSON output
      virtuals: true,
    },

    // Controls what happens when a document is converted into a plain JS object (ex: doc.toObject())
    toObject: {
      // Ensures virtual fields are included when converting to a plain object as well
      virtuals: true,
    },
  }
);

// Create bootcamp slug from the name
// Pre-save middleware that runs BEFORE a Bootcamp document is saved to MongoDB
bootcampSchema.pre<HydratedDocument<BootcampType>>(
  "save",
  // Async middleware function executed during the `.save()` lifecycle
  async function (next) {
    // Cast the current Mongoose document (`this`) to the BootcampType
    // This allows TypeScript to recognize custom Bootcamp fields like `slug`
    const bootcamp = this as BootcampType;
    console.log("bootcampSchema.pre: bootcamp: ", bootcamp);

    // Generate a URL-friendly slug from the bootcamp's name
    // `slugify` converts the name to lowercase and trims extra whitespace
    bootcamp.slug = (slugify as unknown as Function)(this.name, {
      lower: true,
      trim: true,
    });
    // Because this middleware is async, Mongoose automatically proceeds
    // once the Promise resolves, so calling `next()` is NOT required here
  }
);

// Geocode & create location field
bootcampSchema.pre<HydratedDocument<BootcampType>>(
  "save",
  async function (next) {
    const loc = await geocoder.geocode(this.address);

    // Ensure geocoding returned results
    if (!loc.length) {
      throw new Error("Geocoding failed: no location found");
    }

    const { latitude, longitude } = loc[0];

    // Ensure both values exist
    if (latitude == null || longitude == null) {
      throw new Error("Geocoding failed: invalid coordinates");
    }

    this.location.type = "Point";
    this.location.coordinates = [longitude, latitude];
    this.location.formattedAddress = loc[0].formattedAddress;
    this.location.street = loc[0].streetName;
    this.location.city = loc[0].city;
    this.location.state = loc[0].stateCode;
    this.location.zipcode = loc[0].zipcode;
    this.location.country = loc[0].countryCode;

    // No longer necessary to save the address field into the database
    // because we have the geo location
    this.address = "";

    // Because this middleware is async, Mongoose automatically proceeds
    // once the Promise resolves, so calling `next()` is NOT required here
  }
);

// If a bootcamp is about to get deleted, delete all of its courses first
// Query middleware that runs BEFORE a Bootcamp is deleted using `findByIdAndDelete()`
bootcampSchema.pre("findOneAndDelete", async function () {
  // 'this' refers to the Mongoose query, NOT the document itself
  // 'getFilter()' retrieves the query conditions (e.g., { _id: bootcampId })
  const docToDelete = await this.model
    .findOne(this.getFilter())
    // Only select the '_id' since that's all that's needed
    // This avoids fetching unnecessary document data
    .select("_id");

  // If a matching Bootcamp document was found
  // (must do a null check; the delete operation could be called with a non-existent ID)
  if (docToDelete?._id) {
    // Remove all Course documents that reference this Bootcamp
    // via the 'bootcamp' foreign key field
    await mongoose.model("Course").deleteMany({ bootcamp: docToDelete._id });
  }
});

// Define a virtual field called "courses" on Bootcamp documents (not stored in MongoDB)
bootcampSchema.virtual("courses", {
  // Tell Mongoose which model to use when populating this virtual field
  ref: "Course",

  // Use Bootcamp._id as the value to match against in the Course collection
  localField: "_id",

  // Match Bootcamp._id to the Course.bootcamp field (which stores the bootcamp ObjectId)
  foreignField: "bootcamp",

  // Return an array of matching Course documents (one bootcamp can have many courses)
  justOne: false,
});

// create and export this Bootcamp model
export const Bootcamp = model<BootcampType>("Bootcamp", bootcampSchema);
