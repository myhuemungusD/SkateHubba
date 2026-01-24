import { useMemo } from "react";
import type { User } from "firebase/auth";
import { useAuthStore } from "../store/authStore";

/**
 * Determines if a Firebase user is authenticated for the application.
 * @param user - The Firebase user object or null
 * @returns true if the user is authenticated, false otherwise
 *
 * Authentication criteria:
 * - Anonymous users are authenticated
 * - Users with verified emails are authenticated
 * - Users authenticated via OAuth providers (Google, phone, etc.) are authenticated
 */
function isFirebaseUserAuthenticated(user: User | null): boolean {
  if (!user) {
    return false;
  }

  if (user.isAnonymous) {
    return true;
  }

  if (user.emailVerified) {
    return true;
  }

  return user.providerData.some((provider) => provider.providerId !== "password");
}

export function useAuth() {
  const {
    user,
    profile,
    profileStatus,
    roles,
    loading,
    isInitialized,
    error,
    signInWithGoogle,
    signInGoogle,
    signInWithEmail,
    signUpWithEmail,
    signInAnonymously,
    signInAnon,
    signOut,
    resetPassword,
    refreshRoles,
    hasRole,
    clearError,
    setProfile,
  } = useAuthStore();

  const isAuthenticated = useMemo(() => isFirebaseUserAuthenticated(user), [user]);
  const isAdmin = useMemo(() => roles.includes("admin"), [roles]);
  const isVerifiedPro = useMemo(() => roles.includes("verified_pro"), [roles]);
  const isModerator = useMemo(() => roles.includes("moderator"), [roles]);

  const hasProfile = profileStatus === "exists";
  const needsProfileSetup = profileStatus === "missing";

  return {
    user,
    profile,
    profileStatus,
    roles,
    loading,
    isInitialized,
    error,
    isAuthenticated,
    isAdmin,
    isVerifiedPro,
    isModerator,
    hasProfile,
    needsProfileSetup,
    signInWithGoogle,
    signInGoogle,
    signInWithEmail,
    signUpWithEmail,
    signInAnonymously,
    signInAnon,
    signOut,
    resetPassword,
    refreshRoles,
    hasRole,
    clearError,
    setProfile,
  };
}

export type { UserProfile, UserRole, ProfileStatus } from "../store/authStore";
