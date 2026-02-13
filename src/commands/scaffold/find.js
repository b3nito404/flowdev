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

import fs from 'fs-extra';
import path from 'node:path';
import chalk from 'chalk';
import { createInterface } from 'node:readline';
import ora from 'ora';


const IGNORED_DIRS = new Set(['node_modules', '.git', 'dist', 'build', '.next', 'coverage', '.idea', '.vscode']);


const BINARY_EXTS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg', 
  '.pdf', '.zip', '.tar', '.gz', '.7z', '.rar',
  '.exe', '.bin', '.dll', '.so', '.dylib', 
  '.lock', '.pyc', '.mp3', '.mp4'
]);

export async function findCommand(pattern, options) {
  let targetExtensions = null;
  if (options.ext) {
    targetExtensions = new Set(
      options.ext.split(',').map(e => {
        let clean = e.trim().toLowerCase();
        clean = clean.replace('*', ''); 
        return clean.startsWith('.') ? clean : '.' + clean;
      })
    );
  }

  const searchRegex = new RegExp(pattern, 'i');
  const spinner = ora(`Search for "${chalk.cyan(pattern)}"...`).start();
  
  let matchCount = 0;
  let fileCount = 0;
  const startDir = process.cwd();

  try {
    await scanDirectory(startDir);
    
    spinner.stop();
    
    if (matchCount === 0) {
      console.log(chalk.yellow(`No results for "${pattern}".`));
    } else {
      console.log(chalk.green(`\nDone ! ${matchCount} occurrences found in ${fileCount} scanned files.`));
    }
    console.log('\n');

  } catch (err) {
    spinner.fail('Error during search');
    console.error(err);
  }

 

  async function scanDirectory(dir) {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          if (!IGNORED_DIRS.has(entry.name)) {
            await scanDirectory(fullPath);
          }
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase();

          let shouldScan = false;

          if (targetExtensions) {
            if (targetExtensions.has(ext)) shouldScan = true;
          } else {
            if (!BINARY_EXTS.has(ext)) shouldScan = true;
          }

          if (shouldScan) {
            fileCount++;
            await searchInFile(fullPath);
          }
        }
      }
    } catch (e) {
      
    }
  }

  async function searchInFile(filePath) {
    const fileStream = fs.createReadStream(filePath);
    
    const rl = createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });

    let lineNum = 0;
    let foundInFile = false;

    for await (const line of rl) {
      lineNum++;
      
      
      if (searchRegex.test(line)) {
        matchCount++;
        
        if (!foundInFile) {
          const relativePath = path.relative(startDir, filePath);
          console.log(chalk.bold.blue(`\n ${relativePath}`));
          foundInFile = true;
        }

        const highlightedLine = line.replace(searchRegex, (match) => chalk.bgYellow.black(match));
        console.log(`  ${chalk.gray(lineNum.toString().padEnd(4))} │ ${highlightedLine.trim()}`);
      }
    }
  }
}