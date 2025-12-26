import * as Glob from 'glob';
import * as Fs from 'node:fs';

const dirs = ['.', ...Glob.sync('apps/*/'), ...Glob.sync('packages/**/')];
dirs.forEach((pkg) => {
  const files = [
    '.tsbuildinfo',
    'build',
    'dist',
    'coverage',
    '.output',
    '.nitro',
    'node_modules/.vite',
    'node_modules/.nitro',
  ];

  files.forEach((file) => {
    Fs.rmSync(`${pkg}/${file}`, { recursive: true, force: true }, () => {});
  });
});
