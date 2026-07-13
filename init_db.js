import pool from './src/db.js';

import { initDb } from './src/schema.js';

initDb().then(() => process.exit(0)).catch(() => process.exit(1));
