/**
 * User Roles Hook
 * 
 * Provides utilities for working with user roles and custom claims.
 * Allows refreshing the token to get updated roles after they change.
 * 
 * @module hooks/useUserRoles
 */

import { useState, useCallback } from 'react';
import { getIdTokenResult } from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import { auth as getAuth, functions as getFunctions } from '../lib/firebase/config';

export type UserRole = 'admin' | 'moderator' | 'verified_pro';

interface UseUserRolesReturn {
  /** Current user's roles */
  roles: UserRole[];
  /** Loading state */
  isLoading: boolean;
  /** Error message if any */
  error: string | null;
  /** Force refresh the user's token to get updated roles */
  refreshUserClaims: () => Promise<UserRole[]>;
  /** Check if user has a specific role */
  hasRole: (role: UserRole) => boolean;
  /** Check if user is admin */
  isAdmin: boolean;
  /** Check if user is verified pro */
  isVerifiedPro: boolean;
  /** Grant a role to another user (admin only) */
  grantRole: (targetUid: string, role: UserRole) => Promise<void>;
  /** Revoke a role from another user (admin only) */
  revokeRole: (targetUid: string, role: UserRole) => Promise<void>;
}

/**
 * Hook for managing user roles
 * 
 * @example
 * ```tsx
 * const { roles, isAdmin, isVerifiedPro, refreshUserClaims } = useUserRoles();
 * 
 * // After role change
 * await refreshUserClaims();
 * ```
 */
export function useUserRoles(): UseUserRolesReturn {
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Refresh the user's token to get updated roles
   * Call this after a role has been assigned
   */
  const refreshUserClaims = useCallback(async (): Promise<UserRole[]> => {
    const auth = getAuth();
    
    if (!auth.currentUser) {
      console.warn('[useUserRoles] No user logged in');
      return [];
    }

    setIsLoading(true);
    setError(null);

    try {
      // forceRefresh = true fetches a fresh token from the server
      const tokenResult = await getIdTokenResult(auth.currentUser, true);
      const userRoles = (tokenResult.claims.roles as UserRole[]) || [];
      
      console.log('[useUserRoles] Roles refreshed:', userRoles);
      setRoles(userRoles);
      
      return userRoles;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to refresh user roles';
      console.error('[useUserRoles] Error refreshing claims:', err);
      setError(errorMessage);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Check if user has a specific role
   */
  const hasRole = useCallback((role: UserRole): boolean => {
    return roles.includes(role);
  }, [roles]);

  /**
   * Grant a role to another user (admin only)
   */
  const grantRole = useCallback(async (targetUid: string, role: UserRole): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const manageUserRole = httpsCallable(getFunctions(), 'manageUserRole');
      await manageUserRole({ targetUid, role, action: 'grant' });
      console.log(`[useUserRoles] Granted ${role} to ${targetUid}`);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to grant role';
      console.error('[useUserRoles] Error granting role:', err);
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Revoke a role from another user (admin only)
   */
  const revokeRole = useCallback(async (targetUid: string, role: UserRole): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const manageUserRole = httpsCallable(getFunctions(), 'manageUserRole');
      await manageUserRole({ targetUid, role, action: 'revoke' });
      console.log(`[useUserRoles] Revoked ${role} from ${targetUid}`);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to revoke role';
      console.error('[useUserRoles] Error revoking role:', err);
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    roles,
    isLoading,
    error,
    refreshUserClaims,
    hasRole,
    isAdmin: roles.includes('admin'),
    isVerifiedPro: roles.includes('verified_pro'),
    grantRole,
    revokeRole,
  };
}

export default useUserRoles;
