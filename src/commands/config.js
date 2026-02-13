/**
 * @fileoverview FlowDev  -  Intelligent CLI tool
 * @module flowdev
 * @version 1.0.5
 * * @license MIT
 * Copyright (c) 2026 FlowDev Technologies.
 * * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
 */

import inquirer from 'inquirer';
import chalk from 'chalk';
import { setDeepSeekKey, getDeepSeekKey, clearDeepSeekKey } from '../utils/config-manager.js';

export async function configCommand() {
  const currentKey = getDeepSeekKey();
  
  if (currentKey) {
    console.log(`DeepSeek API Key: ${chalk.green('Configured' + '•'.repeat(10))}`);
  } else {
    console.log(`DeepSeek API Key: ${chalk.red('Not configured')}`);
  }
  console.log('');

  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'What do you want to do?',
      choices: [
        { name: 'Configure/Update the DeepSeek key', value: 'set' },
        { name: 'Delete the existing key', value: 'delete' },
        { name: 'Leave', value: 'exit' }
      ]
    }
  ]);

  if (action === 'set') {
    const { key } = await inquirer.prompt([
      {
        type: 'password',
        name: 'key',
        message: 'Enter your DeepSeek API key (sk-...) :',
        mask: '*'
      }
    ]);
    if (key) {
      setDeepSeekKey(key.trim());
      console.log(chalk.green('\nKey saved successfully!'));
    }
  } else if (action === 'delete') {
    clearDeepSeekKey();
    console.log(chalk.yellow('\nKey deleted.'));
  }
}