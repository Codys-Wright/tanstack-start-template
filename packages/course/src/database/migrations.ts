import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { discoverFromPath } from '@core/database';

const __dirname = dirname(fileURLToPath(import.meta.url));

export const CourseMigrations = discoverFromPath({
  path: join(__dirname, 'migrations'),
  prefix: 'course',
});
