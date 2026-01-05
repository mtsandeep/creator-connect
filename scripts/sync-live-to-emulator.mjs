// ============================================
// SYNC LIVE FIRESTORE DATA TO EMULATOR
// ============================================
//
// Usage: npm run sync:emulator
//
// This script fetches data from your live Firebase project
// and imports it into the local Firestore emulator.
//
// Prerequisites:
// 1. Run the Firebase emulators first (firebase emulators:start)
// 2. Download service account key from Firebase Console and save as firebase-service-account.json
// ============================================

import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const PROJECT_ID = 'creator-connect-c19ba';
const EMULATOR_HOST = '127.0.0.1:8080';
const OUTPUT_DIR = path.join(__dirname, '..', 'firestore-export');

// Collections to sync
const COLLECTIONS = [
  'users',
  'proposals',
  'transactions',
  'paymentOrders',
  'apiCache',
  'rateLimits'
];

async function initializeAdmin() {
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_KEY ||
    path.join(__dirname, '..', 'firebase-service-account.json');

  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: PROJECT_ID
    });
    console.log('✅ Initialized with service account');
  } else {
    console.log('\n⚠️  No service account found!');
    console.log('   To sync from live Firestore, you need a service account key:');
    console.log('   1. Go to: https://console.firebase.google.com/project/' + PROJECT_ID + '/settings/serviceaccounts/adminsdk');
    console.log('   2. Click "Generate new private key"');
    console.log('   3. Save it as firebase-service-account.json in your project root\n');
    throw new Error('Service account not found');
  }
}

async function exportCollection(collectionName) {
  const db = admin.firestore();
  const snapshot = await db.collection(collectionName).get();

  if (snapshot.empty) {
    console.log(`  📭 ${collectionName}: No documents`);
    return {};
  }

  const data = {};
  snapshot.forEach(doc => {
    const docData = doc.data();
    const converted = convertTimestamps(docData);
    data[doc.id] = converted;
  });

  console.log(`  📦 ${collectionName}: ${snapshot.size} documents`);
  return data;
}

function convertTimestamps(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  // Check for Firestore Timestamp
  if (obj.constructor.name === 'Timestamp') {
    return obj.toDate().toISOString();
  }

  // Check for Firestore GeoPoint
  if (obj.constructor.name === 'GeoPoint') {
    return { latitude: obj.latitude, longitude: obj.longitude };
  }

  // Check for Firestore DocumentReference
  if (obj.constructor.name === 'DocumentReference') {
    return obj.path;
  }

  if (Array.isArray(obj)) {
    return obj.map(convertTimestamps);
  }

  const converted = {};
  for (const [key, value] of Object.entries(obj)) {
    converted[key] = convertTimestamps(value);
  }

  return converted;
}

async function exportAllData() {
  console.log('\n📥 Exporting data from live Firestore...\n');

  const exportData = {};

  for (const collectionName of COLLECTIONS) {
    try {
      exportData[collectionName] = await exportCollection(collectionName);
    } catch (error) {
      if (error.code === 'permission-denied') {
        console.log(`  ❌ ${collectionName}: Permission denied (skipping)`);
      } else {
        console.log(`  ⚠️  ${collectionName}: ${error.message}`);
      }
      exportData[collectionName] = {};
    }
  }

  // Save to file
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const outputFile = path.join(OUTPUT_DIR, 'firestore-data.json');
  fs.writeFileSync(outputFile, JSON.stringify(exportData, null, 2));

  console.log(`\n✅ Export complete! Data saved to: ${outputFile}\n`);
  return exportData;
}

async function importToEmulator(data) {
  console.log('📤 Importing data to Firestore emulator...\n');

  // Point to emulator
  process.env.FIRESTORE_EMULATOR_HOST = `${EMULATOR_HOST}`;

  // Initialize new app instance for emulator
  const emulatorApp = admin.initializeApp(
    {
      projectId: PROJECT_ID,
    },
    'emulator-app'
  );

  const emulatorDb = admin.firestore(emulatorApp);

  let totalImported = 0;

  for (const [collectionName, documents] of Object.entries(data)) {
    if (Object.keys(documents).length === 0) {
      console.log(`  ⏭️  ${collectionName}: Skip (no data)`);
      continue;
    }

    console.log(`  📥 ${collectionName}...`);

    let count = 0;
    for (const [docId, docData] of Object.entries(documents)) {
      try {
        await emulatorDb.collection(collectionName).doc(docId).set(docData);
        count++;
        totalImported++;
      } catch (error) {
        console.log(`     ⚠️  Failed to import ${docId}: ${error.message}`);
      }
    }

    console.log(`     ✅ ${count} documents`);
  }

  await emulatorApp.delete();

  console.log(`\n✅ Import complete! Total: ${totalImported} documents\n`);
}

async function exportAndImport() {
  try {
    await initializeAdmin();

    // Export from live
    const exportData = await exportAllData();

    // Check if emulator is running
    try {
      const emulatorCheck = await fetch(`http://${EMULATOR_HOST}/`);
      if (!emulatorCheck.ok) {
        throw new Error('Emulator not responding');
      }
    } catch {
      console.log('\n⚠️  Firestore emulator is not running!');
      console.log('Please start it with: firebase emulators:start --only functions,firestore');
      console.log('Data has been exported to', OUTPUT_DIR, '- you can import it later.\n');
      return;
    }

    // Import to emulator
    await importToEmulator(exportData);

    console.log('🎉 All done! Your emulator now has live data.\n');
  } catch (error) {
    if (error.message === 'Service account not found') {
      process.exit(1);
    }
    console.error('\n❌ Error:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Make sure emulators are running: firebase emulators:start');
    console.error('2. Set up service account credentials');
    console.error('3. Check your internet connection\n');
    process.exit(1);
  }
}

// Run the sync
exportAndImport().then(() => {
  process.exit(0);
});
