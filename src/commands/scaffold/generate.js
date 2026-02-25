
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
import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { execSync } from 'child_process';
import { logger } from '../../utils/logger.js';

const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const npxCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
const goCmd = 'go';

class ProgressTracker {
  constructor(totalSteps) {
    this.totalSteps = totalSteps;
    this.currentStep = 0;
    this.barSize = 25;
  }
  next() { this.currentStep++; }
  getBar() {
    const progress = Math.min(this.currentStep / this.totalSteps, 1);
    const filled = Math.round(this.barSize * progress);
    return chalk.cyan(`[${"#".repeat(filled)}${"-".repeat(this.barSize - filled)}]`);
  }
}

/**
 * @param {string} command 
 * @param {object} spinner 
 * @param {object} tracker 
 * @param {string} text 
 * @param {boolean} inherit 
 */
function execute(command, spinner, tracker, text, inherit = false) {
  if (tracker) tracker.next();
  if (spinner) {
    spinner.text = `${tracker.getBar()} ${chalk.bold(text)}`;
  }
  
  try {
    
    if (inherit && spinner) spinner.stop(); 

    execSync(command, { 
      stdio: inherit ? 'inherit' : 'pipe', 
      encoding: 'utf-8', 
      env: process.env 
    });

    if (inherit && spinner) spinner.start();
  } catch (error) {
    const logFile = path.join(process.cwd(), 'flowdev-error.log');
    fs.writeFileSync(logFile, `CMD: ${command}\nERR: ${error.message}\nSTDERR: ${error.stderr || 'Check console'}`);
    throw new Error(`Command failed: ${command}.`);
  }
}

async function ensurePrerequisites(framework) {
  const requirements = {
    'go-micro': { cmd: 'go version', name: 'Go', install: { arch: 'sudo pacman -S --noconfirm go', debian: 'sudo apt install -y golang', mac: 'brew install go', win: 'winget install GoLang.Go' } },
    'fastapi': { cmd: `${pythonCmd} --version`, name: 'Python', install: { arch: 'sudo pacman -S --noconfirm python', debian: 'sudo apt install -y python3', mac: 'brew install python', win: 'winget install Python.Python.3' } },
    'django': { cmd: `${pythonCmd} --version`, name: 'Python', install: { arch: 'sudo pacman -S --noconfirm python', debian: 'sudo apt install -y python3', mac: 'brew install python', win: 'winget install Python.Python.3' } }
  };

  const req = requirements[framework];
  if (!req) return true;

  try {
    execSync(req.cmd, { stdio: 'pipe' });
    return true;
  } catch (e) {
    logger.warn(`${req.name} is not installed on your system.`);
    const { confirmInstall } = await inquirer.prompt([{
      type: 'confirm',
      name: 'confirmInstall',
      message: `Would you like FlowDev to try and install ${req.name} for you?`,
      default: true
    }]);

    if (confirmInstall) {
      const spinner = ora(`Installing ${req.name}...`).start();
      try {
        let installCmd = "";
        if (process.platform === 'win32') installCmd = req.install.win;
        else if (process.platform === 'darwin') installCmd = req.install.mac;
        else {
          const isArch = fs.existsSync('/etc/arch-release');
          installCmd = isArch ? req.install.arch : req.install.debian;
        }
        execSync(installCmd, { stdio: 'inherit' });
        spinner.succeed(`${req.name} installed successfully.`);
        return true;
      } catch (err) {
        spinner.fail(`Failed to auto-install ${req.name}. Please install it manually.`);
        return false;
      }
    }
    return false;
  }
}

export async function generateCommand() {
  logger.info("What are you building today ?");

  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'domain',
      message: 'Select Architecture:',
      choices: ['Frontend', 'Backend', 'Monorepo']
    },
    {
      type: 'list',
      name: 'framework',
      message: 'Select Stack:',
      when: (a) => a.domain !== 'Monorepo',
      choices: (a) => a.domain === 'Frontend' 
        ? ['next', 'react-vite', 'vue-vite']
        : ['go-micro', 'nestjs', 'express', 'fastapi', 'django']
    },
    {
      type: 'list',
      name: 'goFramework',
      message: 'Go Framework:',
      when: (a) => a.framework === 'go-micro',
      choices: ['std', 'gin', 'fiber']
    },
    {
      type: 'input',
      name: 'projectName',
      message: 'Project Name:',
      validate: (i) => /^[a-z0-9-_]+$/i.test(i) || 'Use alphanumeric characters only.'
    },
    {
      type: 'confirm',
      name: 'enterprisePack',
      message: 'Enable DevOps Pack?',
      default: true
    }
  ]);

  const ready = await ensurePrerequisites(answers.framework);
  if (!ready) {
    logger.error("Missing dependencies. Abortion.");
    return;
  }

  const projectDir = path.resolve(process.cwd(), answers.projectName);
  if (await fs.pathExists(projectDir)) {
    logger.error(`Folder ${answers.projectName} already exists.`);
    return;
  }

  const tracker = new ProgressTracker(8);
  const spinner = ora(chalk.magenta('Starting FlowDev Engine...')).start();

  try {
    if (answers.domain === 'Monorepo') {

      execute(`${npxCmd} --yes create-turbo@latest "${answers.projectName}" --package-manager=npm --example=basic`, spinner, tracker, 'Building Turborepo...', true);
    } else if (answers.framework === 'next') {
      execute(`${npxCmd} --yes create-next-app@latest "${answers.projectName}" --typescript --tailwind --eslint --app --src-dir --use-npm --no-git`, spinner, tracker, 'Scaffolding Next.js...', true);
    } else if (answers.framework === 'go-micro') {
      await setupGo(projectDir, answers, spinner, tracker);
    } else if (['fastapi', 'django'].includes(answers.framework)) {
      await setupPython(projectDir, answers, spinner, tracker);
    } else if (answers.framework && answers.framework.includes('vite')) {
      await setupVite(projectDir, answers, spinner, tracker);
    }

    if (process.cwd() !== projectDir && await fs.pathExists(projectDir)) process.chdir(projectDir);

    if (answers.enterprisePack) {
      spinner.text = `${tracker.getBar()} Generating Docker & CI/CD...`;
      let dockerfileContent = '';
      
      if (answers.framework === 'go-micro') {
        dockerfileContent = `FROM golang:1.21-alpine\nWORKDIR /app\nCOPY . .\nRUN go mod download\nRUN go build -o main ./cmd/api\nCMD ["./main"]`;
      } else if (answers.framework === 'fastapi') {
        dockerfileContent = `FROM python:3.11-slim\nWORKDIR /app\nCOPY . .\nRUN pip install -r requirements.txt\nCMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]`;
      } else if (answers.framework === 'django') {
        dockerfileContent = `FROM python:3.11-slim\nWORKDIR /app\nCOPY . .\nRUN pip install -r requirements.txt\nRUN python manage.py migrate\nCMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]`;
      } else {
        dockerfileContent = `FROM node:20-alpine\nWORKDIR /app\nCOPY . .\nRUN npm install\nCMD ["npm", "run", "dev"]`;
      }
      await fs.writeFile('Dockerfile', dockerfileContent);
      tracker.next();
    }

    execute('git init', spinner, tracker, 'Initializing Git...');
    await fs.writeFile('.gitignore', 'node_modules\n.env\ndist\nvenv\n*.log\n__pycache__\n*.sqlite3\n');

   
    let runCommand = 'npm run dev';
    if (answers.domain === 'Monorepo') {
       runCommand = 'npm run dev';
    } else if (answers.framework === 'go-micro') {
      runCommand = 'go run cmd/api/main.go';
    } else if (answers.framework === 'fastapi') {
      const activate = process.platform === 'win32' ? 'venv\\Scripts\\activate' : 'source venv/bin/activate';
      runCommand = `${activate} && uvicorn main:app --reload`;
    } else if (answers.framework === 'django') {
      const activate = process.platform === 'win32' ? 'venv\\Scripts\\activate' : 'source venv/bin/activate';
      runCommand = `${activate} && python manage.py runserver`;
    }

    spinner.succeed(chalk.green(`\nProject "${answers.projectName}" successfully created !`));
    logger.success(`Stack: ${answers.framework || 'Monorepo'} | DevOps: ${answers.enterprisePack}`);
    
    console.log(chalk.cyan(`\n  Run: cd ${answers.projectName} && ${runCommand}\n`));

  } catch (error) {
    if (spinner.isSpinning) spinner.fail(chalk.red('Process failed.'));
    logger.error(error.message);
  }
}

async function setupGo(dir, answers, spinner, tracker) {
  await fs.ensureDir(dir);
  process.chdir(dir);
  execute(`${goCmd} mod init ${answers.projectName}`, spinner, tracker, 'Initializing Go Mod...');
  if (answers.goFramework !== 'std') {
    const pkg = answers.goFramework === 'gin' ? 'github.com/gin-gonic/gin' : 'github.com/gofiber/fiber/v2';
    execute(`${goCmd} get ${pkg}`, spinner, tracker, `Fetching ${answers.goFramework}...`);
  }
  await fs.ensureDir('cmd/api');
  await fs.writeFile('cmd/api/main.go', 'package main\nimport "fmt"\nfunc main() { fmt.Println("FlowDev Go Live") }');
}

async function setupPython(dir, answers, spinner, tracker) {
  await fs.ensureDir(dir);
  process.chdir(dir);
  execute(`${pythonCmd} -m venv venv`, spinner, tracker, 'Creating Virtual Env...');
  const pip = process.platform === 'win32' ? 'venv\\Scripts\\pip' : './venv/bin/pip';
  const pythonVenv = process.platform === 'win32' ? 'venv\\Scripts\\python' : './venv/bin/python';

  if (answers.framework === 'fastapi') {
    execute(`${pip} install fastapi uvicorn`, spinner, tracker, 'Installing FastAPI...');
    const fastApiBoilerplate = `from fastapi import FastAPI\n\napp = FastAPI()\n\n@app.get("/")\ndef read_root():\n    return {"message": "FlowDev FastAPI is live!"}\n`;
    await fs.writeFile('main.py', fastApiBoilerplate);
    await fs.writeFile('requirements.txt', 'fastapi\nuvicorn');
  } else if (answers.framework === 'django') {
    execute(`${pip} install django`, spinner, tracker, 'Installing Django...');
    execute(`${pythonVenv} -m django startproject config .`, spinner, tracker, 'Scaffolding Django...');
    execute(`${pythonVenv} manage.py startapp core`, spinner, tracker, 'Creating core app...');
    
    const settingsPath = path.join(dir, 'config', 'settings.py');
    let settings = await fs.readFile(settingsPath, 'utf-8');
    settings = settings.replace("INSTALLED_APPS = [", "INSTALLED_APPS = [\n    'core',");
    await fs.writeFile(settingsPath, settings);

    const viewPath = path.join(dir, 'core', 'views.py');
    await fs.writeFile(viewPath, `from django.http import JsonResponse\ndef home(request):\n    return JsonResponse({"message": "FlowDev Django is live!"})`);

    const urlsPath = path.join(dir, 'config', 'urls.py');
    await fs.writeFile(urlsPath, `from django.contrib import admin\nfrom django.urls import path\nfrom core.views import home\n\nurlpatterns = [\n    path('admin/', admin.site.urls),\n    path('', home, name='home'),\n]`);

    execute(`${pythonVenv} manage.py migrate`, spinner, tracker, 'Running migrations...');
    execute(`${pip} freeze > requirements.txt`, spinner, tracker, 'Generating requirements.txt...');
  }
}

async function setupVite(dir, answers, spinner, tracker) {
  await fs.ensureDir(dir);
  process.chdir(dir);
  const tpl = answers.framework === 'react-vite' ? 'react-ts' : 'vue-ts';
  execute(`${npmCmd} create vite@latest . -- --template ${tpl}`, spinner, tracker, 'Vite Scaffolding...', true);
  execute(`${npmCmd} install`, spinner, tracker, 'Installing NPM packages...', true);
}