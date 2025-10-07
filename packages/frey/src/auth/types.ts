/**
 * Authentication types and interfaces for Frey framework
 */

export const FREY_ROLES = {
  ADMIN: "admin",
  USER: "user",
} as const;

export type FreyRole = typeof FREY_ROLES[keyof typeof FREY_ROLES];

/**
 * Helper function to create extended role constants
 * @param customRoles Additional custom roles
 * @returns Extended role constants with custom roles
 */
export function createRoleConstants<T extends Record<string, string>>(
  customRoles: T
): typeof FREY_ROLES & T {
  return { ...FREY_ROLES, ...customRoles };
}

/**
 * Common custom roles that can be used in applications
 */
export const COMMON_ROLES = {
  MODERATOR: "moderator",
  GUEST: "guest",
  EDITOR: "editor",
  VIEWER: "viewer",
} as const;

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

export type PermissionScope = 'All' | 'Own' | 'Custom';

export type Permission = {
  scope: PermissionScope;
  customCheck?: (context: any, entity: any, operation: string) => Promise<boolean>;
};

export type RolePermissions = {
  create?: PermissionScope | Permission;
  read?: PermissionScope | Permission;
  update?: PermissionScope | Permission;
  delete?: PermissionScope | Permission;
};

export type EntityRbacConfig = {
  ownerField?: string; // default: 'id'
  operations?: {
    [roleName: string]: {
      findAll?: 'All' | 'Own' | 'Custom';
      findOne?: 'All' | 'Own' | 'Custom';
      read?: 'All' | 'Own' | 'Custom';  // Add read for compatibility
      create?: 'All' | 'Own' | 'Custom';
      update?: 'All' | 'Own' | 'Custom';
      delete?: 'All' | 'Own' | 'Custom';
    };
  };
  customChecks?: {
    findAll?: (context: any, entity: any, operation: string) => Promise<boolean>;
    findOne?: (context: any, entity: any, operation: string) => Promise<boolean>;
    read?: (context: any, entity: any, operation: string) => Promise<boolean>;  // Add read for compatibility
    create?: (context: any, entity: any, operation: string) => Promise<boolean>;
    update?: (context: any, entity: any, operation: string) => Promise<boolean>;
    delete?: (context: any, entity: any, operation: string) => Promise<boolean>;
  };
};

export type RbacConfig = {
  enabled?: boolean; // default: false
  customRoles?: {
    [roleName: string]: RolePermissions;
  };
};

export type AuthConfig = {
  enabled?: boolean; // default: false, but true if any auth method is configured
  jwt?: JwtConfig;
  apiKey?: ApiKeyConfig;
  requireAuth?: boolean; // default: true when auth.enabled is true
  loginUrl?: string; // URL to redirect unauthenticated users
  rbac?: RbacConfig;
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
