
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

import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs-extra';
import path from 'path';
import { getAIResponse } from '../../utils/engine-check.js';
import { logger } from '../../utils/logger.js';

const AUDIT_EXTENSIONS = ['.js', '.ts', '.py', '.php', '.go', '.jsx', '.tsx', '.vue'];
const IGNORE_DIRS = ['node_modules', '.git', 'dist', 'build', 'venv', '.next'];
const MAX_FILES = 10;
const MAX_CHARS = 20_000;

async function getFiles(dir) {
  const entries = await fs.readdir(dir);
  const files = await Promise.all(
    entries.map(async (entry) => {
      if (IGNORE_DIRS.includes(entry)) return [];
      const res = path.resolve(dir, entry);            
      return (await fs.stat(res)).isDirectory() ? getFiles(res) : res;
    })
  );
  return files.flat().filter(f => AUDIT_EXTENSIONS.includes(path.extname(f))); 
}

export async function auditCommand() {
  const spinner = ora(chalk.cyan('Scanning files for audit...')).start();

  try {
    const rootDir = process.cwd();
    const files = await getFiles(rootDir);

    if (files.length === 0) {
      spinner.fail(chalk.red('No source files found.'));
      return;
    }

    let codeContext = '';
    for (const file of files.slice(0, MAX_FILES)) {
      const content = await fs.readFile(file, 'utf-8');
      codeContext += `\n--- File: ${path.basename(file)} ---\n${content}\n`; 
    }

    const prompt = `
Analyze this code for bugs, security flaws, and performance issues.
Provide a concise report with bullet points.
Code context:
${codeContext.substring(0, MAX_CHARS)}
    `.trim();

    const responseStream = await getAIResponse(
      [{ role: 'user', content: prompt }],
      spinner
    );

    spinner.stop();
    console.log(chalk.bold.magenta('\nAudit Report:\n'));

    for await (const part of responseStream) {
      const text = part?.message?.content;
      if (text) process.stdout.write(chalk.white(text));
    }
    console.log(chalk.cyan('\n\nAudit complete.'));
  } catch (error) {
    spinner.stop();
    logger.error(`Audit failed: ${error.message}`);
  }
}