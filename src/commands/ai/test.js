
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
import { logger } from '../../utils/logger.js';
import { getAIResponse } from '../../utils/engine-check.js';


export async function testCommand(fileRelativePath) {

  const spinner = ora(chalk.cyan('Generating tests...')).start();
  try {
    const prompt = `Generate a ${framework} test file for this code. Return ONLY code.\n\n${content}`;
    const responseStream = await getAIResponse([{ role: 'user', content: prompt }], spinner);
    
    spinner.stop();
    let fullResponse = '';
    for await (const part of responseStream) {
        const txt = part?.message?.content;
        if (txt) fullResponse += txt;
    }

    const cleanCode = fullResponse.replace(/```[\w]*\n/g, '').replace(/```/g, '').trim();
    
    await fs.writeFile(outputPath, cleanCode);
    console.log(chalk.green(`\nTests saved at: ${outputPath}`));
  } catch (e) { spinner.stop(); logger.error(e.message); }
}