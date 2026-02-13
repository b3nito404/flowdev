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

export async function readmeCommand() {
  const spinner = ora(chalk.cyan('Reading project structure...')).start();

  try {
    const rootDir = process.cwd();
    let projectInfo = "";

    if (await fs.pathExists(path.join(rootDir, 'package.json'))) {
      const pkg = await fs.readJson(path.join(rootDir, 'package.json'));
      projectInfo += `Type: Node.js, Name: ${pkg.name}, Deps: ${Object.keys(pkg.dependencies || {}).join(', ')}`;
    } else if (await fs.pathExists(path.join(rootDir, 'manage.py'))) {
      projectInfo += `Type: Django/Python project`;
    }

    const prompt = `
     Generate a professional README.md for a project with these details: ${projectInfo}.
      The README should include:
      - A catchy title with an emoji.
      - Description, Installation, Usage.
      - Return ONLY the markdown content.
    `;

    const responseStream = await getAIResponse(
        [{ role: 'user', content: prompt }],
        spinner
    );

    let readmeContent = "";
    spinner.text = chalk.magenta('Drafting your documentation...');

    for await (const part of responseStream) {
        readmeContent += part.message.content;
    }

    const readmePath = path.join(rootDir, 'README.md');
    await fs.writeFile(readmePath, readmeContent);

    spinner.succeed(chalk.green('README.md generated successfully!'));

  } catch (error) {
    spinner.stop();
    logger.error('Failed to generate README: ' + error.message);
  }
}