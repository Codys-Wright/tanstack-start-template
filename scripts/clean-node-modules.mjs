import * as Glob from 'glob';
import * as Fs from 'node:fs';

const dirs = ['.', ...Glob.sync('packages/*/'), ...Glob.sync('apps/*/')];
dirs.forEach((dir) => {
  const files = ['node_modules'];

  files.forEach((file) => {
    const fullPath = `${dir}/${file}`;
    if (Fs.existsSync(fullPath)) {
      Fs.rmSync(fullPath, { recursive: true, force: true });
    }
  });
});
