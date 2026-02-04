import ollama from 'ollama';
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs-extra';
import { exec, spawn } from 'node:child_process';
import { promisify } from 'util';
import { logger } from '../../utils/logger.js';

const execAsync = promisify(exec);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));


async function waitForOllamaServer({ retries = 15, delayMs = 1000 } = {}) {
  for (let i = 0; i < retries; i++) {
    try {
      await ollama.list();
      return true;
    } catch (e) {
      
      logger.debug(`Ollama not ready (attempt ${i + 1}/${retries}): ${e.message}`);
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

  spinner.text = chalk.yellow('Downloading FlowDev engine package... (This may take a while)');

  try {
    
    const { stdout, stderr } = await execAsync(installCmd, { maxBuffer: 10 * 1024 * 1024 });
    logger.debug('install stdout: ' + (stdout || '').toString().slice(0, 2000));
    logger.debug('install stderr: ' + (stderr || '').toString().slice(0, 2000));

    spinner.succeed(chalk.green('FlowDev Engine installed successfully!'));
    
    await sleep(1500);
  } catch (error) {
    
    spinner.fail(chalk.red('Automatic installation failed (admin rights or network?)'));
    logger.error('Automatic installation error: ' + (error.message || error));
    if (error.stdout || error.stderr) {
      logger.error('Installer output (truncated):');
      logger.error((error.stdout || '').toString().slice(0, 500));
      logger.error((error.stderr || '').toString().slice(0, 500));
    }

    logger.error(`Try installing it manually: ${isWindows ? 'winget install Ollama.Ollama' : 'curl -fsSL https://ollama.com/install.sh | sh'}`);
    throw error;
  }
}

async function ensureOllamaRunning(spinner) {
  try {
   
    await execAsync('ollama --version');
  } catch (e) {
    logger.info('Ollama binary not found. Attempting automatic install...');
    
    await installOllamaEngine(spinner);
  }

  
  if (await waitForOllamaServer({ retries: 3, delayMs: 1000 })) {
    return;
  }

  
  logger.info('Starting ollama serve in background...');
  try {
    
    const child = spawn('ollama', ['serve'], { detached: true, stdio: 'ignore' });
    child.unref();
  } catch (spawnErr) {
    logger.error('Failed to spawn ollama serve: ' + spawnErr.message);
    throw spawnErr;
  }

  
  const ready = await waitForOllamaServer({ retries: 30, delayMs: 1000 });
  if (!ready) {
    throw new Error('Ollama server did not start in time. Check logs or run `ollama serve` manually.');
  }
}

export async function askCommand(question) {
  if (!question) {
    logger.error('Ask me a question!');
    return;
  }

  let spinner = ora(chalk.cyan('Initialization...')).start();

  try {
    await ensureOllamaRunning(spinner);

  
    const modelName = process.env.OLLAMA_MODEL || 'llama3';

    let hasModel = false;
    try {
      const models = await ollama.list();
      hasModel = Array.isArray(models?.models) && models.models.some((m) => m.name?.startsWith(modelName));
    } catch (err) {
      logger.debug('Error listing models: ' + (err?.message || err));
   
    }

    if (!hasModel) {
      spinner.text = chalk.magenta('First launch: Configuring neurons...');
      spinner.start();

      try {
        await ollama.pull({ model: modelName });
        spinner.succeed(chalk.green('AI brain in charge !'));
      } catch (pullErr) {
        spinner.fail(chalk.red('Failed to download model.'));
        logger.error('ollama.pull error: ' + (pullErr?.message || pullErr));
        throw pullErr;
      }

      
      spinner = ora(chalk.cyan('Thinking...')).start();
    } else {
      spinner.text = chalk.cyan('Thinking...');
    }

    
    let context = 'flowdev intelligent CLI tool';
    try {
      if (await fs.pathExists('package.json')) {
        const pkg = await fs.readJson('package.json');
        if (pkg?.name) context += ` CURRENT CONTEXT: The user is in the project folder "${pkg.name}".`;
      }
    } catch (e) {
      logger.debug('Failed to read package.json: ' + (e?.message || e));
    }

    const response = await ollama.chat({
      model: modelName,
      messages: [
        { role: 'system', content: context },
        { role: 'user', content: question },
      ],
      stream: true,
    });

    
    spinner.stop();

    for await (const part of response) {
      const content = part?.message?.content;
      if (typeof content === 'string') {
        process.stdout.write(chalk.white(content));
      }
    }

    process.stdout.write('\n');
  } catch (error) {
    
    try { spinner.stop(); } catch (_) {}

    logger.error('askCommand error: ' + (error?.message || error));

    if (error?.code === 'ENOENT') {
      console.log(chalk.red('\nUnable to find or install Ollama automatically.'));
    } else {
      console.log(chalk.red(`\nError: ${error?.message || error}`));
    }
  }
}
