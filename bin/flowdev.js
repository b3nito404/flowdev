#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { showLogo } from '../src/utils/ascii.js';
import { setupCLI } from '../src/core/cli.js';


async function handleBranding() {
  
  const ppid = process.ppid;
  const sessionFlag = path.join(os.tmpdir(), `flowdev_session_${ppid}`);

  if (!fs.existsSync(sessionFlag)) {
    await showLogo();
   
    fs.writeFileSync(sessionFlag, '');
  }
}
async function main() {
  await handleBranding();

  const program = setupCLI();
  program.parse(process.argv);
}
main().catch((err) => {
  console.error('Critical error :', err);
  process.exit(1);
});