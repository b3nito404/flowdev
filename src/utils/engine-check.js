import ollama from 'ollama';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { exec, spawn } from 'node:child_process';
import { promisify } from 'util';
import { logger } from './logger.js';
import { getDeepSeekKey } from './config-manager.js';

const execAsync = promisify(exec);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));


async function waitForOllamaServer({ retries = 15, delayMs = 1000 } = {}) {
  for (let i = 0; i < retries; i++) {
    try {
      await ollama.list();
      return true;
    } catch (e) {
      await sleep(delayMs);
    }
  }
  return false;
}

async function installOllamaEngine(spinner) {
  const isWindows = process.platform === 'win32';
  const installCmd = isWindows
    ? 'winget install Ollama.Ollama --silent --accept-source-agreements'
    : 'curl -fsSL https://ollama.com/install.sh | sh';

  spinner.text = chalk.yellow("Installing local neural components... (Please wait)");

  try {
    await execAsync(installCmd, { maxBuffer: 10 * 1024 * 1024 });
    spinner.succeed(chalk.green('Local engine installed.'));
    await sleep(1500);
  } catch (error) {
    spinner.fail(chalk.red("Automatic installation failed."));
    logger.error(`Please install Ollama manually.`);
    throw error;
  }
}

async function ensureOllamaReady(spinner, modelName) {
  try {
    await execAsync('ollama --version');
  } catch (e) {
    await installOllamaEngine(spinner);
  }

  if (!(await waitForOllamaServer({ retries: 3, delayMs: 1000 }))) {
    spinner.text = chalk.blue('Starting local inference service...');
    const child = spawn('ollama', ['serve'], { detached: true, stdio: 'ignore' });
    child.unref();

    const ready = await waitForOllamaServer({ retries: 30, delayMs: 1000 });
    if (!ready) throw new Error("The local server is not responding.");
  }

  let hasModel = false;
  try {
    const models = await ollama.list();
    hasModel = Array.isArray(models?.models) && models.models.some((m) => m.name?.startsWith(modelName));
  } catch (err) {}

  if (!hasModel) {
    spinner.text = chalk.magenta(`Acquiring the model ${modelName} (size: ~4GB)...`);
    await ollama.pull({ model: modelName });
    spinner.succeed(chalk.green('Local engine ready.'));
    spinner.start();
  }
}


async function* streamDeepSeek(messages) {
  const apiKey = getDeepSeekKey();
  
  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: messages,
      stream: true
    })
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`DeepSeek API Error: ${response.status} - ${err}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop(); 

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed === "data: [DONE]") continue;
      if (trimmed.startsWith("data: ")) {
        try {
          const json = JSON.parse(trimmed.replace("data: ", ""));
          const content = json.choices[0]?.delta?.content;
          if (content) yield { message: { content: content } };
        } catch (e) {}
      }
    }
  }
}


export async function getAIResponse(messages, spinner, forceModel = null) {
  if (spinner) spinner.stop();

  let provider = forceModel;

  if (!provider) {
    const hasKey = !!getDeepSeekKey();
    
    const answer = await inquirer.prompt([
      {
        type: 'list',
        name: 'provider',
        message: 'Select AI Model:',
        choices: [
          {
            name: ' Llama 3 (Local - Private, Free, requires download)',
            value: 'llama3',
            short: 'Llama 3 (Local)'
          },
          {
            name: `DeepSeek V3 (Cloud - Fast)`,
            value: 'deepseek',
            disabled: !hasKey ? 'run "flowdev config" first' : false,
            short: 'DeepSeek (Cloud)'
          }
        ]
      }
    ]);
    provider = answer.provider;
  }

  if (spinner) spinner.start();

  if (provider === 'llama3') {
    if (spinner) spinner.text = chalk.cyan('Local environment check...');
    await ensureOllamaReady(spinner, 'llama3');
    
    if (spinner) spinner.text = chalk.magenta('Thinking...');
    return await ollama.chat({
      model: 'llama3',
      messages: messages,
      stream: true,
    });
  } 
  else if (provider === 'deepseek') {
    if (spinner) spinner.text = chalk.cyan('Connecting to the DeepSeek remote server...');
    try {
        await fetch('https://www.google.com', { method: 'HEAD' });
    } catch (e) {
        throw new Error("An active internet connection is required to use DeepSeek.");
    }
    
    if (spinner) spinner.text = chalk.magenta('Analyzing...');
    return streamDeepSeek(messages);
  }
}

export { ensureOllamaReady as ensureEngineReady };