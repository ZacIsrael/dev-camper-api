// This interface defines the structure of a Bootcamp MongoDB Document.
// In other words, it reflects exactly what a document entry
// looks like in the "bootcamps" collection in MongoDB.

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

// MongoDB module
import mongoose, { Document, Schema } from "mongoose";
import type { Career } from "./career.type.js";

interface BootcampLocation {
  type: "Point";
  // [longitude, latitude]
  coordinates: [number, number]; 
  formattedAddress?: string;
  street?: string;
  city?: string;
  state?: string;
  zipcode?: string;
  country?: string;
}

export interface BootcampType extends Document {
  // When creating a Bootcamp, _id doesn’t exist yet. But when reading or updating documents, it will.
  _id: mongoose.Types.ObjectId;
  user: string;
  name: string;
  slug: string;
  description: string;
  website: string;
  phone: string;
  email: string;
  address: string;
  location: BootcampLocation;
  careers: Career[];
  averageRating: number;
  averageCost: number;
  // file name of photo
  photo: string;
  housing: boolean;
  jobAssistance: boolean;
  jobGuarantee: boolean;
  acceptGi: boolean;
  createdAt: Date;
}
