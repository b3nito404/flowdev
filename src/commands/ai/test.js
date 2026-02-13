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
import { logger } from '../../utils/logger.js';
import { getAIResponse } from '../../utils/engine-check.js'; // IMPORT UPDATED

export async function testCommand(fileRelativePath) {
  const spinner = ora(chalk.cyan(`Preparing test generation...`)).start();

  try {
    const filePath = path.resolve(process.cwd(), fileRelativePath);
    
    if (!(await fs.pathExists(filePath))) {
      spinner.fail(chalk.red(`File not found: ${fileRelativePath}`));
      return;
    }

    const content = await fs.readFile(filePath, 'utf-8');
    const ext = path.extname(filePath);
    const fileName = path.basename(filePath, ext);
    const dir = path.dirname(filePath);
    
    let framework = "Vitest";
    let testFileName = `${fileName}.test${ext}`;
    
    if (ext === '.py') {
      framework = "Pytest";
      testFileName = `test_${fileName}${ext}`;
    }

    const prompt = `
      Analyze the following code and generate a complete test file using ${framework}.
      Requirements:
      - Include all necessary imports.
      - Cover main functions with happy paths and edge cases.
      - Return ONLY the code block starting with \`\`\` and ending with \`\`\`.
      
      Code to test:
      ${content}
    `;

    // APPEL UNIFIÉ
    const responseStream = await getAIResponse(
        [{ role: 'user', content: prompt }],
        spinner
    );

    // On consomme le stream pour reconstruire la réponse complète
    let fullResponse = "";
    spinner.text = chalk.yellow("Writing tests (Streaming)...");
    
    for await (const part of responseStream) {
        fullResponse += part.message.content;
        // Petit effet visuel optionnel pour montrer que ça bosse
        spinner.text = chalk.yellow(`Generating tests... (${fullResponse.length} chars)`);
    }

    spinner.stop();

    const codeBlockRegex = /```[\w]*\n([\s\S]*?)```/;
    const match = fullResponse.match(codeBlockRegex);
    const testCode = match ? match[1] : fullResponse;

    const outputPath = path.join(dir, testFileName);
    await fs.writeFile(outputPath, testCode);

    console.log(chalk.green(`\n✅ Tests generated successfully!`));
    console.log(chalk.gray(` Location: `) + chalk.white(outputPath));
    console.log(chalk.yellow(` Tip: Run your tests with '${ext === '.py' ? 'pytest' : 'npm test'}'`));

  } catch (error) {
    spinner.stop();
    logger.error('Test generation failed: ' + error.message);
  }
}