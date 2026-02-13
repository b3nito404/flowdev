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

import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs-extra';
import path from 'path';
import { getAIResponse } from '../../utils/engine-check.js'; 
import { logger } from '../../utils/logger.js';

const AUDIT_EXTENSIONS = ['.js', '.ts', '.py', '.php', '.go', '.jsx', '.tsx', '.vue'];
const IGNORE_DIRS = ['node_modules', '.git', 'dist', 'build', 'venv'];

async function getFiles(dir) {
  const subdirs = await fs.readdir(dir);
  const files = await Promise.all(subdirs.map(async (subdir) => {
    const res = path.resolve(dir, subdir);
    if (IGNORE_DIRS.includes(subdir)) return [];
    return (await fs.stat(res)).isDirectory() ? getFiles(res) : res;
  }));
  return files.flat().filter(f => AUDIT_EXTENSIONS.includes(path.extname(f)));
}

export async function auditCommand() {
  const spinner = ora(chalk.cyan('Scanning project for audit...')).start();

  try {
    const rootDir = process.cwd();
    const files = await getFiles(rootDir);

    if (files.length === 0) {
      spinner.fail(chalk.red('No source files found to audit.'));
      return;
    }

    spinner.text = chalk.magenta(`Preparing audit for ${files.length} files...`);

    let codeContext = "";
    for (const file of files.slice(0, 15)) { 
        const content = await fs.readFile(file, 'utf-8');
        codeContext += `\n--- File: ${path.basename(file)} ---\n${content}\n`;
    }

    const prompt = `
      Analyze the following code for:
      1. Potential Bugs or logic errors.
      2. Security vulnerabilities (exposed keys, unsafe inputs).
      3. Performance bottlenecks.
      4. Code quality and Best Practices.

      Provide a concise report with clear headings and bullet points.
      
      Code to analyze:
      ${codeContext.substring(0, 30000)} 
    `;
    const responseStream = await getAIResponse(
        [{ role: 'user', content: prompt }], 
        spinner
    );

    spinner.stop();
    for await (const part of responseStream) {
      process.stdout.write(chalk.white(part.message.content));
    }

    console.log(chalk.cyan('\n\nAudit complete. Always verify AI suggestions.'));

  } catch (error) {
    spinner.stop();
    logger.error(`Audit failed: ${error.message}`);
  }
}