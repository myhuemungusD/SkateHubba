/**
 * God Mode Script - Bootstrap Admin Access
 * 
 * Run this script locally to grant yourself initial admin privileges.
 * NEVER hardcode admin emails in deployed functions.
 * 
 * Usage: npx tsx scripts/set-admin.ts
 * 
 * Prerequisites:
 * 1. Download serviceAccountKey.json from Firebase Console
 *    (Project Settings → Service Accounts → Generate New Private Key)
 * 2. Place it in the project root (it's gitignored)
 */

import * as admin from 'firebase-admin';
import * as path from 'path';

// 1. Initialize Firebase Admin with your Service Account
const serviceAccountPath = path.resolve(__dirname, '../serviceAccountKey.json');

try {
  const serviceAccount = require(serviceAccountPath);
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
} catch (error) {
  console.error('❌ ERROR: Could not find serviceAccountKey.json');
  console.error('   Please download it from Firebase Console:');
  console.error('   Project Settings → Service Accounts → Generate New Private Key');
  console.error('   Then place it in the project root directory.');
  process.exit(1);
}

// 2. Configuration - UPDATE THIS WITH YOUR EMAIL
const TARGET_EMAIL = process.env.ADMIN_EMAIL || "jason@designmainline.com";
const ROLES = ['admin', 'verified_pro'];

async function grantGodMode() {
  try {
    console.log(`🔍 Looking up user: ${TARGET_EMAIL}`);
    
    // 3. Find the user
    const user = await admin.auth().getUserByEmail(TARGET_EMAIL);
    
    // 4. Set Custom Claims (The "Magic" part)
    // We use a 'roles' array to allow multiple hats (e.g., Admin AND Pro)
    await admin.auth().setCustomUserClaims(user.uid, {
      roles: ROLES
    });

    console.log('');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`✅ SUCCESS: Granted [${ROLES.join(', ')}] to ${user.email}`);
    console.log(`🆔 User ID: ${user.uid}`);
    console.log('═══════════════════════════════════════════════════════');
    console.log('');
    console.log('⚠️  IMPORTANT: You must log out and log back in for changes to take effect.');
    console.log('');
    
    process.exit(0);
  } catch (error: any) {
    if (error.code === 'auth/user-not-found') {
      console.error(`❌ ERROR: No user found with email: ${TARGET_EMAIL}`);
      console.error('   Make sure the user has signed up first.');
    } else {
      console.error("❌ ERROR:", error.message || error);
    }
    process.exit(1);
  }
}

grantGodMode();
