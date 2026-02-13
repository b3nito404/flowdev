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
import { logger } from '../../utils/logger.js';
import { getAIResponse } from '../../utils/engine-check.js'; 

export async function askCommand(question) {
  if (!question) {
    logger.error('Ask me a question!');
    return;
  }

  let spinner = ora(chalk.cyan('Initialization...')).start();

  try {
    let context = 'You are FlowDev, an intelligent CLI assistant.';
    try {
      if (await fs.pathExists('package.json')) {
        const pkg = await fs.readJson('package.json');
        if (pkg?.name) context += ` CURRENT CONTEXT: User is in project "${pkg.name}".`;
      }
    } catch (e) {}
    const responseStream = await getAIResponse(
        [
            { role: 'system', content: context },
            { role: 'user', content: question }
        ],
        spinner
    );

    spinner.stop();
    console.log(chalk.bold.magenta('FlowDev:'));

    for await (const part of responseStream) {
      const content = part?.message?.content;
      if (typeof content === 'string') {
        process.stdout.write(chalk.white(content));
      }
    }
    process.stdout.write('\n');
  } catch (error) {
    spinner.stop();
    logger.error('Error: ' + error.message);
  }
}