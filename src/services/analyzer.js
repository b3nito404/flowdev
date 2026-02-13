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

import fs from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import path from 'node:path';

const IGNORED_DIRS = new Set(['node_modules', '.git', 'dist', 'build', 'out', 'target']);
const SUPPORTED_EXTENSIONS = {
  '.js': 'JavaScript',
  '.ts': 'TypeScript',
  '.py': 'Python',
  '.go': 'Go',
  '.java': 'Java',
  '.rb': 'Ruby',
  '.php': 'PHP',
  '.html': 'HTML',
  '.css': 'CSS',
  '.json': 'JSON',
  '.yml': 'YAML',
  '.yaml': 'YAML'
};

const countLinesInFile = (filePath) => {
  return new Promise((resolve) => {
    let count = 0;
    createReadStream(filePath)
      .on('data', (chunk) => {
        for (let i = 0; i < chunk.length; ++i) {
          if (chunk[i] === 10) count++;
        }
      })
      .on('end', () => resolve(count))
      .on('error', () => resolve(0));
  });
};

async function scanDirectory(dirPath, stats) {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });

  const tasks = entries.map(async (entry) => {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      if (!IGNORED_DIRS.has(entry.name)) {
        await scanDirectory(fullPath, stats);
      }
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (SUPPORTED_EXTENSIONS[ext]) {
        const lang = SUPPORTED_EXTENSIONS[ext];
        const lines = await countLinesInFile(fullPath);
        stats.totalFiles++;
        stats.totalLines += lines;
        if (!stats.languages[lang]) {
          stats.languages[lang] = { files: 0, lines: 0 };
        }
        stats.languages[lang].files++;
        stats.languages[lang].lines += lines;
      }
    }
  });
  await Promise.all(tasks);
}

export async function analyzeProject(rootPath = process.cwd()) {
  const stats = {
    totalFiles: 0,
    totalLines: 0,
    languages: {},
    timestamp: new Date().toISOString()
  };

  try {
    await scanDirectory(rootPath, stats);
    return stats;
  } catch (error) {
    throw new Error(`Erreur lors de l'analyse du projet : ${error.message}`);
  }
}