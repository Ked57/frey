/**
 * Authentication middleware for Frey framework
 */

import { FastifyRequest, FastifyReply } from "fastify";
import jwt from "jsonwebtoken";
import type { JwtConfig, ApiKeyConfig, User, AuthContext, AuthConfig } from "./types.js";

/**
 * Create JWT authentication middleware
 */
export const createJwtMiddleware = (config: JwtConfig) => {
  return async (fastify: any) => {
    fastify.addHook('preHandler', async (request: FastifyRequest, reply: FastifyReply) => {
    const authHeader = request.headers.authorization;
    
    if (!authHeader?.startsWith('Bearer ')) {
      return; // No token, continue without auth
    }
    
    const token = authHeader.substring(7);
    
    try {
      const decoded = jwt.verify(token, config.secret) as any;
      
      let user: User | null = null;
      
      // Use custom user extraction if provided
      if (config.extractUser) {
        user = await config.extractUser(decoded);
      } else {
        // Default user extraction from JWT payload
        user = {
          id: decoded.sub || decoded.id,
          email: decoded.email,
          role: decoded.role,
          permissions: decoded.permissions,
          metadata: decoded.metadata,
        };
      }
      
      if (user) {
        (request as any).auth = {
          user,
          isAuthenticated: true,
          token,
          authMethod: 'jwt',
        } as AuthContext;
      }
    } catch (error) {
      // Invalid token, continue without auth
      // Error will be handled by route-level auth checks
    }
    });
  };
};

/**
 * Create API key authentication middleware
 */
export const createApiKeyMiddleware = (config: ApiKeyConfig) => {
  return async (fastify: any) => {
    fastify.addHook('preHandler', async (request: FastifyRequest, reply: FastifyReply) => {
    const headerName = config.headerName || 'x-api-key';
    const apiKey = request.headers[headerName] as string;
    
    if (!apiKey) {
      return; // No API key, continue without auth
    }
    
    try {
      const user = await config.validateKey(apiKey);
      
      if (user) {
        (request as any).auth = {
          user,
          isAuthenticated: true,
          apiKey,
          authMethod: 'api-key',
        } as AuthContext;
      }
    } catch (error) {
      // Invalid API key, continue without auth
      // Error will be handled by route-level auth checks
    }
    });
  };
};

/**
 * Create authentication context injection middleware
 */
export const createAuthContextMiddleware = () => {
  return async (fastify: any) => {
    fastify.addHook('preHandler', async (request: FastifyRequest, reply: FastifyReply) => {
      // Ensure auth context is always available
      if (!(request as any).auth) {
        (request as any).auth = {
          isAuthenticated: false,
        } as AuthContext;
      }
    });
  };
};

/**
 * Create route-level authentication check middleware
 */
export const createRouteAuthMiddleware = (config: {
  requireAuth?: boolean;
  jwtOnly?: boolean;
  apiKeyOnly?: boolean;
  customAuth?: (request: any) => Promise<boolean>;
}, globalAuth?: AuthConfig) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    let auth = (request as any).auth as AuthContext;
    
    // Ensure auth context is available
    if (!auth) {
      // Initialize auth context if not present
      auth = {
        isAuthenticated: false,
      } as AuthContext;
      (request as any).auth = auth;
    }
    
    // If auth is enabled globally, try to validate JWT or API key
    if (globalAuth?.enabled && !auth.isAuthenticated) {
      // Try JWT authentication
      if (globalAuth.jwt) {
        const authHeader = request.headers.authorization;
        if (authHeader?.startsWith('Bearer ')) {
          const token = authHeader.substring(7);
          try {
            const jwt = await import('jsonwebtoken');
            const decoded = jwt.verify(token, globalAuth.jwt.secret) as any;
            const user = globalAuth.jwt.extractUser ? await globalAuth.jwt.extractUser(decoded) : {
              id: decoded.sub || decoded.id,
              name: decoded.name || decoded.username || decoded.email?.split('@')[0] || 'User',
              email: decoded.email,
              role: decoded.role || 'user',
              permissions: decoded.permissions || [],
              metadata: decoded.metadata,
            };
            
            if (user) {
              auth = {
                user,
                isAuthenticated: true,
                token,
                authMethod: 'jwt',
              } as AuthContext;
              (request as any).auth = auth;
            }
          } catch (error) {
            // Invalid token, continue with unauthenticated state
          }
        }
      }
      
      // Try API key authentication (only if JWT didn't work)
      if (!auth.isAuthenticated && globalAuth.apiKey) {
        const headerName = globalAuth.apiKey.headerName || 'x-api-key';
        const apiKey = request.headers[headerName] as string;
        
        if (apiKey) {
          const user = await globalAuth.apiKey.validateKey(apiKey);
          if (user) {
            auth = {
              user,
              isAuthenticated: true,
              apiKey,
              authMethod: 'api-key',
            } as AuthContext;
            (request as any).auth = auth;
          }
        }
      }
    }
    
    // Get the auth context reference after potentially validating tokens
    const authContext = (request as any).auth as AuthContext;
    
    // If auth explicitly disabled, continue
    if (config.requireAuth === false) {
      return;
    }
    
    // Check custom authentication if provided
    if (config.customAuth) {
      const isValid = await config.customAuth(request);
      if (!isValid) {
        reply.status(401).send({
          error: "Authentication required",
          message: "Custom authentication failed",
        });
        return reply.sent = true;
      }
      return;
    }
    
    // Check if user is authenticated
    if (!authContext.isAuthenticated || !authContext.user) {
      reply.status(401).send({
        error: "Authentication required",
        message: "No authentication token provided",
      });
      return reply.sent = true;
    }
    
    // Check JWT-only requirement
    if (config.jwtOnly && authContext.authMethod !== 'jwt') {
      reply.status(401).send({
        error: "Authentication method not allowed",
        message: "This endpoint only accepts JWT authentication",
      });
      return reply.sent = true;
    }
    
    // Check API key-only requirement
    if (config.apiKeyOnly && authContext.authMethod !== 'api-key') {
      reply.status(401).send({
        error: "Authentication method not allowed",
        message: "This endpoint only accepts API key authentication",
      });
      return reply.sent = true;
    }
  };
};
