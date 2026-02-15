import { execSync } from 'node:child_process';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { logger } from '../../utils/logger.js';
import { selectAIModel, ensureEngineReady, getAIResponse } from '../../utils/engine-check.js';

export async function commitCommand() {
  try {
    try {
      execSync('git rev-parse --is-inside-work-tree', { stdio: 'ignore' });
    } catch (e) {
      logger.error('Not a git repository. Please initialize git first.');
      return;
    }

    const diff = execSync('git diff --cached').toString();

    if (!diff) {
      console.log(chalk.yellow('\nNo changes staged. Please use "git add" before committing.'));
      return;
    }

    const provider = await selectAIModel();
    const spinner = ora(chalk.cyan('Analyzing staged changes...')).start();

    await ensureEngineReady(spinner, provider);

    const prompt = `Analyze this git diff and write a concise "Conventional Commit" message (feat, fix, docs, style, refactor, chore). 
    Return ONLY the message, no markdown, no quotes, no explanations.
    
    Diff:
    ${diff.substring(0, 8000)}`;

    const responseStream = await getAIResponse(provider, prompt);
    
    let suggestedMessage = "";
    for await (const part of responseStream) {
      suggestedMessage += part.message.content;
    }

    spinner.stop();
    suggestedMessage = suggestedMessage.trim();

    console.log(chalk.gray('\nProposed Commit Message:'));
    console.log(chalk.bold.green(`"${suggestedMessage}"\n`));

    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'Select an action for this commit:',
        choices: [
          { name: 'Commit this message', value: 'commit' },
          { name: 'Edit message manually', value: 'edit' },
          { name: 'Cancel operation', value: 'cancel' }
        ]
      }
    ]);

    if (action === 'cancel') {
      console.log(chalk.gray('Commit operation cancelled.'));
      return;
    }

    let finalMessage = suggestedMessage;
    if (action === 'edit') {
      const { edited } = await inquirer.prompt([{
        type: 'input',
        name: 'edited',
        message: 'Enter your commit message:',
        default: suggestedMessage
      }]);
      finalMessage = edited;
    }

    const safeMessage = finalMessage.replace(/"/g, '\\"');
    execSync(`git commit -m "${safeMessage}"`, { stdio: 'ignore' });
    
    console.log(chalk.green('Changes committed successfully.'));

    const { pushAction } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'pushAction',
        message: 'Do you want to push these changes to the remote repository?',
        default: false
      }
    ]);

    if (pushAction) {
      const pushSpinner = ora(chalk.cyan('Pushing to remote...')).start();
      try {

        execSync('git push', { stdio: 'pipe' });
        pushSpinner.succeed(chalk.green('Changes pushed to remote successfully.'));
      } catch (pushErr) {
        pushSpinner.fail(chalk.red('Push operation failed.'));
        const stderr = pushErr.stderr ? pushErr.stderr.toString() : pushErr.message;
        console.log(chalk.yellow(`\nGit output:\n${stderr.trim()}`));
      }
    }

  } catch (error) {
    const spinner = ora();
    if (spinner.isSpinning) spinner.stop();
    logger.error(`Commit error: ${error.message}`);
  }
}