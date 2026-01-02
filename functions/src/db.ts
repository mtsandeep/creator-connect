// ============================================
// SHARED FIREBASE ADMIN INSTANCE
// ============================================

import * as admin from 'firebase-admin';

// Initialize Firebase Admin (only once)
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: process.env.GCLOUD_PROJECT,
  });
}

// Configure Firestore emulator in development
if (process.env.NODE_ENV !== 'production') {
  admin.firestore().settings({
    host: 'localhost:8080',
    ssl: false,
  });
}

// Export shared Firestore instance
export const db = admin.firestore();

// Export admin instance for FieldValue access
export { admin };
