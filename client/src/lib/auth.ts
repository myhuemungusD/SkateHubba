/**
 * Unified Authentication Module
 *
 * Single entry point for all authentication operations.
 * Handles both Firebase authentication and backend session management.
 *
 * Flow:
 * 1. User authenticates with Firebase (email/password, Google, anonymous)
 * 2. Firebase ID token is sent to backend
 * 3. Backend creates session and returns user data
 *
 * @module lib/auth
 */

import type { User } from "firebase/auth";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendEmailVerification,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInAnonymously as firebaseSignInAnonymously,
  updateProfile,
  type ConfirmationResult,
} from "firebase/auth";
import { auth } from "./firebase/config";
import { apiRequest } from "./api/client";

// ============================================================================
// Types
// ============================================================================

export type RegistrationProfile = {
  firstName?: string;
  lastName?: string;
};

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    displayName: string;
    photoUrl: string | null;
    roles: string[];
    createdAt: string;
    provider: string;
  };
  strategy: string;
}

export interface AuthError extends Error {
  code?: string;
}

// ============================================================================
// Error Messages
// ============================================================================

const ERROR_MESSAGES: Record<string, string> = {
  "auth/email-already-in-use": "An account with this email already exists.",
  "auth/invalid-email": "Please enter a valid email address.",
  "auth/weak-password": "Password must be at least 6 characters.",
  "auth/user-disabled": "This account has been disabled.",
  "auth/user-not-found": "No account found with this email.",
  "auth/wrong-password": "Incorrect password.",
  "auth/invalid-credential": "Invalid email or password.",
  "auth/too-many-requests": "Too many attempts. Please try again later.",
  "auth/network-request-failed": "Network error. Check your connection.",
  "auth/popup-closed-by-user": "Sign-in was cancelled.",
  "auth/popup-blocked": "Pop-up blocked. Please allow pop-ups and try again.",
  "auth/account-exists-with-different-credential":
    "An account already exists with this email using a different sign-in method.",
  "auth/cancelled-popup-request": "Sign-in was cancelled.",
  "auth/user-cancelled": "Sign-in was cancelled.",
  "auth/credential-already-in-use": "This credential is already associated with a different account.",
};

function createAuthError(error: unknown): AuthError {
  const firebaseError = error as { code?: string; message?: string };
  const code = firebaseError.code || "unknown";
  const message = ERROR_MESSAGES[code] || firebaseError.message || "Authentication failed";

  const authError = new Error(message) as AuthError;
  authError.code = code;
  return authError;
}

// ============================================================================
// Helper Functions
// ============================================================================

function extractNameParts(displayName?: string) {
  if (!displayName) {
    return { firstName: undefined, lastName: undefined };
  }

  const parts = displayName.trim().split(/\s+/);
  if (parts.length === 0) {
    return { firstName: undefined, lastName: undefined };
  }

  const [firstName, ...rest] = parts;
  const lastName = rest.length > 0 ? rest.join(" ") : undefined;
  return { firstName, lastName };
}

function isMobileDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

function isEmbeddedBrowser(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  return (
    ua.includes("FBAN") ||
    ua.includes("FBAV") ||
    ua.includes("Instagram") ||
    ua.includes("Twitter") ||
    ua.includes("TikTok") ||
    (ua.includes("wv") && ua.includes("Android"))
  );
}

// ============================================================================
// Backend Authentication
// ============================================================================

/**
 * Authenticate with the backend after Firebase sign-in.
 * Creates a session and returns user data.
 */
async function authenticateWithBackend(
  firebaseUser: User,
  profile: { firstName?: string; lastName?: string; isRegistration?: boolean } = {}
): Promise<AuthResponse> {
  const idToken = await firebaseUser.getIdToken();
  const derivedNames = extractNameParts(firebaseUser.displayName ?? undefined);

  const payload: Record<string, unknown> = {};

  const firstName = profile.firstName ?? derivedNames.firstName;
  if (firstName) payload.firstName = firstName;

  const lastName = profile.lastName ?? derivedNames.lastName;
  if (lastName) payload.lastName = lastName;

  if (typeof profile.isRegistration === "boolean") {
    payload.isRegistration = profile.isRegistration;
  }

  return apiRequest<AuthResponse>({
    method: "POST",
    path: "/api/auth/login",
    body: payload,
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
  });
}

// ============================================================================
// Email/Password Authentication
// ============================================================================

/**
 * Register a new user with email and password.
 * Sends verification email after registration.
 */
export async function registerUser(
  email: string,
  password: string,
  profile: RegistrationProfile = {}
): Promise<User> {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;

    const displayName = `${profile.firstName ?? ""} ${profile.lastName ?? ""}`.trim();
    if (displayName.length > 0) {
      await updateProfile(firebaseUser, { displayName });
    }

    await sendEmailVerification(firebaseUser);

    return firebaseUser;
  } catch (error) {
    throw createAuthError(error);
  }
}

/**
 * Sign in with email and password.
 * Requires email to be verified.
 */
export async function loginUser(email: string, password: string): Promise<AuthResponse> {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;

    if (!firebaseUser.emailVerified) {
      await firebaseSignOut(auth);
      const error = new Error("Please verify your email before logging in.") as AuthError;
      error.code = "auth/email-not-verified";
      throw error;
    }

    return authenticateWithBackend(firebaseUser);
  } catch (error) {
    throw createAuthError(error);
  }
}

// ============================================================================
// Google OAuth Authentication
// ============================================================================

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: "select_account",
});

/**
 * Sign in with Google OAuth.
 * Uses popup on desktop, redirect on mobile.
 *
 * @param forceRedirect - Force redirect flow instead of popup
 * @returns AuthResponse or null if redirect was triggered
 */
export async function loginWithGoogle(forceRedirect = false): Promise<AuthResponse | null> {
  if (isEmbeddedBrowser()) {
    const error = new Error(
      "Google Sign-In is not supported in embedded browsers. Open in Safari or Chrome."
    ) as AuthError;
    error.code = "auth/embedded-browser";
    throw error;
  }

  try {
    // Mobile or forced redirect: use redirect flow
    if (forceRedirect || isMobileDevice()) {
      sessionStorage.setItem("googleRedirectPending", "true");
      await signInWithRedirect(auth, googleProvider);
      return null;
    }

    // Desktop: try popup first
    try {
      const userCredential = await signInWithPopup(auth, googleProvider);
      return authenticateWithBackend(userCredential.user);
    } catch (popupError) {
      const error = popupError as { code?: string };

      // Fallback to redirect if popup is blocked or closed
      if (error.code === "auth/popup-blocked" || error.code === "auth/popup-closed-by-user") {
        sessionStorage.setItem("googleRedirectPending", "true");
        await signInWithRedirect(auth, googleProvider);
        return null;
      }

      throw popupError;
    }
  } catch (error) {
    sessionStorage.removeItem("googleRedirectPending");
    throw createAuthError(error);
  }
}

/**
 * Handle Google redirect result after returning from Google.
 * Call this on app initialization.
 */
export async function handleGoogleRedirect(): Promise<AuthResponse | null> {
  try {
    const result = await getRedirectResult(auth);

    if (result?.user) {
      sessionStorage.removeItem("googleRedirectPending");
      return authenticateWithBackend(result.user);
    }

    return null;
  } catch (error) {
    sessionStorage.removeItem("googleRedirectPending");
    throw createAuthError(error);
  }
}

// ============================================================================
// Anonymous Authentication
// ============================================================================

/**
 * Sign in anonymously as a guest.
 */
export async function loginAnonymously(): Promise<AuthResponse> {
  try {
    const userCredential = await firebaseSignInAnonymously(auth);
    return authenticateWithBackend(userCredential.user);
  } catch (error) {
    throw createAuthError(error);
  }
}

// ============================================================================
// Phone Authentication
// ============================================================================

let activeRecaptcha: RecaptchaVerifier | null = null;

/**
 * Setup reCAPTCHA for phone authentication.
 */
export async function setupRecaptcha(elementId: string): Promise<RecaptchaVerifier> {
  if (typeof window === "undefined") {
    throw new Error("reCAPTCHA can only be initialized in the browser.");
  }

  if (activeRecaptcha) {
    await activeRecaptcha.clear();
    activeRecaptcha = null;
  }

  activeRecaptcha = new RecaptchaVerifier(auth, elementId, {
    size: "invisible",
  });

  await activeRecaptcha.render();
  return activeRecaptcha;
}

/**
 * Send phone verification code.
 */
export async function sendPhoneVerification(
  phoneNumber: string,
  recaptchaVerifier: RecaptchaVerifier
): Promise<ConfirmationResult> {
  const normalizedPhone = phoneNumber.replace(/[\s-]/g, "").trim();

  if (!normalizedPhone.startsWith("+")) {
    throw new Error("Enter the phone number in international format, e.g. +1 555 555 5555.");
  }

  try {
    return await signInWithPhoneNumber(auth, normalizedPhone, recaptchaVerifier);
  } catch (error) {
    throw createAuthError(error);
  }
}

/**
 * Verify phone code and complete sign-in.
 */
export async function verifyPhoneCode(
  confirmationResult: ConfirmationResult,
  code: string
): Promise<AuthResponse> {
  const sanitizedCode = code.trim();
  if (!sanitizedCode) {
    throw new Error("Enter the verification code sent to your phone.");
  }

  try {
    const userCredential = await confirmationResult.confirm(sanitizedCode);
    return authenticateWithBackend(userCredential.user);
  } catch (error) {
    throw createAuthError(error);
  }
}

// ============================================================================
// Session Management
// ============================================================================

/**
 * Sign out the current user.
 * Clears both Firebase and backend sessions.
 */
export async function logoutUser(): Promise<void> {
  try {
    await apiRequest({
      method: "POST",
      path: "/api/auth/logout",
    });
  } catch (error) {
    console.error("[Auth] Backend logout failed:", error);
    // Continue with Firebase logout even if backend fails
  }

  await firebaseSignOut(auth);
}

/**
 * Listen to Firebase auth state changes.
 */
export function listenToAuth(callback: (user: User | null) => void): () => void {
  if (!auth || typeof auth.onAuthStateChanged !== "function") {
    console.warn("[Auth] Firebase Auth not initialized");
    callback(null);
    return () => {};
  }

  return auth.onAuthStateChanged(callback);
}

/**
 * Get current Firebase user.
 */
export function getCurrentUser(): User | null {
  return auth.currentUser;
}

/**
 * Get Firebase ID token for the current user.
 */
export async function getIdToken(): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdToken();
}
