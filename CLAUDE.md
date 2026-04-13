# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Camunda 7 Cockpit Plugins — a collection of React/TypeScript plugins for the Camunda 7 Cockpit process monitoring UI. Each plugin builds to a separate JS bundle that Cockpit loads at runtime.

## Build & Development Commands

```bash
npm run build              # Production build (Rollup, no sourcemaps)
npm run watch              # Dev mode with watch + sourcemaps
npm run prettier:check     # Check formatting
npm run prettier:format    # Fix formatting
docker-compose up          # Run Camunda 7.18.0 on localhost:8080
```

No test suite exists. There is no lint command beyond Prettier.

## Development Workflow

1. `npm run watch` in one terminal, `docker-compose up` in another
2. Edit files in `src/`, Rollup rebuilds bundles in project root
3. Refresh Cockpit at `http://localhost:8080/app/cockpit` to see changes

## Architecture

**Plugin system**: 8 independent entry points, each defined in `rollup.config.mjs`, each producing a standalone JS bundle in the project root:

| Entry file | Purpose |
|---|---|
| `src/definition-historic-activities.tsx` | Activity statistics on process definition page |
| `src/instance-historic-activities.tsx` | Activity badge overlays on instance diagram |
| `src/instance-route-history.tsx` | Full flow history with filtering & CSV export |
| `src/definition-batch-modify.tsx` | Batch modify multiple process instances |
| `src/definition-batch-retry.tsx` | Batch retry failed instances (jobs + external tasks) |
| `src/instance-tab-modify.tsx` | Single instance modification tab |
| `src/tasklist-audit-log.tsx` | Audit log in tasklist |
| `src/RobotModule/index.ts` | Custom BPMN renderer for robot framework tasks |

**Plugin registration**: `config.js` registers all plugin scripts and configures BPMN.js modules.

**Key utilities**:
- `src/utils/api.ts` — Fetch-based HTTP client for Camunda 7 REST API, handles CSRF tokens
- `src/utils/bpmn.ts` — BPMN diagram manipulation, sequence flow rendering, execution path coloring
- `src/utils/misc.ts` — Formatting helpers, settings utilities

**Rendering pattern**: Each plugin entry calls `createRoot()` to mount React components into Cockpit's DOM. Plugins share reusable components from `src/Components/`.

## Build System

Rollup bundles each entry point separately with: TypeScript, Babel (React JSX), SCSS (injected into bundle), image imports, and CommonJS interop. Config suppresses `THIS_IS_UNDEFINED` warnings. Target is ES5 for browser compatibility.

## Packaging & CI

Maven (`pom.xml`) packages built JS files into a JAR. GitHub Actions (`.github/workflows/maven.yaml`) builds and publishes to GitHub Maven Registry on push to master.

## Code Style

- Prettier: 120 char width, single quotes, trailing commas (ES5), no parens on single arrow params
- Import sorting via `prettier-plugin-import-sort`
