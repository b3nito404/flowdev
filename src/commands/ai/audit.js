import ollama from 'ollama';
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs-extra';
import path from 'path';
import { ensureEngineReady } from '../../utils/engine-check.js';
import { logger } from '../../utils/logger.js';

const AUDIT_EXTENSIONS = ['.js', '.ts', '.py', '.php', '.go', '.jsx', '.tsx', '.vue'];
const IGNORE_DIRS = ['node_modules', '.git', 'dist', 'build', 'venv'];

async function getFiles(dir) {
  const subdirs = await fs.readdir(dir);
  const files = await Promise.all(subdirs.map(async (subdir) => {
    const res = path.resolve(dir, subdir);
    if (IGNORE_DIRS.includes(subdir)) return [];
    return (await fs.stat(res)).isDirectory() ? getFiles(res) : res;
  }));
  return files.flat().filter(f => AUDIT_EXTENSIONS.includes(path.extname(f)));
}

export async function auditCommand() {
  const spinner = ora(chalk.cyan('Scanning project for audit...')).start();

  try {
    const rootDir = process.cwd();
    const files = await getFiles(rootDir);

    if (files.length === 0) {
      spinner.fail(chalk.red('No source files found to audit.'));
      return;
    }

    await ensureEngineReady(spinner, 'llama3');
    
    spinner.text = chalk.magenta(`Auditing ${files.length} files...`);

    let codeContext = "";
    for (const file of files.slice(0, 10)) { 
        const content = await fs.readFile(file, 'utf-8');
        codeContext += `\n--- File: ${path.basename(file)} ---\n${content}\n`;
    }

    const prompt = `
      As an Expert Security Auditor,
      Analyze the following code for:
      1. Potential Bugs or logic errors.
      2. Security vulnerabilities (exposed keys, unsafe inputs).
      3. Performance bottlenecks.
      4. Code quality and Best Practices.

      Provide a concise report with clear headings and bullet points.
      If the code is perfect, congratulate the developer.
      
      Code to analyze:
      ${codeContext}
    `;

    const response = await ollama.chat({
      model: 'llama3',
      messages: [{ role: 'user', content: prompt }],
      stream: true,
    });

    spinner.stop();
    console.log(chalk.bold.yellow('\n FLOWDEV AUDIT REPORT\n'));

    for await (const part of response) {
      process.stdout.write(chalk.white(part.message.content));
    }

    console.log(chalk.cyan('\n\nAudit complete. Always double-check AI suggestions before applying.'));

  } catch (error) {
    spinner.stop();
    logger.error(`Audit failed: ${error.message}`);
  }
}