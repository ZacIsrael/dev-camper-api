// This file handles the interaction between the API & the course collection in MongoDB

import { CreateCourseDTO } from "../dtos/course.dto.js";
import { Course } from "../models/course.model.js";

import type { CourseType } from "../types/course.interface.js";
import type { Pagination } from "../types/pagination.interface.js";

export const courseService = {
  // dto parameter is of type CreateCourseDTO (see course.dto.ts)
  // this function returns a promise that has the structure of CourseType (course interface)

  async createCourse(dto: any): Promise<CourseType | null> {
    // creates a course MongoDB document with cleaned up parameters passed in
    // from the data transfer object (dto) from course.dto.ts

    const course = new Course({
      title: dto.title,
      description: dto.description,
      minimumSkill: dto.minimumSkill,
      tuition: dto.tuition,
      weeks: dto.weeks,
      scholarhipsAvailable: dto.scholarhipsAvailable,
      bootcamp: dto.bootcamp,
      // will worry about this once User schema has been implemented
      // user: dto.user
    });

    // create the new course db document
    return await course.save();
  },

  // returns a promise that has an array of elements with the CourseType structure
  async getAllCourses(
    filter: any,
    select: any,
    sortBy: any,
    paginationObj: any
  ): Promise<{ courses: CourseType[]; pagination: Pagination }> {
    // retrieves all of the course documents from the bootcamp MongoDB collection

    // total # of courses in the collection
    // Build a separate query to calculate the total number of courses
    // This is used strictly for pagination metadata (next / prev)
    let total = Course.find(filter);

    // Apply the same select/sort options to keep counts consistent with the main query
    if (select) total.select(select);
    if (sortBy) total.sort(sortBy);

    // Total number of courses
    let totalCount = await total.countDocuments();

    // Main query used to retrieve the actual course documents
    let query = Course.find(filter);

    // Apply field selection if provided
    if (select) query.select(select);

    // Apply sorting if provided
    if (sortBy) query.sort(sortBy);

    // Calculate the index of the last document on the current page
    const endIndex = paginationObj.page * paginationObj.limit;

    // spaginationObj.skip is the same as the start index
    if (paginationObj?.skip >= 0) query.skip(paginationObj.skip);
    if (paginationObj?.limit > 0) query.limit(paginationObj.limit);

    // Execute the query and retrieve bootcamp results.

    // populate() will allows for the entire bootcamp to be
    // returned instead of only returning its id.
    let courses = await query.populate({
      path: "bootcamp",
      // only display the following fields from the bootcamp document
      select: 'name description _id'
    });

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

    // Return course results along with pagination metadata
    return { courses: courses, pagination: resultPagination };
  },

  // Retrieves a course with a given id
  async getCourseById(id: string): Promise<CourseType | null> {
    const course = await Course.findById(id);

    // return retrieved course
    // if it's null, that means it does not exist; gets handled in the controller
    return course;
  },

  // Updates a course with a given id
  async updateCourseById(id: string, body: Object): Promise<CourseType | null> {
    // Finds a course by ID and applies partial updates from the request body
    // Returns the updated document instead of the original
    const course = await Course.findByIdAndUpdate(id, body, {
      new: true,
      // Ensures mongoose schema validators run on the update
      runValidators: true,
    });
    // Returns the updated course document
    // Null indicates the course was not found (handled in controller)
    return course;
  },

  // Deletes a course with a given id
  async deleteCourseById(id: string) {
    // returns the deleted course or null if it never existed
    return await Course.findByIdAndDelete(id);
  },
};
