import { program } from 'commander';
import { createRequire } from 'node:module';
import chalk from 'chalk';
import { statsCommand } from '../commands/utils/stats.js';
import { treeCommand } from '../commands/utils/tree.js';
import { dockerizeCommand } from '../commands/devops/dockerize.js';
import {findCommand} from '../commands/scaffold/find.js'
import { askCommand } from '../commands/ai/ask.js';
import { explainCommand } from '../commands/ai/explain.js';
import { envCommand } from '../commands/devops/env.js';
import { kubeCommand } from '../commands/devops/kube.js';
import { generateCommand } from '../commands/scaffold/generate.js';
import { auditCommand } from '../commands/ai/audit.js';
import { testCommand } from '../commands/ai/test.js';


const require = createRequire(import.meta.url);
const pkg = require('../../package.json');

export function setupCLI() {
  program
    .name('flowdev')
    .description('Intelligent CLI to automate your workflow')
    .version(pkg.version, '-v, --version', 'output the current version');


  program
    .command('version')
    .description('Display the current version of FlowDev')
    .action(() => {
      console.log(`\n ${chalk.bold('FLOWDEV')} ${chalk.cyan('v' + pkg.version)}`);
    });

  program
  .command('tree')
  .description('Displays the project tree')
  .action(treeCommand);

  
  program.on('command:*', () => {
    console.error('Invalid command. Type "flowdev --help" to see the list.');
    process.exit(1);
  });

  program
  .command('dockerize')
  .description('Automatically generates Dockerfile and docker-compose.yml')
  .action(dockerizeCommand);

   program
    .command('stats')
    .description('Analyzes the current project and displays code statistics')
    .action(async () => {
      await statsCommand();
    });


  program
  .command('find <pattern>')
  .description('Search for a text in the project')
  .option('-e, --ext <extensions>', ' Filter by extensions(ex: js,md,json)')
  .action((pattern, options) => findCommand(pattern, options));

  program
  .command('ask <question...>')
  .description('Ask a question to the local AI ')
  .action((args) => {
    const question = args.join('');
    askCommand(question)
  });

  program
  .command('explain <file>')
  .description('Analyzes and explains the contents of a source file')
  .action(async (file) => {
    await explainCommand(file);
  })

  program 
  .command('env')
  .description('Scans project code and generates a .env.example file')
  .action(async () => {
    await envCommand();
  });

  program
  .command('kube')
  .description('Generate Kubernetes deployment and service manifests')
  .action(async () => {
    await kubeCommand();
  });

  program
  .command('generate')
  .description('Generates a complete project (React, Django, Vue, etc...) with Git and dependencies')
  .action(generateCommand);

  program
  .command('audit')
  .description('Audit your code for bugs, security, and performance with AI')
  .action(async () => {
    await auditCommand();
  });

  program
  .command('test <file>') 
  .description('Automatically generates unit tests for a specific file')
  .action(async (file) => {
    await testCommand(file);
  });

  return program;
}