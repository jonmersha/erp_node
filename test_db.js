import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

import { initDb } from './src/schema.js';
initDb().then(() => {
  console.log('initDb finished');
  process.exit(0);
}).catch(e => {
  console.error('initDb error:', e);
  process.exit(1);
});
