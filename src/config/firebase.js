import { initializeApp, cert } from 'firebase-admin/app';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');

try {
  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    initializeApp({
      credential: cert(serviceAccount)
    });
    console.log('[Firebase Admin] Initialized securely with serviceAccountKey.json');
  } else {
    console.log('[Firebase Admin] Initializing without serviceAccountKey.json (using default ADC/projectId fallback)');
    initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID || 'sheger-systems'
    });
  }
} catch (error) {
  if (!/already exists/.test(error.message)) {
    console.error('[Firebase Admin] Initialization error', error.stack);
  }
}
