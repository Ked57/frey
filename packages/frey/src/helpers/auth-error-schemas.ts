/**
 * Standardized authentication error response schemas for OpenAPI documentation
 */

export const authErrorSchemas = {
  /**
   * Standard error response for missing authentication (401)
   */
  missingAuth: {
    type: "object",
    properties: {
      error: { type: "string", example: "Authentication required" },
      message: { type: "string", example: "No authentication token provided" },
    },
    required: ["error"],
  },

  /**
   * Standard error response for invalid JWT token (401)
   */
  invalidJwt: {
    type: "object",
    properties: {
      error: { type: "string", example: "Invalid token" },
      message: { type: "string", example: "JWT token is invalid or expired" },
    },
    required: ["error"],
  },

  /**
   * Standard error response for invalid API key (401)
   */
  invalidApiKey: {
    type: "object",
    properties: {
      error: { type: "string", example: "Invalid API key" },
      message: { type: "string", example: "The provided API key is invalid" },
    },
    required: ["error"],
  },

  /**
   * Standard error response for expired token (401)
   */
  expiredToken: {
    type: "object",
    properties: {
      error: { type: "string", example: "Token expired" },
      message: { type: "string", example: "JWT token has expired" },
    },
    required: ["error"],
  },

  /**
   * Standard error response for insufficient permissions (403)
   */
  insufficientPermissions: {
    type: "object",
    properties: {
      error: { type: "string", example: "Insufficient permissions" },
      message: { type: "string", example: "You don't have permission to access this resource" },
    },
    required: ["error"],
  },

  /**
   * Standard error response for authentication method not allowed (403)
   */
  authMethodNotAllowed: {
    type: "object",
    properties: {
      error: { type: "string", example: "Authentication method not allowed" },
      message: { type: "string", example: "This endpoint only accepts specific authentication methods" },
    },
    required: ["error"],
  },
};

/**
 * Get authentication error responses for protected routes
 */
export function getAuthErrorResponses() {
  return {
    401: {
      oneOf: [
        authErrorSchemas.missingAuth,
        authErrorSchemas.invalidJwt,
        authErrorSchemas.invalidApiKey,
        authErrorSchemas.expiredToken,
      ],
      description: "Authentication error",
    },
    403: {
      oneOf: [
        authErrorSchemas.insufficientPermissions,
        authErrorSchemas.authMethodNotAllowed,
      ],
      description: "Authorization error",
    },
  };
}

/**
 * Get error responses for JWT-only protected routes
 */
export function getJwtErrorResponses() {
  return {
    401: {
      oneOf: [
        authErrorSchemas.missingAuth,
        authErrorSchemas.invalidJwt,
        authErrorSchemas.expiredToken,
      ],
      description: "JWT authentication error",
    },
    403: authErrorSchemas.insufficientPermissions,
  };
}

/**
 * Get error responses for API key-only protected routes
 */
export function getApiKeyErrorResponses() {
  return {
    401: {
      oneOf: [
        authErrorSchemas.missingAuth,
        authErrorSchemas.invalidApiKey,
      ],
      description: "API key authentication error",
    },
    403: authErrorSchemas.insufficientPermissions,
  };
}

/**
 * Get error responses for routes that accept both JWT and API key
 */
export function getMultiAuthErrorResponses() {
  return {
    401: {
      oneOf: [
        authErrorSchemas.missingAuth,
        authErrorSchemas.invalidJwt,
        authErrorSchemas.invalidApiKey,
        authErrorSchemas.expiredToken,
      ],
      description: "Authentication error (JWT or API key required)",
    },
    403: authErrorSchemas.insufficientPermissions,
  };
}
