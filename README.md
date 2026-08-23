# JARVIS

JARVIS is a modular desktop-first personal AI command center. Development is proceeding in explicit phases so each capability has a verified foundation before the next one is added.

## Phase 0

The foundation includes a Vite + React + TypeScript frontend, strict type checking, ESLint, Prettier, Vitest, environment configuration, structured logging, normalized errors, and a small observable application store.

## Setup

Requirements: Node.js 20 or newer and npm.

```bash
npm install
copy .env.example .env
```

Start the core service in one PowerShell window:

```powershell
npm run core
```

Start the Vite UI in a second PowerShell window:

```powershell
npm run dev
```

Open the URL printed by Vite, normally `http://localhost:5173`.

Phase 9 orchestration is available through the exported modules under `src/agents`. Simple requests remain on the direct JARVIS Brain path; multi-step requests can use `AgentOrchestrator` with the default registry.

Validation commands:

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

Secrets must be supplied through environment variables. They are never stored in source code or the database.

## Architecture

Application code is organized by responsibility under `src/`: `config`, `services`, `shared`, and `state`. Future desktop, AI, voice, tool, memory, security, and persistence modules will remain behind explicit interfaces and permission boundaries.