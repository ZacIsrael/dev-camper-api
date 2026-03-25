/**
 * QUERY DTOs
 *
 * Validates and normalizes query parameters (pagination, sorting, field selection)
 * before they reach controllers. Ensures only allowed query fields are processed.
 */

import {
  rejectUnknownFields,
  validatePaginationQuery,
  validateSelectFields,
  validateSortFields,
} from "../utils/validation.js";

/**
 * Ensures the incoming DTO payload is a plain object before destructuring.
 */
const assertIsObject = (data: unknown): Record<string, unknown> => {
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    throw new Error("Query parameters must be a valid object");
  }

  return data as Record<string, unknown>;
};

const BOOTCAMP_QUERY_FIELDS = [
  "name",
  "description",
  "website",
  "phone",
  "email",
  "careers",
  "housing",
  "jobAssistance",
  "jobGuarantee",
  "acceptGi",
  "averageCost",
  "averageRating",
  "createdAt",
] as const;

const COURSE_QUERY_FIELDS = [
  "title",
  "description",
  "weeks",
  "tuition",
  "minimumSkill",
  "scholarhipsAvailable",
  "createdAt",
] as const;

const REVIEW_QUERY_FIELDS = ["title", "text", "rating", "createdAt"] as const;

const USER_QUERY_FIELDS = ["name", "email", "role", "createdAt"] as const;

export class BootcampQueryDTO {
  page?: number;
  limit?: number;
  sort?: string;
  select?: string;

  constructor(data: unknown) {
    const payload = assertIsObject(data);

    rejectUnknownFields(payload, ["page", "limit", "sort", "select"]);

    const { page, limit, sort, select } = payload;

    const pagination = validatePaginationQuery({ page, limit });

    if (pagination.page !== undefined) {
      this.page = pagination.page;
    }

    if (pagination.limit !== undefined) {
      this.limit = pagination.limit;
    }

    if (sort !== undefined) {
      this.sort = validateSortFields(sort, [...BOOTCAMP_QUERY_FIELDS]);
    }

    if (select !== undefined) {
      this.select = validateSelectFields(select, [...BOOTCAMP_QUERY_FIELDS]);
    }
  }
}

export class CourseQueryDTO {
  page?: number;
  limit?: number;
  sort?: string;
  select?: string;

  constructor(data: unknown) {
    const payload = assertIsObject(data);

    rejectUnknownFields(payload, ["page", "limit", "sort", "select"]);

    const { page, limit, sort, select } = payload;

    const pagination = validatePaginationQuery({ page, limit });

    if (pagination.page !== undefined) {
      this.page = pagination.page;
    }

    if (pagination.limit !== undefined) {
      this.limit = pagination.limit;
    }

    if (sort !== undefined) {
      this.sort = validateSortFields(sort, [...COURSE_QUERY_FIELDS]);
    }

    if (select !== undefined) {
      this.select = validateSelectFields(select, [...COURSE_QUERY_FIELDS]);
    }
  }
}

export class ReviewQueryDTO {
  page?: number;
  limit?: number;
  sort?: string;
  select?: string;

  constructor(data: unknown) {
    const payload = assertIsObject(data);

    rejectUnknownFields(payload, ["page", "limit", "sort", "select"]);

    const { page, limit, sort, select } = payload;

    const pagination = validatePaginationQuery({ page, limit });

    if (pagination.page !== undefined) {
      this.page = pagination.page;
    }

    if (pagination.limit !== undefined) {
      this.limit = pagination.limit;
    }

    if (sort !== undefined) {
      this.sort = validateSortFields(sort, [...REVIEW_QUERY_FIELDS]);
    }

    if (select !== undefined) {
      this.select = validateSelectFields(select, [...REVIEW_QUERY_FIELDS]);
    }
  }
}

export class UserQueryDTO {
  page?: number;
  limit?: number;
  sort?: string;
  select?: string;

  constructor(data: unknown) {
    const payload = assertIsObject(data);

    rejectUnknownFields(payload, ["page", "limit", "sort", "select"]);

    const { page, limit, sort, select } = payload;

    const pagination = validatePaginationQuery({ page, limit });

    if (pagination.page !== undefined) {
      this.page = pagination.page;
    }

    if (pagination.limit !== undefined) {
      this.limit = pagination.limit;
    }

    if (sort !== undefined) {
      this.sort = validateSortFields(sort, [...USER_QUERY_FIELDS]);
    }

    if (select !== undefined) {
      this.select = validateSelectFields(select, [...USER_QUERY_FIELDS]);
    }
  }
}
