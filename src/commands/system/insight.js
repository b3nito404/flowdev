
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
import { Octokit } from "@octokit/rest";
import chalk from "chalk";
import { execSync } from "node:child_process";
import Docker from "dockerode";
import { ConfigManager } from "../../utils/config-manager.js";

const docker = new Docker();
function clearScreen() {
  process.stdout.write('\x1Bc');
}

export const insightCommand = async () => {
  const config = ConfigManager.get();

  if (!config.github_token) {
    console.log(chalk.bold.red("Configuration error"));
  if (!config.github_token) {
    console.log(chalk.bold.red("\nMissing github authentification"));
    console.log(chalk.white("To access Pull Requests and Team activity, you must provide a PAT(Personal Access Token)."));
    console.log("\n" + chalk.bold("Step-by-step setup:"));
    console.log(` 1. Visit: ${chalk.cyan("https://github.com/settings/tokens")}`);
    console.log(` 2. Click: ${chalk.yellow("'Generate new token'")}, then select ${chalk.yellow("'Generate new token (classic)'")}.`);
    console.log(" 3. Scopes: Select the following checkboxes:");
    console.log(`    - [${chalk.green("X")}] ${chalk.bold("repo")} (Full control of private repositories)`);
    console.log(`    - [${chalk.green("X")}] ${chalk.bold("read:org")} (Under 'admin:org' section)`);
    console.log(" 4. Copy the generated token (it starts with 'ghp_').");
    console.log(` 5. Run: ${chalk.bold.green('flowdev config set github_token YOUR_TOKEN_HERE')}`);
    console.log(chalk.italic.white("This token is stored locally in your home directory.\n"));
    return;
  }
    return;
  }

  const octokit = new Octokit({ auth: config.github_token });
  
  let owner, repo;
  try {
    const remote = execSync("git remote get-url origin", { stdio: 'pipe' }).toString().trim();
    const parts = remote.replace(".git", "").split(/[:/]/);
    repo = parts.pop();
    owner = parts.pop();
  } catch (e) {
    console.log(chalk.red("ERROR: No remote 'origin' detected for this repository."));
    return;
  }

  const render = async () => {
    clearScreen();
    const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
    
    console.log(chalk.bold.bgWhite.black(` Flowdev insight | Project: ${owner}/${repo} | Last update: ${timestamp} `));
    console.log(chalk.gray("Press Ctrl+C to exit monitoring mode\n"));

    try {
      console.log(chalk.bold.blue("Local git graph"));
      try {
        const gitLog = execSync(
          `git log --graph --abbrev-commit --decorate --format=format:'%h - (%ar) %s - %an%d' --all -n 10`,
          { stdio: 'pipe' }
        ).toString();
        console.log(gitLog);
      } catch (err) {
        console.log(chalk.yellow("No git history found or directory not initialized."));
      }


      console.log(chalk.bold.blue("\nGithub activities (team & PRs)"));
      const [pulls, collaborators] = await Promise.all([
        octokit.pulls.list({ owner, repo, state: "open", per_page: 5 }),
        octokit.repos.listCollaborators({ owner, repo }).catch(() => ({ data: [] }))
      ]);

      const collabsList = collaborators.data.map(c => c.login).join(', ');
      console.log(`${chalk.white("Collaborators:")} ${collabsList || "No external collaborators found"}`);
      
      if (pulls.data.length > 0) {
        pulls.data.forEach(pr => {
          console.log(`[PR #${pr.number}] ${pr.title} (Author: ${pr.user.login})`);
        });
      } else {
        console.log(chalk.gray("No open Pull Requests at the moment."));
      }

      // 3. INFRASTRUCTURE (DOCKER)
      console.log(chalk.bold.blue("\n Live infrastructure (docker)"));
      try {
        const containers = await docker.listContainers();
        if (containers.length > 0) {
          containers.forEach(c => {
            const status = c.State === 'running' ? chalk.green("[ACTIVE]") : chalk.red("[STOPPED]");
            console.log(`${status} ${c.Names[0].replace('/', '').padEnd(20)} | Image: ${c.Image}`);
          });
        } else {
          console.log(chalk.gray("No active containers detected."));
        }
      } catch (e) {
        console.log(chalk.red("Docker daemon is unreachable or not installed."));
      }

    } catch (error) {
      console.log(chalk.red("Sync Error:"), error.message);
    }
  };

  await render();

  const refreshInterval = setInterval(async () => {
    await render();
  }, 30000);

  
  process.on('SIGINT', () => {
    clearInterval(refreshInterval);
    console.log(chalk.yellow("\ninsight disconnected."));
    process.exit();
  });
};