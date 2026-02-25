
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
import isBinaryPath from 'is-binary-path';
import { createRequire } from 'module';
import { getAIResponse } from '../../utils/engine-check.js';
import { logger } from '../../utils/logger.js';

const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');
const mammoth = require('mammoth');

const MAX_CHARS = 10_000;

async function extractText(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.docx') {
    const buffer = await fs.readFile(filePath);
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }
  if (ext === '.pdf') {
    const buffer = await fs.readFile(filePath);
    const data = await pdf(buffer);
    return data.text;
  }
  if (isBinaryPath(filePath)) throw new Error('Binary files are not supported.');
  return await fs.readFile(filePath, 'utf-8');
}

export async function explainCommand(filePath) {
  if (!filePath) return logger.error('Please specify a file path.');

  const spinner = ora(chalk.cyan('Reading file...')).start();

  try {
    const baseName = path.basename(filePath);
    const content = await extractText(filePath);

    const responseStream = await getAIResponse(
      [{
        role: 'user',
        content: `Explain this content clearly and concisely:\n\n${content.substring(0, MAX_CHARS)}`
      }],
      spinner
    );

    spinner.stop();
    console.log(chalk.red.bold(`\nANALYSIS: ${baseName.toUpperCase()}\n`)); 

    for await (const part of responseStream) {
      const text = part?.message?.content;
      if (text) process.stdout.write(chalk.white(text));
    }
    process.stdout.write('\n');
  } catch (error) {
    spinner.stop();
    logger.error(`Explain error: ${error.message}`);
  }
}