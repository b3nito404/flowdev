import ollama from 'ollama';
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs-extra';
import path from 'path';
import { logger } from '../../utils/logger.js';
import { ensureEngineReady } from '../../utils/engine-check.js'; 

export async function testCommand(fileRelativePath) {
  const spinner = ora(chalk.cyan(`Preparing test generation...`)).start();

  try {
    const filePath = path.resolve(process.cwd(), fileRelativePath);
    
    
    if (!(await fs.pathExists(filePath))) {
      spinner.fail(chalk.red(`File not found: ${fileRelativePath}`));
      return;
    }

    
    await ensureEngineReady(spinner, 'llama3');

    const content = await fs.readFile(filePath, 'utf-8');
    const ext = path.extname(filePath);
    const fileName = path.basename(filePath, ext);
    const dir = path.dirname(filePath);
    
    let framework = "Vitest";
    let testFileName = `${fileName}.test${ext}`;
    
    if (ext === '.py') {
      framework = "Pytest";
      testFileName = `test_${fileName}${ext}`;
    }

    spinner.text = chalk.magenta(`Writing ${framework} tests for ${fileName}...`);

    const prompt = `
      Analyze the following code and generate a complete test file using ${framework}.
      Requirements:
      - Include all necessary imports.
      - Cover the main functions with "happy path" and "edge cases" (extremes, nulls, errors).
      - Use descriptive test names.
      - Return ONLY the code block starting with \`\`\` and ending with \`\`\`.
      
      Code to test:
      ${content}
    `;

    const response = await ollama.chat({
      model: 'llama3',
      messages: [{ role: 'user', content: prompt }],
    });

    const fullResponse = response.message.content;
    
    const codeBlockRegex = /```[\w]*\n([\s\S]*?)```/;
    const match = fullResponse.match(codeBlockRegex);
    const testCode = match ? match[1] : fullResponse;

    const outputPath = path.join(dir, testFileName);
    await fs.writeFile(outputPath, testCode);

    (chalk.green(`Tests generated successfully!`));
    console.log(chalk.gray(`\n Location: `) + chalk.white(outputPath));
    console.log(chalk.yellow(` Tip: Run your tests with '${ext === '.py' ? 'pytest' : 'npm test'}'`));

  } catch (error) {
    (chalk.red('Test generation failed.'));
    logger.error(error.message);
  }
}