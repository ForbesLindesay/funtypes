'use strict';

// Makes the script crash on unhandled rejections instead of silently
// ignoring them. In the future, promise rejections that are not handled will
// terminate the Node.js process with a non-zero exit code.
process.on('unhandledRejection', err => {
  throw err;
});

import { spawn } from 'child_process';

const command = [process.env.CI ? '--list-different' : '--write', './**/*.{ts,tsx,js,json,css}'];

spawn(`prettier`, command, { stdio: 'inherit' }).on('exit', exitCode => {
  if (exitCode) {
    console.error('Found formatting issues');
    console.error('Looks like someone forgot to run `npm run format` before pushing 😱');
    process.exit(1);
  }
});
