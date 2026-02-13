FLOWDEV
=======
The intelligent CLI for modern workflow automation.

FlowDev is a privacy-first, offline-capable CLI tool designed to accelerate developer workflows. From scaffolding Docker environments to generating project structures using local or cloud AI, FlowDev keeps you in the flow without leaving your terminal.

> "The developer tool for the next generation."

[![npm version](https://img.shields.io/npm/v/flowdev.svg?style=flat-square)](https://www.npmjs.com/package/flowdev)
[![install size](https://img.shields.io/badge/install%20size-unknown-blue?style=flat-square)](https://packagephobia.com/result?p=flowdev)
[![downloads](https://img.shields.io/npm/dm/flowdev.svg?style=flat-square)](https://www.npmjs.com/package/flowdev)

Install
=======

Global Installation (Recommended)
---------------------------------
To use FlowDev commands anywhere on your system:

```bash
npm install -g flowdev

Local Installation

If you prefer to use it per project:
Bash

npm install flowdev --save-dev

Usage

Once installed, FlowDev exposes the flowdev binary.

    Check your installation:

Bash
flowdev --version

    *Configure your environment (API keys & Models):
Bash
flowdev config


    *Analyze your current project:
Bash
flowdev stats

    *Generate a Docker environment:
Bash
flowdev dockerize

Features
AI & Automation (Hybrid Engine)

FlowDev integrates with Ollama for offline capabilities and supports DeepSeek for high-performance cloud reasoning.

1. Smart Assistant
Ask questions about code or architecture using local or cloud models.
Bash

flowdev ask "How do I optimize a React useEffect hook?"

2. Intelligent Audit
Audit your code for bugs, security, and performance using AI.
Bash

flowdev audit

3. Automatic Documentation
Generate a professional README.md for your project instantly.
Bash

flowdev readme

DevOps & Infrastructure

1. Dockerize
Instantly generate production-ready Dockerfile and docker-compose.yml files.
Bash

flowdev dockerize

2. Kubernetes (Kube)
Generate Kubernetes deployment and service manifests for your application.
Bash

flowdev kube

Utilities

1. Generate
Generate a complete project (React, Django, Vue, Angular, Express) with Git and dependencies automatically configured.
Bash

flowdev generate

2. Find (Pattern Search)
A recursive search tool optimized for developers. Ignores node_modules and binaries.
Bash

flowdev find "TODO" --ext js,ts

3. Stats
Get an instant breakdown of your project's size, file count, and language distribution.
Bash

flowdev stats

Requirements
Node.js

FlowDev requires Node.js v18+.
Local AI (Optional)

To use local AI features, you must have Ollama running locally.

    Install Ollama: ollama.com

    Start the service: ollama serve

    FlowDev handles the rest.

Cloud AI (Optional)

To use Cloud features (DeepSeek), configure your API key via flowdev config.
Documentation
flowdev generate

Provisions full-stack templates. Includes a fail-safe execution wrapper that generates a flowdev-debug.log if an installation fails.
flowdev audit

Uses AI to scan for security vulnerabilities and logic flaws. Perfect for pre-commit checks.
flowdev dockerize

Generates optimized configurations using multi-stage builds and non-root security practices.
flowdev env

Scans your project code and generates a .env.example file based on your environment variable usage.
FAQ
Does FlowDev send my code to the cloud?

By default, No. Local AI processing happens on your machine via Ollama. Cloud processing is only used if you explicitly configure it and choose a cloud model.
Do I need an API Key?

No for local use. Yes if you wish to use cloud models like DeepSeek.
Why "flowdev"?

Because switching contexts breaks your flow. FlowDev keeps you in the terminal, automating the boring stuff so you can focus on the code.
Changelog

See CHANGELOG.md for details on recent updates.
License

[MIT](https://www.google.com/search?q=LICENSE)



