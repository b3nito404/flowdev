
import os from 'os';
import path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs-extra';
import { logger } from '../../utils/logger.js';
import { getAIResponse } from '../../utils/engine-check.js';


const HISTORY_FILE = path.join(os.homedir(), '.flowdev', 'chat_history.json');
const MAX_HISTORY  = 10; 

export async function askCommand(question, options = {}) {
  if (!question) {
    logger.error('Ask me a question!');
    return;
  }
  if (question.toLowerCase() === 'clear' || options.clear) {
    if (await fs.pathExists(HISTORY_FILE)) {
      await fs.remove(HISTORY_FILE);
    }
    console.log(chalk.green('Memory cleared. We can start a new topic!'));
    if (question.toLowerCase() === 'clear') return; 
  }

  const spinner = ora(chalk.cyan('Initialization...')).start();

  try {
    
    await fs.ensureDir(path.dirname(HISTORY_FILE));
    let systemContext = 'You are FlowDev, an intelligent CLI assistant specialized in software development.';
    try {
      if (await fs.pathExists('package.json')) {
        const pkg = await fs.readJson('package.json');
        if (pkg?.name) systemContext += ` CURRENT CONTEXT: User is in project "${pkg.name}".`;
      }
    } catch {}

    let messages = [];
    if (await fs.pathExists(HISTORY_FILE)) {
      messages = await fs.readJson(HISTORY_FILE);
      
      if (messages[0]?.role === 'system') {
        messages[0].content = systemContext;
      }
    } else {
      messages = [{ role: 'system', content: systemContext }];
    }

    messages.push({ role: 'user', content: question });

    if (messages.length > MAX_HISTORY * 2 + 1) {
      messages = [messages[0], ...messages.slice(-(MAX_HISTORY * 2))];
    }

    const responseStream = await getAIResponse(messages, spinner);

    spinner.stop();
    console.log(chalk.bold.magenta('\nFlowDev:'));

    let fullAssistantResponse = '';
    for await (const part of responseStream) {
      const content = part?.message?.content;
      if (typeof content === 'string') {
        process.stdout.write(chalk.white(content));
        fullAssistantResponse += content; 
      }
    }

    process.stdout.write('\n');

    messages.push({ role: 'assistant', content: fullAssistantResponse });
    await fs.writeJson(HISTORY_FILE, messages, { spaces: 2 });

  } catch (error) {
    spinner.stop();
    logger.error('Error: ' + error.message);
  }
}