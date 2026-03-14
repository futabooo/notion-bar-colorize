# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install        # Install dependencies
npm run build      # TypeScript compile + Vite build (output to dist/)
npm run dev        # Start Vite dev server
npx playwright test                          # Run all E2E tests
npx playwright test tests/option.spec.ts     # Run a single test file
npx playwright test --ui                     # Run tests with UI
```

To load the extension manually: build first, then load the `dist/` folder in `chrome://extensions/` with "Load Unpacked".

## Architecture

Chrome Extension (Manifest v3) with three main components:

**Service Worker (`src/background.ts`)** - Listens to `chrome.webNavigation.onHistoryStateUpdated` events and messages content scripts to re-apply colors on SPA navigation.

**Content Script (`src/content.ts`)** - Injected into `https://www.notion.so/*`. Extracts workspace ID from the URL, queries `chrome.storage.sync` for a matching color condition, and applies CSS to `.notion-topbar` and `.notion-sidebar` elements. Falls back to light/dark default themes based on Notion's `body.classList`.

**Options Page (`src/option.ts` + `src/option.html`)** - Settings UI using vanilla-colorful color picker and DaisyUI components. Workspace ID fields support regex matching. Saves conditions to `chrome.storage.sync` under the key defined in `src/consts.ts`.

**Data flow:** Options UI → `chrome.storage.sync` ← Content Script (reads on navigation events triggered by background)

**Key types** (`src/types.ts`): `Condition` (workspaceId + color + optional textColor), `Color` (r/g/b), `Theme` (topbar/sidebar/text colors)

**Build tooling:** Vite with `@crxjs/vite-plugin` handles extension packaging. The manifest is defined inline in `vite.config.ts`.

**Tests:** Playwright E2E tests load the built extension from `dist/` via a custom fixture in `tests/fixtures.ts`. Tests require a prior `npm run build`.
