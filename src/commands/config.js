
/**
 * @fileoverview FlowDev  -  Intelligent CLI tool
 * @module flowdev
 * @version 1.2.0
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
import chalk from 'chalk';
import { ConfigManager } from '../utils/config-manager.js';

export const configCommand = (args) => {
  const action = args[0];

  if (action === 'set') {
    const key = args[1];
    const value = args[2];
    if (!key || !value) {
      console.log(chalk.red('ERROR: Missing parameters for SET.'));
      console.log(chalk.gray(`Example: ${chalk.cyan('flowdev config set github_token <your_token>')}`));
      return;
    }
    ConfigManager.set(key, value);
    console.log(chalk.green(`SUCCESS: ${key} has been updated.`));
    return;
  }

  if (action === 'get') {
    const key = args[1];
    if (!key) {
      console.log(chalk.red('ERROR: Missing key for GET.'));
      console.log(chalk.gray(`Example: ${chalk.cyan('flowdev config get github_token')}`));
      return;
    }
    const config = ConfigManager.get();
    const value = config[key];
    
    if (value) {
      const displayValue = key.includes('token') ? `${value.substring(0, 4)}****` : value;
      console.log(`${chalk.white(key)}: ${chalk.yellow(displayValue)}`);
    } else {
      console.log(chalk.red(`ERROR: Key '${key}' is not set.`));
    }
    return;
  }


  if (action === 'delete' || action === 'remove') {
    const key = args[1];
    if (!key) {
      console.log(chalk.red('ERROR: Missing key for DELETE.'));
      console.log(chalk.gray(`Example: ${chalk.cyan('flowdev config delete github_token')}`));
      return;
    }
    
    const config = ConfigManager.get();
    if (config[key]) {
      ConfigManager.remove(key);
      console.log(chalk.green(`SUCCESS: Key '${key}' has been removed.`));
    } else {
      console.log(chalk.yellow(`WARNING: Key '${key}' does not exist.`));
    }
    return;
  }

  const config = ConfigManager.get();
  console.log(chalk.bold.blue('\nFlowdev current configuration'));
  
  const entries = Object.entries(config);
  if (entries.length === 0) {
    console.log(chalk.gray('Configuration is empty.'));
    console.log(chalk.gray(`Hint: Use ${chalk.cyan('flowdev config set <key> <value>')} to add settings.`));
  } else {
    entries.forEach(([k, v]) => {
      const displayValue = k.includes('token') ? `${v.substring(0, 4)}****` : v;
      console.log(`${chalk.white(k)}: ${chalk.yellow(displayValue)}`);
    });
  }
  console.log("");
};