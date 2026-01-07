// MongoDB module
import mongoose, { Document, Schema, model } from "mongoose";

import type { BootcampType } from "../types/bootcamp.interface.js";

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
const bootcampSchema = new Schema<BootcampType>({
  name: {
    type: String,
    required: [true, "Please add a name"],
    // can't have the same name as another bootcamp document in the collection
    unique: true,
    // remove leading and trailing white space
    trim: true,
    maxLength: [50, "Name can't be longer than 50 characters"],
  },
  // URL friendly version of the name
  slug: String,
  description: {
    type: String,
    required: [true, "Please add a description"],

    maxLength: [165, "Description can't be longer than 165 characters"],
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
});

// create and export this Bootcamp model
export const Bootcamp = model<BootcampType>("Bootcamp", bootcampSchema);
