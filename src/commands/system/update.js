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

import chalk from "chalk";
import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs-extra"; 
import ora from "ora";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function updateCommand() {
    const spinner = ora(chalk.cyan('Checking for updates...')).start();

    try {
        
        const packageJsonPath = path.resolve(__dirname, '../../../package.json');
        const pkg = await fs.readJson(packageJsonPath);

        const currentVersion = pkg.version;
        const packageName = pkg.name;
        
        let latestVersion;
        try {
            latestVersion = execSync(`npm view ${packageName} version`, { encoding: 'utf-8' }).trim();
        } catch (e) {
            spinner.warn(chalk.yellow('Could not reach the npm registry.'));
            return;
        }

        if (latestVersion === currentVersion) {
            spinner.succeed(chalk.green(`FlowDev is up to date! (v${currentVersion})`));
        } else {
            spinner.info(chalk.yellow(`A new version is available: ${latestVersion} (Current: ${currentVersion})`));
            
            const updateSpinner = ora(chalk.magenta('Updating FlowDev...')).start();
            try {
               
                execSync(`npm install -g ${packageName}@latest`, { stdio: 'ignore' });
                updateSpinner.succeed(chalk.green(`FlowDev has been updated to v${latestVersion}! ✨`));
            } catch (err) {
                updateSpinner.fail(chalk.red('Update failed. Try running with sudo: sudo npm install -g @flowdevcli/flowdev'));
            }
        }
    } catch (error) {
        spinner.fail(chalk.red('An error occurred while checking for updates.'));
        console.error(error);
    }
}