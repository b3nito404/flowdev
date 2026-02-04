import ollama from 'ollama';
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs-extra';
import path from 'path';
import isBinaryPath from 'is-binary-path';
import { createRequire } from 'module';
import { ensureEngineReady } from '../../utils/engine-check.js';
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
    await ensureEngineReady(spinner, 'llama3');

    spinner.text = chalk.cyan(`Reading ${path.basename(filePath)}...`); 
    const content = await extractText(filePath);

    spinner.text = chalk.magenta('Analyzing content...');
    const response = await ollama.chat({  
      model: 'llama3',
      messages: [{ 
        role: 'user', 
        content: `Explain the following content clearly and concisely:\n\n${content.substring(0, 15000)}` 
      }],
      stream: true,
    });

    spinner.stop(); 
    console.log(chalk.red.bold(`ANALYSIS: ${path.basename(filePath).toUpperCase()} `));
    
    for await (const part of response) {
      process.stdout.write(chalk.white(part.message.content));
    }
  } catch (error) {
    spinner.stop();
    logger.error(`Explain error: ${error.message}`);
  }
}