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

        if (/^\d/.test(name)) {
          return ' Name cannot start with a number. Please use a letter.';
        }

      
        if (currentAnswers.type === 'django') {
          if (!PYTHON_REGEX.test(name)) {
            return ' Django projects cannot contain dashes (-) or spaces. Use underscores (_) instead.';
          }
        } 
       
        else {
          if (!GENERAL_REGEX.test(name)) {
            return ' Invalid name. Use letters, numbers, dashes (-) or underscores (_).';
          }
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
        const name = input.trim();
        
        if (!PYTHON_REGEX.test(name)) {
          return ' Invalid Python App name. Must start with a letter and contain no dashes.';
        }
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

    spinner.succeed(chalk.green(`Project "${answers.projectName}" is ready and configured!`));
    showSuccessTips(answers);

  } catch (error) {
    spinner.fail(chalk.red('Generation failed.'));
    console.error(chalk.red(`\nDetailed Error: ${error.message}`));
  }
}



async function setupVite(dir, name, framework, withTailwind, spinner) {
  spinner.text = `Scaffolding ${framework} with Vite...`;
  execSync(`${npmCmd} create vite@latest "${name}" -- --template ${framework}`, { stdio: 'ignore' });
  
  const originalDir = process.cwd();
  process.chdir(dir);

  spinner.text = 'Installing core dependencies...';
  execSync(`${npmCmd} install`, { stdio: 'ignore' });

  const folders = ['components', 'services', 'utils', 'hooks', 'assets'];
  for (const f of folders) await fs.ensureDir(path.join(dir, 'src', f));

  if (withTailwind) {
    spinner.text = 'Installing & Configuring Tailwind CSS (Manual Setup)...';
    execSync(`${npmCmd} install -D tailwindcss postcss autoprefixer`, { stdio: 'ignore' });

    const tailwindConfig = `/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx,vue}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}`;
    await fs.writeFile(path.join(dir, 'tailwind.config.js'), tailwindConfig);

    const postcssConfig = `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`;
    await fs.writeFile(path.join(dir, 'postcss.config.js'), postcssConfig);

    const cssPath = path.join(dir, 'src', 'index.css');
    const tailwindDirectives = `@tailwind base;\n@tailwind components;\n@tailwind utilities;\n\n`;
    
    let currentCss = "";
    if (await fs.pathExists(cssPath)) {
        currentCss = await fs.readFile(cssPath, 'utf-8');
    }
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
    spinner.text = 'Creating virtual environment...';
    execSync(`${pythonCmd} -m venv venv`, { stdio: 'ignore' });

    const venvPython = isWin 
      ? path.join(dir, 'venv', 'Scripts', 'python.exe') 
      : path.join(dir, 'venv', 'bin', 'python');

    spinner.text = 'Installing Django...';
    execSync(`"${venvPython}" -m pip install django`, { stdio: 'ignore' });

    spinner.text = 'Initializing Django project...';
    
    execSync(`"${venvPython}" -m django startproject config .`, { stdio: 'ignore' });

    spinner.text = `Creating app: ${appName}...`;
    execSync(`"${venvPython}" manage.py startapp ${appName}`, { stdio: 'ignore' });

    await fs.writeFile(path.join(dir, appName, 'urls.py'), 
      `from django.urls import path\nfrom . import views\n\nurlpatterns = [ path('', views.index, name='index'), ]`);
    
    await fs.writeFile(path.join(dir, appName, 'views.py'), 
      `from django.http import HttpResponse\n\ndef index(request):\n    return HttpResponse("<h1>${projectName} is live!</h1>")`);

  } finally {
    process.chdir(originalDir);
  }
}

async function initGit(dir, spinner) {
  try {
    spinner.text = 'Initializing Git...';
    const ignorePath = path.join(dir, '.gitignore');
    if (!(await fs.pathExists(ignorePath))) {
      const defaultIgnore = 'node_modules\n.env\ndist\nbuild\n__pycache__\n*.log\nvenv\n.venv\n';
      await fs.writeFile(ignorePath, defaultIgnore);
    }
    const originalDir = process.cwd();
    process.chdir(dir);
    execSync('git init', { stdio: 'ignore' });
    execSync('git add .', { stdio: 'ignore' });
    execSync('git commit -m "Initial commit by FlowDev 🚀"', { stdio: 'ignore' });
    process.chdir(originalDir);
  } catch (err) {
    spinner.warn(chalk.yellow('Git initialization skipped.'));
  }
}

async function setupAngular(dir, name, spinner) {
  spinner.text = 'Generating Angular Workspace...';
  
  execSync(`${npxCmd} --yes -p @angular/cli ng new "${name}" --defaults --skip-git`, { stdio: 'ignore' });
}

async function setupExpress(dir, name, spinner) {
  spinner.text = 'Setting up Express...';
  await fs.ensureDir(dir);
  const pkg = { name, version: '1.0.0', scripts: { start: 'node src/index.js' }, dependencies: { express: '^4.18.2', cors: '^2.8.5' }};
  await fs.writeJson(path.join(dir, 'package.json'), pkg, { spaces: 2 });
  await fs.ensureDir(path.join(dir, 'src'));
  await fs.writeFile(path.join(dir, 'src', 'index.js'), `const express = require('express');\nconst app = express();\napp.get('/', (req, res) => res.send('API OK'));\napp.listen(3000);`);
  process.chdir(dir);
  execSync(`${npmCmd} install`, { stdio: 'ignore' });
}

function showSuccessTips(data) {
  console.log(chalk.yellow('\n  Tips :'));
  console.log(`${chalk.white('*')} cd ${chalk.bold(data.projectName)}`);
  if (data.type.includes('tailwind')) {
    console.log(`${chalk.green('*')} Tailwind & PostCSS are manually configured.`);
    console.log(`${chalk.white('*')} Run: ${chalk.bold('npm run dev')}`);
  } else if (data.type === 'django') {
    console.log(`${chalk.white('*')} Run: ${chalk.bold('python manage.py runserver')}`);
  } else {
    console.log(`${chalk.white('*')} Run: ${chalk.bold('npm start')}`);
  }
}