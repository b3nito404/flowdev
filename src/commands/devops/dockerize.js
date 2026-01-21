import fs from 'fs-extra';
import path from 'node:path';
import inquirer from 'inquirer';
import ora from 'ora';
import chalk from 'chalk';
import { nodeDockerfile, pythonDockerfile, dockerCompose } from '../../templates/docker/templates.js';

export async function dockerizeCommand() {
  const cwd = process.cwd();
  const projectName = path.basename(cwd); 

  let detectedType = 'unknown';
  if (await fs.pathExists(path.join(cwd, 'package.json'))) detectedType = 'node';
  else if (await fs.pathExists(path.join(cwd, 'requirements.txt'))) detectedType = 'python';

  console.log(chalk.bold(`\n Dockerizing ${chalk.cyan(projectName)}`));
  if (detectedType !== 'unknown') {
    console.log(chalk.gray(`Detected type: ${detectedType.toUpperCase()}`));
  }

  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'type',
      message: 'What is your application type?',
      choices: ['Node.js', 'Python', 'Other'],
      default: detectedType === 'node' ? 'Node.js' : (detectedType === 'python' ? 'Python' : 'Other')
    },
    {
      type: 'input',
      name: 'port',
      message: 'Which port is your app listening on?',
      default: '3000',
      validate: (input) => !isNaN(input) || 'Please enter a number.'
    },
    {
      type: 'input',
      name: 'version',
      message: 'Which language version (Docker tag)?',
      default: (answers) => answers.type === 'Node.js' ? '18' : '3.11'
    },
   
    {
      type: 'input',
      name: 'startCommand',
      message: 'Start command (e.g., npm run dev):',
      default: 'npm start',
      when: (answers) => answers.type === 'Node.js'
    },
    
    {
      type: 'input',
      name: 'startFile',
      message: 'Main entry file (e.g., app.py, main.py):',
      default: 'app.py',
      when: (answers) => answers.type === 'Python'
    }
  ]);

  const spinner = ora('Generating containers...').start();

  try {
    let dockerfileContent = '';

    
    if (answers.type === 'Node.js') {
      dockerfileContent = nodeDockerfile(answers.version, answers.port, answers.startCommand);
    } else if (answers.type === 'Python') {
      dockerfileContent = pythonDockerfile(answers.version, answers.port, answers.startFile);
    } else {
      dockerfileContent = '# Generic template\nFROM alpine:latest\nCMD ["echo", "Hello World"]';
    }

    await fs.writeFile(path.join(cwd, 'Dockerfile'), dockerfileContent.trim());
    const composeContent = dockerCompose(projectName.toLowerCase().replace(/[^a-z0-9]/g, '-'), answers.port);
    await fs.writeFile(path.join(cwd, 'docker-compose.yml'), composeContent.trim());
    
    const ignoreContent = 'node_modules\n.git\n.env\ndist\nbuild\n__pycache__\n*.log';
    await fs.writeFile(path.join(cwd, '.dockerignore'), ignoreContent);

    spinner.succeed(chalk.green('Dockerfiles generated successfully!'));
    
    console.log('\nTo start your project:');
    console.log(chalk.blue(`  docker-compose up --build`));

  } catch (error) {
    spinner.fail(chalk.red('Error during generation.'));
    console.error(error);
  }
}