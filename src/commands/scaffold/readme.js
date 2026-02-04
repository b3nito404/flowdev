import ollama from 'ollama';
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs-extra';
import path from 'path';
import { ensureEngineReady } from '../../utils/engine-check.js';
import { logger } from '../../utils/logger.js';

export async function readmeCommand() {
  const spinner = ora(chalk.cyan('Reading project structure...')).start();

  try {
    const rootDir = process.cwd();
    let projectInfo = "";

    
    if (await fs.pathExists(path.join(rootDir, 'package.json'))) {
      const pkg = await fs.readJson(path.join(rootDir, 'package.json'));
      projectInfo += `Type: Node.js/Web, Name: ${pkg.name}, Deps: ${Object.keys(pkg.dependencies || {}).join(', ')}`;
    } else if (await fs.pathExists(path.join(rootDir, 'manage.py'))) {
      projectInfo += `Type: Django/Python project`;
    }

    await ensureEngineReady(spinner, 'llama3');

    spinner.text = chalk.magenta('Drafting your documentation...');

    
    const prompt = `
      You are a technical writer. Generate a professional README.md for a project with these details: ${projectInfo}.
      The README should include:
      - A catchy title with an emoji.
      - A brief description.
      - Installation steps.
      - How to run the project.
      - Tech stack used.
      
      Return ONLY the markdown content.
    `;

    const response = await ollama.chat({
      model: 'llama3.2',
      messages: [{ role: 'user', content: prompt }],
    });
    const readmePath = path.join(rootDir, 'README.md');
    await fs.writeFile(readmePath, response.message.content);

    spinner.succeed(chalk.green('README.md generated successfully! '));

  } catch (error) {
    spinner.fail(chalk.red('Failed to generate README.'));
    logger.error(error.message);
  }
}