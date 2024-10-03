'use strict';

// Makes the script crash on unhandled rejections instead of silently
// ignoring them. In the future, promise rejections that are not handled will
// terminate the Node.js process with a non-zero exit code.
process.on('unhandledRejection', err => {
  throw err;
});

const { spawn } = require('child_process');

const command = [
  'prettier',
  process.env.CI ? '--list-different' : '--write',
  './**/*.{ts,tsx,js,json,css}',
];

spawn(`yarn`, command, { stdio: 'inherit' }).on('exit', exitCode => {
  if (exitCode) {
    console.error('Found formatting issues');
    console.error('Looks like someone forgot to run `yarn format` before pushing 😱');
    process.exit(1);
  }
});
