/**
 * Firebase Cloud Functions
 * 
 * Secure serverless functions for SkateHubba.
 * Handles role management and other privileged operations.
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin if not already done
if (!admin.apps.length) {
  admin.initializeApp();
}

// Valid roles that can be assigned
const VALID_ROLES = ['admin', 'moderator', 'verified_pro'] as const;
type ValidRole = typeof VALID_ROLES[number];

interface ManageRolePayload {
  targetUid: string;
  role: ValidRole;
  action: 'grant' | 'revoke';
}

/**
 * manageUserRole
 * 
 * Protected Callable Function for role management.
 * Only Admins can call this function to promote/demote users.
 * 
 * Payload: { 
 *   targetUid: string, 
 *   role: 'admin' | 'moderator' | 'verified_pro', 
 *   action: 'grant' | 'revoke' 
 * }
 */
export const manageUserRole = functions.https.onCall(async (data: ManageRolePayload, context) => {
  // 1. SECURITY: Authentication Gate
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated', 
      'You must be logged in to call this function.'
    );
  }

  // 2. SECURITY: Authorization Gate (RBAC)
  // Check the caller's token for the 'admin' role
  const callerRoles = (context.auth.token.roles as string[]) || [];
  if (!callerRoles.includes('admin')) {
    throw new functions.https.HttpsError(
      'permission-denied', 
      'Only Admins can manage user roles.'
    );
  }

  // 3. VALIDATION: Input Sanitization
  const { targetUid, role, action } = data;
  
  if (!VALID_ROLES.includes(role as ValidRole)) {
    throw new functions.https.HttpsError(
      'invalid-argument', 
      `Role must be one of: ${VALID_ROLES.join(', ')}`
    );
  }
  
  if (!targetUid || typeof targetUid !== 'string') {
    throw new functions.https.HttpsError(
      'invalid-argument', 
      'Invalid Target User ID.'
    );
  }

  if (action !== 'grant' && action !== 'revoke') {
    throw new functions.https.HttpsError(
      'invalid-argument', 
      'Action must be "grant" or "revoke".'
    );
  }

  // 4. SAFETY: Prevent self-demotion from admin
  if (targetUid === context.auth.uid && role === 'admin' && action === 'revoke') {
    throw new functions.https.HttpsError(
      'failed-precondition',
      'You cannot remove your own admin privileges.'
    );
  }

  try {
    // 5. LOGIC: Fetch current claims
    const userRecord = await admin.auth().getUser(targetUid);
    const currentClaims = userRecord.customClaims || {};
    const currentRoles: string[] = (currentClaims.roles as string[]) || [];

    let newRoles = [...currentRoles];

    if (action === 'grant') {
      // Add role if not present
      if (!newRoles.includes(role)) {
        newRoles.push(role);
      }
    } else {
      // Remove role
      newRoles = newRoles.filter(r => r !== role);
    }

    // 6. EXECUTION: Write back to Auth System
    await admin.auth().setCustomUserClaims(targetUid, {
      ...currentClaims,
      roles: newRoles
    });

    // 7. SYNC: Update Firestore for UI speed
    // This allows the frontend to show "Admin" badges without decoding the token
    await admin.firestore().collection('users').doc(targetUid).update({
      roles: newRoles,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // 8. AUDIT: Log the action
    await admin.firestore().collection('audit_logs').add({
      action: 'role_change',
      targetUid,
      targetEmail: userRecord.email,
      role,
      changeType: action,
      performedBy: context.auth.uid,
      performedByEmail: context.auth.token.email,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`Role ${action}: ${role} for ${userRecord.email} by ${context.auth.token.email}`);

    return { 
      success: true, 
      message: `User ${userRecord.email} is now: [${newRoles.join(', ') || 'no roles'}]`,
      roles: newRoles
    };

  } catch (error: any) {
    console.error("Role Management Error:", error);
    
    if (error.code === 'auth/user-not-found') {
      throw new functions.https.HttpsError('not-found', 'Target user not found.');
    }
    
    throw new functions.https.HttpsError('internal', 'Failed to update user roles.');
  }
});

/**
 * getUserRoles
 * 
 * Get the roles for a specific user (admin only)
 */
export const getUserRoles = functions.https.onCall(async (data: { targetUid: string }, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in.');
  }

  const callerRoles = (context.auth.token.roles as string[]) || [];
  if (!callerRoles.includes('admin')) {
    throw new functions.https.HttpsError('permission-denied', 'Only Admins can view user roles.');
  }

  const { targetUid } = data;
  if (!targetUid) {
    throw new functions.https.HttpsError('invalid-argument', 'Target UID required.');
  }

  try {
    const userRecord = await admin.auth().getUser(targetUid);
    const roles = (userRecord.customClaims?.roles as string[]) || [];
    
    return {
      uid: targetUid,
      email: userRecord.email,
      roles
    };
  } catch (error) {
    throw new functions.https.HttpsError('not-found', 'User not found.');
  }
});
