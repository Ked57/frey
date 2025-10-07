/**
 * Authentication types and interfaces for Frey framework
 */

export type User = {
  id: string;
  email: string;
  role?: string;
  permissions?: string[];
  metadata?: Record<string, any>;
};

export type AuthContext = {
  user?: User;
  isAuthenticated: boolean;
  token?: string;
  apiKey?: string;
  authMethod?: 'jwt' | 'api-key';
};

export type JwtConfig = {
  secret: string;
  expiresIn?: string;
  issuer?: string;
  audience?: string;
  extractUser?: (decoded: any) => Promise<User | null>;
};

export type ApiKeyConfig = {
  headerName?: string; // default: 'x-api-key'
  validateKey: (key: string) => Promise<User | null>;
};

export type AuthConfig = {
  enabled?: boolean; // default: false
  jwt?: JwtConfig;
  apiKey?: ApiKeyConfig;
  requireAuth?: boolean; // default: true when auth.enabled is true
};

export type RouteAuthConfig = {
  requireAuth?: boolean; // default: true when auth.enabled is true, false to opt-out
  jwtOnly?: boolean;
  apiKeyOnly?: boolean;
  customAuth?: (request: any) => Promise<boolean>;
};

export type CustomErrorHandler = {
  [statusCode: number]: {
    error: string;
    message: string;
    details?: any;
  };
};
