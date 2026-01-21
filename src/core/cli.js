import { program } from 'commander';
import { createRequire } from 'node:module';
import chalk from 'chalk';
import { statsCommand } from '../commands/utils/stats.js';
import { treeCommand } from '../commands/utils/tree.js';
import { dockerizeCommand } from '../commands/devops/dockerize.js';
import {findCommand} from '../commands/scaffold/find.js'


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
 
  return program;
}