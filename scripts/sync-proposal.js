// ============================================
// SIMPLE FIRESTORE SYNC SCRIPT
// ============================================

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

async function syncProposal(proposalId) {
  // Import from your app's config
  const firebaseConfig = {
    projectId: 'creator-connect-c19ba',
    // You'll need to set up service account credentials
  };

  // For now, let's create a minimal test proposal
  const testData = {
    influencerId: '8ZLnQjZ20FSYqEoTYGDkVVZRlgj1',
    promoterId: 'test-promoter-id',
    status: 'pending',
    createdAt: new Date().toISOString(),
    message: 'Test proposal for development',
    collaborationType: 'sponsored_post',
    proposedAmount: 5000,
  };

  // Write to a file that can be imported
  const importDir = path.join(__dirname, '..', 'firestore-import');
  if (!fs.existsSync(importDir)) {
    fs.mkdirSync(importDir, { recursive: true });
  }

  const importFile = path.join(importDir, `${proposalId}.json`);
  fs.writeFileSync(importFile, JSON.stringify(testData, null, 2));

  console.log(`✅ Test data created for proposal ${proposalId}`);
  console.log(`📁 File: ${importFile}`);
  console.log(`\nTo import to emulator, run:`);
  console.log(`curl -X POST "http://127.0.0.1:8080/v1/projects/creator-connect-c19ba/databases/(default)/documents/proposals/${proposalId}" \\`);
  console.log(`  -H "Content-Type: application/json" \\`);
  console.log(`  -d @${importFile}`);
}

syncProposal('Trmo5mHIxX3W9sUElNZC');
