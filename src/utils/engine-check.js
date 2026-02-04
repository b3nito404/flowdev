import ollama from 'ollama';
import chalk from 'chalk';
import ora from 'ora';
import { exec, spawn } from 'node:child_process';
import { promisify } from 'util';
import { logger } from './logger.js';

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

  
  spinner.text = chalk.yellow("Installing FlowDev's engine package to run the command... (This may take a while)");

  try {
    await execAsync(installCmd, { maxBuffer: 10 * 1024 * 1024 });
    spinner.succeed(chalk.green('FlowDev Engine installed successfully!'));
    await sleep(1500);
  } catch (error) {
    spinner.fail(chalk.red('Automatic installation failed.'));
    logger.error(`Please install it manually: ${isWindows ? 'winget install Ollama.Ollama' : 'curl -fsSL https://ollama.com/install.sh | sh'}`);
    throw error;
  }
}

export async function ensureEngineReady(spinner, modelName = 'llama3') {
  
  try {
    await execAsync('ollama --version');  
  } catch (e) {
    await installOllamaEngine(spinner);
  }
  
  if (!(await waitForOllamaServer({ retries: 3, delayMs: 1000 }))) {
    spinner.text = chalk.blue('Starting engine in background...');
    const child = spawn('ollama', ['serve'], { detached: true, stdio: 'ignore' });
    child.unref();
    
    const ready = await waitForOllamaServer({ retries: 30, delayMs: 1000 });
    if (!ready) throw new Error('Engine server failed to start.');
  }
  let hasModel = false;
  try {
    const models = await ollama.list();
    hasModel = Array.isArray(models?.models) && models.models.some((m) => m.name?.startsWith(modelName));
  } catch (err) { }

  if (!hasModel) {
    spinner.text = chalk.magenta(`First launch: Downloading AI neurons (${modelName})...`);
    await ollama.pull({ model: modelName });
    spinner.succeed(chalk.green('AI brain loaded!'));
    spinner.start();
  }
}