import ora from 'ora';
import chalk from 'chalk';
import { analyzeProject } from '../../services/analyzer.js';


export async function statsCommand() {
  const spinner = ora('Analysis of the ongoing project...').start();
  const start = Date.now();

  try {
    const stats = await analyzeProject();
    const duration = Date.now() - start;

    spinner.succeed(chalk.green(`Analysis completed in ${duration}ms !`));
    console.log('\n' + chalk.bold.underline('Analysis results :'));
    
   
    console.table(stats.languages);

    console.log(`\nFiles analyzed : ${chalk.cyan(stats.totalFiles)}`);
    console.log(` Total rows  : ${chalk.cyan(stats.totalLines)}`);
  } catch (error) {
    spinner.fail(chalk.red('Analysis failed.'));
    console.error(error.message);
  }
}