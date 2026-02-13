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
import isBinaryPath from 'is-binary-path';
import { createRequire } from 'module';
import { getAIResponse } from '../../utils/engine-check.js'; 
import { logger } from '../../utils/logger.js';

const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');
const mammoth = require('mammoth');
                                                    
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
  if (!filePath) {
    logger.error('Please specify a file path.'); 
    return;   
  }

  const spinner = ora(chalk.cyan('Initializing...')).start();

  try {
    spinner.text = chalk.cyan(`Reading ${path.basename(filePath)}...`); 
    const content = await extractText(filePath);

    
    const responseStream = await getAIResponse(
        [{ 
            role: 'user', 
            content: `Explain the following content clearly and concisely:\n\n${content.substring(0, 15000)}` 
        }],
        spinner
    );

    spinner.stop(); 
    console.log(chalk.red.bold(`ANALYSIS: ${path.basename(filePath).toUpperCase()} `));
    
    for await (const part of responseStream) {
      process.stdout.write(chalk.white(part.message.content));
    }
    process.stdout.write('\n');
    
  } catch (error) {
    spinner.stop();
    logger.error(`Explain error: ${error.message}`);
  }
}