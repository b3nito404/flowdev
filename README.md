# FLOWDEV

**FlowDev — The Intelligent CLI for Modern Workflow Automation**

FlowDev is a privacy-first, hybrid AI-powered Command Line Interface designed to accelerate and automate modern developer workflows. From infrastructure scaffolding to AI-assisted audits and documentation generation, FlowDev keeps developers productive without leaving the terminal.

> “Automation without context switching.”

Published on npm. Designed for professional environments and production-grade workflows.

---

## Badges

[![npm version](https://img.shields.io/npm/v/flowdev.svg?style=flat-square)](https://www.npmjs.com/package/flowdev)  
[![weekly downloads](https://img.shields.io/npm/dw/flowdev.svg?style=flat-square)](https://www.npmjs.com/package/flowdev)  
[![license](https://img.shields.io/badge/license-MIT-green?style=flat-square)](./LICENSE)  
[![node version](https://img.shields.io/badge/node-%3E%3D18-blue?style=flat-square)](https://nodejs.org)

---

## Table of Contents

- Overview
- Installation
- Core Commands
- AI Capabilities
- DevOps Utilities
- Project Scaffolding
- Feature Comparison
- Requirements
- AI Configuration (Local & Cloud)
- Versioning & Known Issues
- Maintainer Workflow
- Contributing
- License

---

## Overview

FlowDev provides:

• AI-assisted development  
• Automated Docker and Kubernetes configuration  
• Intelligent project analysis  
• AI-generated documentation  
• Hybrid local/cloud processing architecture  
• CI-ready deterministic outputs  

It is built for developers and teams who value speed, clarity, reproducibility, and terminal-native workflows.

FlowDev integrates with local AI runtimes such as Ollama and optionally supports cloud-based reasoning providers. Cloud usage is strictly opt-in.

---

## Installation

### Global Installation (Recommended)

```bash
npm install -g flowdev
```

### Local Installation (Per Project)

```bash
npm install --save-dev flowdev
```

### Verify Installation

```bash
flowdev --version
```

---

## Core Commands

### Display Version

```bash
flowdev version
```

---

### Project Tree Visualization

```bash
flowdev tree
```

---

### Project Statistics Analysis

```bash
flowdev stats
```

---

### Pattern Search (Recursive, Developer-Optimized)

```bash
flowdev find "TODO" --ext js,ts
```

---

## AI Capabilities

### Ask AI a Technical Question

```bash
flowdev ask "How can I optimize a React useEffect hook?"
```

---

### Explain a Source File

```bash
flowdev explain src/app.js
```

---

### Audit Code (Security, Performance, Logic)

```bash
flowdev audit
```

---

### Generate Unit Tests for a File

```bash
flowdev test src/app.js
```

---

### Generate README Automatically

```bash
flowdev readme
```

---

### AI-Powered Commit Message

```bash
flowdev commit
```

---

## DevOps Utilities

### Generate Docker Configuration

```bash
flowdev dockerize
```

Automatically creates:

• Production-ready Dockerfile  
• docker-compose.yml  
• Multi-stage builds  
• Non-root security practices  

---

### Generate Kubernetes Manifests

```bash
flowdev kube
```

Creates deployment and service configuration files.

---

### Generate Environment Template

```bash
flowdev env
```

Scans your codebase and generates a `.env.example` file.

---

## Project Scaffolding

### Generate a Full Project

```bash
flowdev generate
```

Supports scaffolding for:

• React  
• Django  
• Vue  
• Angular  
• Express  

Includes Git initialization and dependency installation.

---

## Feature Comparison

| Capability                          | FlowDev | Custom Scripts | Generic CLI Tools |
|-------------------------------------|:-------:|:--------------:|:-----------------:|
| Terminal-first design               | Yes     | Partial        | Partial           |
| Local AI (offline support)          | Yes     | No             | No                |
| AI code auditing                    | Yes     | No             | Limited           |
| Docker + Kubernetes generation      | Yes     | Partial        | Varies            |
| Automatic README generation         | Yes     | No             | Limited           |
| Environment template generation     | Yes     | No             | No                |
| CI-compatible structured output     | Yes     | Varies         | Varies            |

---

## Requirements

• Node.js v18 or higher  
• Optional: Local AI via Ollama  
• Optional: Cloud AI API key  

---

## AI Configuration

### Local AI (Offline Mode)

To enable local AI features:

1. Install Ollama
2. Start the service:

```bash
ollama serve
```

FlowDev will automatically detect and use the local runtime.

---

### Cloud AI

To enable cloud-based reasoning:

```bash
flowdev config
```

Add your API key and select your preferred model.

Cloud usage is strictly opt-in and fully configurable.

---

## Versioning & Known Issues

### Current Stable Version

Use version:

```bash
>= 1.1.2
```

### Important Notice

Versions **1.0.5 through 1.1.1** contained critical regressions and should not be used in production environments.

If you are using one of these versions, upgrade immediately:

```bash
npm install -g flowdev@latest
```

---

## Maintainer Workflow

### Publishing a New Version

After modifying code or documentation:

```bash
npm version patch
npm publish
```

### Deprecating Faulty Versions

To deprecate a specific version:

```bash
npm deprecate flowdev@1.0.7 "Critical bug — upgrade to >= 1.1.2"
```

To deprecate multiple versions:

```bash
for v in 1.0.5 1.0.6 1.0.7 1.0.8 1.0.9 1.0.10 1.1.0 1.1.1; do
  npm deprecate flowdev@$v "Critical bugs — upgrade to >= 1.1.2"
done
```

To verify deprecation:

```bash
npm view flowdev@1.0.5 deprecated
```

---

## Contributing

1. Fork the repository  
2. Create a feature branch  
3. Submit a Pull Request with clear technical description  
4. Follow semantic versioning principles  

Major architectural changes should begin with a proposal issue before implementation.

---

## Philosophy

FlowDev exists to reduce friction in modern development.

Automation should enhance engineering judgment, not replace it.  
Tooling should remain transparent, reproducible, and privacy-aware.  
The terminal remains the most powerful development interface.

---

## License

MIT License

© 2026 FlowDev Technologies
