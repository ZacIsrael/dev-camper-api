/**
 * CSRF Protection Middleware
 *
 * This middleware protects against Cross-Site Request Forgery (CSRF) attacks
 * by enforcing:
 * - Custom header presence on state-changing requests
 * - Validation of request origin (Origin / Referer headers)
 *
 * It ensures that only trusted clients (e.g., frontend app)
 * can perform actions that modify server state when using cookie-based auth.
 */

import type { NextFunction, Request, Response } from "express";

// HTTP methods that do NOT modify server state (safe from CSRF)
const SAFE_METHODS = ["GET", "HEAD", "OPTIONS"];

// Allowed frontend origins that are permitted to make requests
const TRUSTED_ORIGINS = ["http://localhost:3000"];

export const csrfProtection = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Skip CSRF protection for safe/read-only requests
  if (SAFE_METHODS.includes(req.method)) {
    return next();
  }

  // Extract Fetch Metadata header that indicates the context of the request
  const fetchSite = req.header("sec-fetch-site");

  // Block cross-site requests for state-changing operations
  if (
    // Only enforce for non-safe (mutating) HTTP methods
    !SAFE_METHODS.includes(req.method) &&
    // Ensure the header exists (modern browsers only)
    fetchSite &&
    // Allow same-origin and same-site requests only
    fetchSite !== "same-origin" &&
    fetchSite !== "same-site"
  ) {
    return res.status(403).json({
      success: false,
      error: "CSRF protection: cross-site request blocked",
    });
  }

  // Require a custom header to ensure request is intentionally made by frontend
  // All frontend requests MUST include the "x-csrf-token" header or they will be rejected
  const csrfHeader = req.header("x-csrf-token");

  // Reject request if custom CSRF header is missing
  if (!csrfHeader) {
    return res.status(403).json({
      success: false,
      error: "CSRF protection: missing x-csrf-token header",
    });
  }

  // Extract the Origin header (sent by browsers for cross-origin requests)
  const origin = req.header("origin");

  // Reject request if Origin exists but is not trusted
  if (origin && !TRUSTED_ORIGINS.includes(origin)) {
    return res.status(403).json({
      success: false,
      error: "CSRF protection: untrusted request origin",
    });
  }

  // Extract Referer header as fallback when Origin is not provided
  const referer = req.header("referer");

  // If Origin is missing, validate Referer against trusted origins
  if (!origin && referer) {
    const isTrustedReferer = TRUSTED_ORIGINS.some((trustedOrigin) =>
      referer.startsWith(trustedOrigin)
    );

    // Reject request if Referer does not match trusted origins
    if (!isTrustedReferer) {
      return res.status(403).json({
        success: false,
        error: "CSRF protection: untrusted request referer",
      });
    }
  }

  // All CSRF checks passed; allow request to proceed
  next();
};
