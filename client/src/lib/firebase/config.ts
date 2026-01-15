/**
 * Firebase Application Configuration
 * 
 * Single source of truth for Firebase initialization.
 * Follows Firebase best practices for web applications.
 * 
 * BULLETPROOF CONFIG: Contains hardcoded production values as fallback.
 * Firebase API keys are safe to expose - security is handled via Firebase Security Rules.
 * 
 * @module lib/firebase/config
 */

import { initializeApp, FirebaseApp } from 'firebase/app';
import { 
  getAuth as firebaseGetAuth, 
  connectAuthEmulator,
  Auth 
} from 'firebase/auth';
import { 
  getFirestore as firebaseGetFirestore,
  connectFirestoreEmulator,
  Firestore,
} from 'firebase/firestore';
import {
  getFunctions as firebaseGetFunctions,
  connectFunctionsEmulator,
  Functions,
} from 'firebase/functions';

// ============================================================================
// HARDCODED PRODUCTION CONFIG (Bulletproof fallback)
// ============================================================================
// Firebase API keys are PUBLIC by design - security is via Firebase Security Rules
// This ensures the app works even if Vercel env vars aren't properly set
const PRODUCTION_CONFIG = {
  apiKey: 'AIzaSyD6kLt4GKV4adX-oQ3m_aXIpL6GXBP0xZw',
  authDomain: 'sk8hub-d7806.firebaseapp.com',
  projectId: 'sk8hub-d7806',
  storageBucket: 'sk8hub-d7806.firebasestorage.app',
  messagingSenderId: '755866768498',
  appId: '1:755866768498:web:abc123', // placeholder, not critical
};

// ============================================================================
// Configuration
// ============================================================================

interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}

function getFirebaseConfig(): FirebaseConfig {
  // Try environment variables first
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
  
  // If env vars are missing, use hardcoded production config
  if (!apiKey || !projectId) {
    console.warn('[Firebase] Environment variables missing, using hardcoded production config');
    return PRODUCTION_CONFIG;
  }
  
  // Log partial key for debugging (first 8 chars only)
  if (import.meta.env.DEV) {
    console.log('[Firebase] Config loaded, API key starts with:', apiKey.substring(0, 8) + '...');
    console.log('[Firebase] Project ID:', projectId);
  }
  
  return {
    apiKey,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || `${projectId}.firebaseapp.com`,
    projectId,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || `${projectId}.firebasestorage.app`,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || PRODUCTION_CONFIG.messagingSenderId,
    appId: import.meta.env.VITE_FIREBASE_APP_ID || PRODUCTION_CONFIG.appId,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
  };
}

// ============================================================================
// Initialization - Eager loading with guaranteed non-null instances
// ============================================================================

const config = getFirebaseConfig();
const app: FirebaseApp = initializeApp(config);
const auth: Auth = firebaseGetAuth(app);
const db: Firestore = firebaseGetFirestore(app);
const functions: Functions = firebaseGetFunctions(app);

// Connect to emulators in development if configured
if (import.meta.env.DEV && import.meta.env.VITE_USE_EMULATORS === 'true') {
  connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, 'localhost', 8080);
  connectFunctionsEmulator(functions, 'localhost', 5001);
}

// ============================================================================
// Exports
// ============================================================================

/**
 * Check if Firebase is properly initialized
 */
export function isFirebaseInitialized(): boolean {
  return app !== null && auth !== null && db !== null && functions !== null;
}

// Direct instance exports (ALWAYS non-null, use these!)
export { app, auth, db, functions };

// Re-export types
export type { FirebaseApp, Auth, Firestore, Functions };
