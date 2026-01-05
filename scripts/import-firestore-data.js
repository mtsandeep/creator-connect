// ============================================
// FIRESTORE DATA IMPORT/EXPORT SCRIPT
// ============================================

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = require('../firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'creator-connect-c19ba'
});

const db = admin.firestore();

// Export all data from live Firestore
async function exportFirestoreData(outputPath = './firestore-export') {
  console.log('📦 Exporting Firestore data...');

  const collections = ['users', 'proposals', 'transactions', 'paymentOrders', 'apiCache', 'rateLimits'];
  const exportData = {};

  for (const collectionName of collections) {
    console.log(`  Exporting ${collectionName}...`);
    const snapshot = await db.collection(collectionName).get();
    exportData[collectionName] = {};

    snapshot.forEach(doc => {
      exportData[collectionName][doc.id] = doc.data();
    });

    console.log(`    ✓ ${snapshot.size} documents from ${collectionName}`);
  }

  // Write to file
  const outputDir = path.resolve(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputFile = path.join(outputDir, 'firestore-data.json');
  fs.writeFileSync(outputFile, JSON.stringify(exportData, null, 2));

  console.log(`\n✅ Export complete! Data saved to: ${outputFile}`);
}

// Import data to local emulator
async function importToEmulator(inputFile = './firestore-export/firestore-data.json') {
  console.log('📥 Importing data to Firestore emulator...');

  // Point to emulator
  const emulatorDb = admin.firestore();
  process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';

  if (!fs.existsSync(inputFile)) {
    console.error(`❌ File not found: ${inputFile}`);
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(inputFile, 'utf8'));

  for (const [collectionName, documents] of Object.entries(data)) {
    console.log(`  Importing ${collectionName}...`);
    let count = 0;

    for (const [docId, docData] of Object.entries(documents)) {
      await emulatorDb.collection(collectionName).doc(docId).set(docData);
      count++;
    }

    console.log(`    ✓ ${count} documents to ${collectionName}`);
  }

  console.log('\n✅ Import complete!');
}

// Run based on command line args
const command = process.argv[2];

if (command === 'export') {
  exportFirestoreData(process.argv[3]);
} else if (command === 'import') {
  importToEmulator(process.argv[3]);
} else {
  console.log('\nUsage:');
  console.log('  node scripts/import-firestore-data.js export [output-path]');
  console.log('  node scripts/import-firestore-data.js import [input-file]');
  console.log('\nExamples:');
  console.log('  node scripts/import-firestore-data.js export');
  console.log('  node scripts/import-firestore-data.js import ./firestore-export/firestore-data.json');
}
