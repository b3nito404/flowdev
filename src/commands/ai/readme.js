
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

export async function readmeCommand() {
  const spinner = ora(chalk.cyan('Analyzing project structure...')).start();

  try {
    const rootDir = process.cwd();
    let projectInfo = 'Unknown project';

    // Détection du type de projet
    if (await fs.pathExists(path.join(rootDir, 'package.json'))) {      
      const pkg = await fs.readJson(path.join(rootDir, 'package.json')); 
      const deps = Object.keys(pkg.dependencies || {}).join(', ') || 'none';
      projectInfo = `Type: Node.js, Name: ${pkg.name}, Dependencies: ${deps}`;
    } else if (await fs.pathExists(path.join(rootDir, 'manage.py'))) {  
      projectInfo = 'Type: Django/Python project';
    } else if (await fs.pathExists(path.join(rootDir, 'Cargo.toml'))) { 
      projectInfo = 'Type: Rust project';
    }

    const prompt = `
Generate a professional README.md for this project: ${projectInfo}.
Include: Title with emoji, Description, Features, Installation, Usage, and License.
Return ONLY the raw markdown text. No code blocks/fences.
    `.trim();

    const responseStream = await getAIResponse(
      [{ role: 'user', content: prompt }],
      spinner
    );

    let readmeContent = '';
    spinner.text = chalk.magenta('Generating documentation...');

    for await (const part of responseStream) {
      const content = part?.message?.content;
      if (content) readmeContent += content;
    }

    // Nettoyage des balises markdown si le modèle en ajoute
    const cleanContent = readmeContent.replace(/```markdown\n/g, '').replace(/```/g, '').trim();

    const readmePath = path.join(rootDir, 'README.md');                 
    await fs.writeFile(readmePath, cleanContent);
    
    spinner.succeed(chalk.green(`README.md generated successfully!`));
  } catch (error) {
    spinner.stop();
    logger.error('Failed to generate README: ' + error.message);
  }
}