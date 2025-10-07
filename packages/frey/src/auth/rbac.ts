/**
 * RBAC (Role-Based Access Control) middleware and utilities
 */

import type { Context } from "../entity.ts";
import type { User, PermissionScope, RolePermissions, EntityRbacConfig } from "./types.ts";

// Default role permissions (built-in)
const DEFAULT_ROLES: Record<string, RolePermissions> = {
  user: {
    create: 'Own',
    read: 'All',
    update: 'Own',
    delete: 'Own'
  },
  admin: {
    create: 'All',
    read: 'All',
    update: 'All',
    delete: 'All'
  }
};

export type RbacConfig = {
  enabled?: boolean;
  customRoles?: {
    [roleName: string]: RolePermissions;
  };
};

/**
 * Get permissions for a specific role and operation
 */
export function getRolePermission(
  role: string,
  operation: 'create' | 'read' | 'update' | 'delete',
  customRoles?: { [roleName: string]: RolePermissions }
): PermissionScope | undefined {
  // Check custom roles first
  if (customRoles?.[role]) {
    const permission = customRoles[role][operation];
    if (permission) {
      return typeof permission === 'string' ? permission : permission.scope;
    }
  }
  
  // Fall back to default roles
  const defaultPermission = DEFAULT_ROLES[role]?.[operation];
  return typeof defaultPermission === 'string' ? defaultPermission : defaultPermission?.scope;
}

/**
 * Check if user has permission for a specific operation
 */
export async function checkRbacPermission(
  user: User,
  entityName: string,
  operation: 'create' | 'read' | 'update' | 'delete',
  entityData: any,
  context: Context,
  entityRbacConfig?: EntityRbacConfig,
  customRoles?: { [roleName: string]: RolePermissions }
): Promise<boolean> {
  const role = user.role || 'user';
  
  // Get permission scope for this role and operation
  let permissionScope = getRolePermission(role, operation, customRoles);
  
  // Check entity-level role-specific override
  if (entityRbacConfig?.operations?.[role]?.[operation]) {
    permissionScope = entityRbacConfig.operations[role][operation];
  }
  
  if (!permissionScope) {
    return false; // No permission defined
  }
  
  // Check permission based on scope
  switch (permissionScope) {
    case 'All':
      return true; // Admin or global permission
      
    case 'Own':
      const ownerField = entityRbacConfig?.ownerField || 'id';
      return entityData[ownerField] === user.id;
      
    case 'Custom':
      const customCheck = entityRbacConfig?.customChecks?.[operation];
      if (customCheck) {
        return await customCheck(context, entityData, operation);
      }
      return false; // No custom check defined
      
    default:
      return false;
  }
}

/**
 * Create RBAC middleware for route protection
 */
export function createRbacMiddleware(
  entityName: string,
  operation: 'create' | 'read' | 'update' | 'delete',
  entityRbacConfig?: EntityRbacConfig,
  customRoles?: { [roleName: string]: RolePermissions }
) {
  return async (request: any, reply: any, next: any) => {
    const auth = (request as any).auth;
    
    if (!auth?.isAuthenticated || !auth?.user) {
      reply.code(401).send({
        error: 'Unauthorized',
        message: 'Authentication required',
        statusCode: 401
      });
      reply.sent = true;
      return;
    }
    
    // For operations that need entity data (update, delete), we need to get the entity
    let entityData: any = null;
    
    if (operation === 'update' || operation === 'delete') {
      // Try to get entity data from request params or body
      entityData = request.params || request.body || {};
    } else if (operation === 'create') {
      // For create, we can use the request body
      entityData = request.body || {};
    }
    
    // Check RBAC permission
    const hasPermission = await checkRbacPermission(
      auth.user,
      entityName,
      operation,
      entityData,
      { request, server: request.server, auth },
      entityRbacConfig,
      customRoles
    );
    
    if (!hasPermission) {
      reply.code(403).send({
        error: 'Forbidden',
        message: 'Insufficient permissions',
        statusCode: 403
      });
      reply.sent = true;
      return;
    }
    
    next();
  };
}

/**
 * Get default role permissions (for reference)
 */
export function getDefaultRoles(): Record<string, RolePermissions> {
  return { ...DEFAULT_ROLES };
}
