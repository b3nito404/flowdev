#!/usr/bin/env node

/**
 * @fileoverview FlowDev  -  Intelligent CLI tool
 * @module flowdev
 * @version 1.2.0
 * * @license MIT
 * Copyright (c) 2026 FlowDev Technologies.
 * * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
 */

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
    try {
      fs.writeFileSync(sessionFlag, '');
    } catch (e) {
      
    }
  }
}

async function main() {
  await handleBranding();
  const program = setupCLI();
  program.parse(process.argv);
}

main().catch((err) => {
  console.error('\x1b[31m%s\x1b[0m', `Critical error: ${err.message}`);
  process.exit(1);
});