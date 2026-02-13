import ollama from 'ollama';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { exec, spawn } from 'node:child_process';
import { promisify } from 'util';
import { logger } from '../utils/logger.js'; 
import { getDeepSeekKey } from '../utils/config-manager.js';

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

  if (spinner) spinner.stop();
  
  console.log(chalk.yellow('\n  Ollama engine is missing.'));
  console.log(chalk.dim('FlowDev requires Ollama to run local models without API keys.'));
  

  const { confirm } = await inquirer.prompt([{
      type: 'confirm',
      name: 'confirm',
      message: 'Do you want to install Ollama automatically now?',
      default: true
  }]);
  if (!confirm) throw new Error("Ollama installation aborted by user.");


  if (spinner) spinner.start(chalk.yellow("Installing local neural components... (Please wait)"));

  const installCmd = isWindows
    ? 'winget install Ollama.Ollama --silent --accept-source-agreements'
    : 'curl -fsSL https://ollama.com/install.sh | sh';

  try {
    await execAsync(installCmd, { maxBuffer: 10 * 1024 * 1024 });
    if (spinner) spinner.succeed(chalk.green('Local engine installed.'));
    await sleep(1500);
  } catch (error) {
    if (spinner) spinner.fail(chalk.red("Automatic installation failed."));
    logger.error(`Please install Ollama manually from https://ollama.com`);
    throw error;
  }
}

export async function ensureOllamaReady(spinner, modelName) {
  try {
    await execAsync('ollama --version');
  } catch (e) {
    await installOllamaEngine(spinner);
  }

  if (!(await waitForOllamaServer({ retries: 3, delayMs: 1000 }))) {
    if (spinner) spinner.text = chalk.blue('Starting local inference service...');
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
    if (spinner) spinner.text = chalk.magenta(`Acquiring the model ${modelName} (size: ~4GB)... This happens only once.`);
    await ollama.pull({ model: modelName });
    if (spinner) spinner.succeed(chalk.green('Local engine ready.'));
    if (spinner) spinner.start();
  }
}



async function* streamDeepSeek(messages) {
  const apiKey = getDeepSeekKey();
  
  if (!apiKey) {
      throw new Error("API Key missing. Please run 'flowdev config' to set it up.");
  }
  
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
    const errText = await response.text();
    if (response.status === 401) {
        throw new Error(`Invalid API Key. Please run 'flowdev config' to update it.`);
    } else if (response.status === 402) {
        throw new Error(`Insufficient Balance on DeepSeek account.`);
    }
    throw new Error(`DeepSeek API Error: ${response.status} - ${errText}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    buffer += decoder.decode(value, { stream: true });
    
    let boundary = buffer.indexOf('\n');
    while (boundary !== -1) {
        const line = buffer.slice(0, boundary).trim();
        buffer = buffer.slice(boundary + 1);
        
        if (line.startsWith("data: ")) {
            const jsonStr = line.slice(6);
            if (jsonStr === "[DONE]") continue;
            
            try {
                const json = JSON.parse(jsonStr);
                const content = json.choices[0]?.delta?.content;
                if (content) yield { message: { content: content } };
            } catch (e) {
                
            }
        }
        boundary = buffer.indexOf('\n');
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
            name: 'Llama 3 (Local - Private, Free, requires RAM)',
            value: 'llama3',
            short: 'Llama 3 (Local)'
          },
          {
            name: ` DeepSeek V3 (Cloud - Fast, requires Key)`,
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
    if (spinner) spinner.text = chalk.cyan('Checking local neural engine...');
    await ensureOllamaReady(spinner, 'llama3');
    
    if (spinner) spinner.text = chalk.magenta('Thinking (Local)...');
    return await ollama.chat({
      model: 'llama3',
      messages: messages,
      stream: true,
    });
  } 
  else if (provider === 'deepseek') {
    if (spinner) spinner.text = chalk.cyan('Handshaking with DeepSeek server...');
    
 
    try {
        await fetch('https://www.google.com', { method: 'HEAD', signal: AbortSignal.timeout(3000) });
    } catch (e) {
        throw new Error("No internet connection detected for Cloud AI.");
    }
    
    if (spinner) spinner.text = chalk.magenta('Thinking (Cloud)...');
    return streamDeepSeek(messages);
  }
}


export { ensureOllamaReady as ensureEngineReady };