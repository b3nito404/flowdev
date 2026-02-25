# FlowDev

> **Build. Orchestrate. Audit. Ship.**  
> FlowDev is an intelligent enterprise-grade CLI designed to generate full-stack architectures, automate DevOps foundations, and provide real-time project intelligence — all from a single command interface.

---

## New Major Release Highlights

### Full Architecture Generation Engine

`flowdev generate` now creates **complete production-ready architectures** in minutes.

Not just scaffolding — but:
- Frontend, Backend, or Monorepo structures
- Automatic Git initialization
- Intelligent Dockerfile generation
- CI/CD-ready foundations
- Stack-aware runtime commands
- Optional DevOps Enterprise Pack

From zero to a fully operational stack — with infrastructure included.

---

### Live GitHub Project Dashboard

`flowdev insight` connects directly to your repository and provides a **real-time operational dashboard**:

- Open Pull Requests
- Repository activity
- Docker environment status
- CI/CD signals
- Development visibility at a glance

Your command line becomes a control center.

---

## Why FlowDev

Modern engineering teams need velocity without compromising architecture integrity.  
FlowDev is designed for:

- Engineering teams scaling products
- DevOps-oriented developers
- Startups building MVPs with production standards
- Enterprises requiring reproducible infrastructure

FlowDev bridges **development, DevOps, and intelligence** into a single unified CLI experience.

---

## Installation

```bash
npm install -g flowdev
```

Or run instantly:
```bash
npx flowdev --help
```
Quick Start

Generate a Full Architecture
```bash
flowdev generate
```

You will be guided through:

Architecture type (Frontend / Backend / Monorepo)

- Stack selection
- Project naming
- Enterprise DevOps activation
- Supported stacks include:
- Next.js (TypeScript, Tailwind, ESLint preconfigured)
- React (Vite + TS)
- Vue (Vite + TS)
- NestJS
- Express
- FastAPI
- Django
- Go Microservices (std / Gin / Fiber)
- Turborepo Monorepos

FlowDev automatically verifies system prerequisites and can assist with installation if missing.

When complete:
```bash
cd your-project && npm run dev
```
Or the appropriate runtime command for your stack; Flowdev might give you the right one .

Enterprise DevOps Pack

When enabled during generation:

- Dockerfile tailored to the selected stack
- Environment-aware configuration
- Git initialization with sensible defaults
- Production-aligned base structure
- Infrastructure is no longer an afterthought.

Live Project monitoring
```bash
flowdev insight
```
Connect to your GitHub repository and instantly access:

- Pull request visibility
- Repository metrics
- Activity overview
- Docker environment signals

Designed for teams who require operational awareness without leaving the terminal.

Core Commands:
```bash
flowdev tree
flowdev dockerize
flowdev env
flowdev audit "path-to-file"
flowdev test "path-to-file"
flowdev readme
flowdev stats
flowdev kube
flowdev config
flowdev update
```

Selected Highlights

- dockerize — Generate Dockerfile and docker-compose automatically
- env — Scan codebase and generate .env.example
- audit "path-to-file" — AI-powered code quality and security analysis
- test "path-to-file" — Generate unit tests automatically
- kube — Generate Kubernetes deployment and service manifests
- stats — Project code metrics and structural analysis
- config — Manage flowdev github tokens configurations

Architecture-Aware Generation

FlowDev does not merely scaffold — it understands your stack.

Examples:

- Go projects initialize go mod, structure cmd/api, and optionally install Gin or Fiber.
- Django projects configure apps, update INSTALLED_APPS, generate routes, and run migrations.
- FastAPI environments create virtual environments and production-ready entry points.
- Monorepos leverage Turbo for scalable multi-package systems.
- Node-based stacks receive optimized Docker configurations.

Every generation step is tracked with a progress engine and resilient error handling.

Professional-Grade Output
Example:
```bash
Project "my-app" successfully created !
Stack: next | DevOps: true

Run: cd my-app && npm run dev
```

Clear. Deterministic. Production-aligned.

Designed for Scale

FlowDev is suitable for:

- Internal tooling teams
- Platform engineering
- DevOps-first organizations
- Product teams requiring rapid environment spin-up
- Enterprise CI/CD ecosystems

It reduces setup time, standardizes environments, and enforces architectural discipline from day one.