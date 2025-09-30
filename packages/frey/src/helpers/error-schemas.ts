/**
 * Standardized error response schemas for OpenAPI documentation
 */

export const errorSchemas = {
  /**
   * Standard error response for validation errors (400)
   */
  validationError: {
    type: "object",
    properties: {
      error: { type: "string", example: "Invalid parameters" },
      message: { type: "string", example: "Validation failed" },
      details: {
        type: "array",
        items: {
          type: "object",
          properties: {
            field: { type: "string", example: "email" },
            message: { type: "string", example: "Invalid email format" },
          },
          required: ["field", "message"],
        },
      },
    },
    required: ["error"],
  },

  /**
   * Standard error response for not found errors (404)
   */
  notFoundError: {
    type: "object",
    properties: {
      error: { type: "string", example: "Not found" },
      message: { type: "string", example: "Resource not found" },
    },
    required: ["error"],
  },

  /**
   * Standard error response for internal server errors (500)
   */
  internalServerError: {
    type: "object",
    properties: {
      error: { type: "string", example: "Internal server error" },
      message: { type: "string", example: "An unexpected error occurred" },
    },
    required: ["error"],
  },

  /**
   * Standard error response for unauthorized access (401)
   */
  unauthorizedError: {
    type: "object",
    properties: {
      error: { type: "string", example: "Unauthorized" },
      message: { type: "string", example: "Authentication required" },
    },
    required: ["error"],
  },

  /**
   * Standard error response for forbidden access (403)
   */
  forbiddenError: {
    type: "object",
    properties: {
      error: { type: "string", example: "Forbidden" },
      message: { type: "string", example: "Insufficient permissions" },
    },
    required: ["error"],
  },
};

/**
 * Get standard error responses for CRUD operations
 */
export function getStandardErrorResponses() {
  return {
    400: errorSchemas.validationError,
    401: errorSchemas.unauthorizedError,
    403: errorSchemas.forbiddenError,
    404: errorSchemas.notFoundError,
    500: errorSchemas.internalServerError,
  };
}

/**
 * Get error responses for read operations (GET)
 */
export function getReadErrorResponses() {
  return {
    400: errorSchemas.validationError,
    401: errorSchemas.unauthorizedError,
    403: errorSchemas.forbiddenError,
    404: errorSchemas.notFoundError,
    500: errorSchemas.internalServerError,
  };
}

/**
 * Get error responses for write operations (POST, PUT, PATCH)
 */
export function getWriteErrorResponses() {
  return {
    400: errorSchemas.validationError,
    401: errorSchemas.unauthorizedError,
    403: errorSchemas.forbiddenError,
    404: errorSchemas.notFoundError,
    500: errorSchemas.internalServerError,
  };
}

/**
 * Get error responses for delete operations (DELETE)
 */
export function getDeleteErrorResponses() {
  return {
    400: errorSchemas.validationError,
    401: errorSchemas.unauthorizedError,
    403: errorSchemas.forbiddenError,
    404: errorSchemas.notFoundError,
    500: errorSchemas.internalServerError,
  };
}

/**
 * Get error responses for custom routes
 */
export function getCustomRouteErrorResponses() {
  return {
    500: errorSchemas.internalServerError,
  };
}
