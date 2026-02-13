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
import path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { execSync } from 'child_process';
import { logger } from '../../utils/logger.js';

const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const npxCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';

const PYTHON_REGEX = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
const GENERAL_REGEX = /^[a-zA-Z][a-zA-Z0-9-_]*$/;


function execute(command, spinner, progressText) {
  if (progressText) spinner.text = progressText;
  try {

    execSync(command, { stdio: 'pipe', encoding: 'utf-8' });
  } catch (error) {
    const logFile = path.join(process.cwd(), 'flowdev-debug.log');
    const errorLog = `
COMMAND: ${command}
ERROR: ${error.message}
STDOUT: ${error.stdout}
STDERR: ${error.stderr}
    `;
    fs.writeFileSync(logFile, errorLog);
    throw new Error(`Command failed. Check the log file for details: ${chalk.bold(logFile)}`);
  }
}

export async function generateCommand() {
  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'type',
      message: 'Choose your project template:',
      choices: [
        { name: 'React + Tailwind (Vite)', value: 'react-tailwind' },
        { name: 'Vue + Tailwind (Vite)', value: 'vue-tailwind' },
        { name: 'Django (Project + App + Venv)', value: 'django' },
        { name: 'Angular (Workspace)', value: 'angular' },
        { name: 'Express API (Minimal)', value: 'express' }
      ]
    },
    {
      type: 'input',
      name: 'projectName',
      message: 'Project name:',
      default: 'my_flow_app',
      validate: (input, currentAnswers) => {
        const name = input.trim();
        if (!name) return 'A name is required.';
        if (/^\d/.test(name)) return 'Name cannot start with a number.';
        
        if (currentAnswers.type === 'django') {
          if (!PYTHON_REGEX.test(name)) return 'Use underscores (_) for Django projects.';
        } else {
          if (!GENERAL_REGEX.test(name)) return 'Invalid characters used (use alphanumeric, - or _).';
        }
        return true;
      }
    }
  ]);

  if (answers.type === 'django') {
    const djangoSub = await inquirer.prompt([{
      type: 'input',
      name: 'appName',
      message: 'Initial app name:',
      default: 'core',
      validate: (input) => {
        if (!PYTHON_REGEX.test(input)) return 'Invalid Python App name.';
        if (input === answers.projectName) return 'App name cannot be the same as project name.';
        return true;
      }
    }]);
    answers.appName = djangoSub.appName;
  }

  const projectDir = path.resolve(process.cwd(), answers.projectName);
  
  if (await fs.pathExists(projectDir)) {
    logger.error(`Error: Directory "${answers.projectName}" already exists.`);
    return;
  }

  const spinner = ora(chalk.magenta('Generating your project...')).start();

  try {
    switch (answers.type) {
      case 'react-tailwind': await setupVite(projectDir, answers.projectName, 'react', true, spinner); break;
      case 'vue-tailwind': await setupVite(projectDir, answers.projectName, 'vue', true, spinner); break;
      case 'django': await setupDjango(projectDir, answers, spinner); break;
      case 'angular': await setupAngular(projectDir, answers.projectName, spinner); break;
      case 'express': await setupExpress(projectDir, answers.projectName, spinner); break;
    }

    await initGit(projectDir, spinner);
    spinner.succeed(chalk.green(`Project "${answers.projectName}" successfully generated.`));
    showSuccessTips(answers);

  } catch (error) {
    spinner.fail(chalk.red('Installation encountered an error.'));
    console.error(`\n${chalk.bgRed(' DEBUG ')} ${error.message}`);
  }
}



async function setupVite(dir, name, framework, withTailwind, spinner) {
  execute(`${npmCmd} create vite@latest "${name}" -- --template ${framework}`, spinner, `Scaffolding ${framework} with Vite...`);
  
  const originalDir = process.cwd();
  process.chdir(dir);

  execute(`${npmCmd} install`, spinner, 'Installing project dependencies...');

  const folders = ['components', 'services', 'utils', 'hooks', 'assets'];
  for (const f of folders) await fs.ensureDir(path.join(dir, 'src', f));

  if (withTailwind) {
    execute(`${npmCmd} install -D tailwindcss@3 postcss@8 autoprefixer@10`, spinner, 'Installing Tailwind CSS...');

    const tailwindConfig = `export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx,vue}"],
  theme: { extend: {} },
  plugins: [],
}`;
    await fs.writeFile(path.join(dir, 'tailwind.config.js'), tailwindConfig);
    await fs.writeFile(path.join(dir, 'postcss.config.js'), `export default { plugins: { tailwindcss: {}, autoprefixer: {} } }`);

    const cssPath = path.join(dir, 'src', 'index.css');
    const tailwindDirectives = `@tailwind base;\n@tailwind components;\n@tailwind utilities;\n\n`;
    const currentCss = (await fs.pathExists(cssPath)) ? await fs.readFile(cssPath, 'utf-8') : "";
    await fs.writeFile(cssPath, tailwindDirectives + currentCss);
  }
  process.chdir(originalDir);
}

async function setupDjango(dir, data, spinner) {
  const { projectName, appName } = data;
  const isWin = process.platform === 'win32';
  
  await fs.ensureDir(dir);
  const originalDir = process.cwd();
  process.chdir(dir);

  try {
    execute(`${pythonCmd} -m venv venv`, spinner, 'Creating Virtual Environment...');
    
    const venvPython = isWin ? path.join(dir, 'venv', 'Scripts', 'python.exe') : path.join(dir, 'venv', 'bin', 'python');
    
    execute(`"${venvPython}" -m pip install django`, spinner, 'Installing Django via pip...');
    execute(`"${venvPython}" -m django startproject config .`, spinner, 'Initializing Django core...');
    execute(`"${venvPython}" manage.py startapp ${appName}`, spinner, `Creating app: ${appName}...`);


    const settingsPath = path.join(dir, 'config', 'settings.py');
    let settings = await fs.readFile(settingsPath, 'utf-8');
    settings = settings.replace("INSTALLED_APPS = [", `INSTALLED_APPS = [\n    '${appName}',`);
    await fs.writeFile(settingsPath, settings);

    // Basic app configuration
    await fs.writeFile(path.join(dir, appName, 'urls.py'), `from django.urls import path\nfrom . import views\n\nurlpatterns = [ path('', views.index, name='index'), ]`);
    await fs.writeFile(path.join(dir, appName, 'views.py'), `from django.http import HttpResponse\n\ndef index(request):\n    return HttpResponse("<h1>${projectName} is live!</h1>")`);
    
    // Global URL routing
    const projectUrlsPath = path.join(dir, 'config', 'urls.py');
    const projectUrls = `from django.contrib import admin\nfrom django.urls import path, include\n\nurlpatterns = [\n    path('admin/', admin.site.urls),\n    path('', include('${appName}.urls')),\n]`;
    await fs.writeFile(projectUrlsPath, projectUrls);

  } finally {
    process.chdir(originalDir);
  }
}

async function initGit(dir, spinner) {
  try {
    spinner.text = 'Initializing Git repository...';
    const ignorePath = path.join(dir, '.gitignore');
    if (!(await fs.pathExists(ignorePath))) {
      await fs.writeFile(ignorePath, 'node_modules\n.env\ndist\nbuild\n__pycache__\n*.log\nvenv\n*.pyc\n');
    }
    const originalDir = process.cwd();
    process.chdir(dir);
    execute('git init', spinner);
    execute('git add .', spinner);
    execute('git commit -m "Initial commit by FlowDev"', spinner);
    process.chdir(originalDir);
  } catch (err) {
    spinner.warn(chalk.yellow('Git initialization skipped. Please ensure Git is installed.'));
  }
}

async function setupAngular(dir, name, spinner) {
  execute(`${npxCmd} --yes -p @angular/cli ng new "${name}" --defaults --skip-git`, spinner, 'Generating Angular Workspace...');
}

async function setupExpress(dir, name, spinner) {
  await fs.ensureDir(dir);
  const pkg = { 
    name, 
    version: '1.0.0', 
    type: 'module', 
    scripts: { start: 'node src/index.js' }, 
    dependencies: { express: '^4.18.2', cors: '^2.8.5' }
  };
  await fs.writeJson(path.join(dir, 'package.json'), pkg, { spaces: 2 });
  await fs.ensureDir(path.join(dir, 'src'));
  await fs.writeFile(path.join(dir, 'src', 'index.js'), `import express from 'express';\nconst app = express();\napp.get('/', (req, res) => res.send('API OK'));\napp.listen(3000, () => console.log('Server running on http://localhost:3000'));`);
  
  const originalDir = process.cwd();
  process.chdir(dir);
  execute(`${npmCmd} install`, spinner, 'Installing Express dependencies...');
  process.chdir(originalDir);
}

function showSuccessTips(data) {
  console.log(chalk.blue('\n  Next Steps :'));
  console.log(`${chalk.white('1.')} cd ${chalk.bold(data.projectName)}`);
  if (data.type === 'django') {
    console.log(`${chalk.white('2.')} ${process.platform === 'win32' ? 'venv\\Scripts\\activate' : 'source venv/bin/activate'}`);
    console.log(`${chalk.white('3.')} python manage.py runserver`);
  } else if (data.type === 'angular') {
    console.log(`${chalk.white('2.')} ng serve`);
  } else {
    console.log(`${chalk.white('2.')} npm ${data.type.includes('tailwind') ? 'run dev' : 'start'}`);
  }
}