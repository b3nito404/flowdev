import chalk from 'chalk';
import { generateTree } from '../../services/file-system.js';

export async function treeCommand() {
  console.log(chalk.bold.cyan('\nProject\' tree :'));
  console.log(chalk.cyan('.\n'));
  
  const tree = await generateTree(process.cwd());
  console.log(tree);
}