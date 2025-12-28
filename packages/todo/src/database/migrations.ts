import { discoverFromPath } from '@core/database';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export const TodoMigrations = discoverFromPath(join(__dirname, 'migrations'));
