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

import ora from 'ora';
import chalk from 'chalk';
import { analyzeProject } from '../../services/analyzer.js';


export async function statsCommand() {
  const spinner = ora('Analysis of the ongoing project...').start();
  const start = Date.now();

  try {
    const stats = await analyzeProject();
    const duration = Date.now() - start;

    spinner.succeed(chalk.green(`Analysis completed in ${duration}ms !`));
    console.log('\n' + chalk.bold.underline('Analysis results :'));
    
   
    console.table(stats.languages);

    console.log(`\nFiles analyzed : ${chalk.cyan(stats.totalFiles)}`);
    console.log(` Total rows  : ${chalk.cyan(stats.totalLines)}`);
  } catch (error) {
    spinner.fail(chalk.red('Analysis failed.'));
    console.error(error.message);
  }
}

