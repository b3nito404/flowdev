/**
 * @fileoverview FlowDev  -  Intelligent CLI tool
 * @module flowdev
 * @version 1.0.5
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

import fs from 'node:fs/promises';
import path from 'node:path';
import chalk from 'chalk';

const IGNORED = new Set(['node_modules', '.git', 'dist']);

export async function generateTree(dir, prefix = '') {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  let output = '';

  entries.sort((a, b) => b.isDirectory() - a.isDirectory());

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    if (IGNORED.has(entry.name)) continue;

    const isLast = i === entries.length - 1;
    const connector = isLast ? '└── ' : '├── ';
    const name = entry.isDirectory() 
      ? chalk.blue.bold(entry.name + '/') 
      : chalk.white(entry.name);

    output += `${prefix}${connector}${name}\n`;

    if (entry.isDirectory()) {
      const newPrefix = prefix + (isLast ? '    ' : '│   ');
      output += await generateTree(path.join(dir, entry.name), newPrefix);
    }
  }
  return output;
}