# Agent Development Guide - hono-sse

This document provides comprehensive information for AI agents (like Cursor, Copilot, or specialized CLI agents) to build, test, and maintain the `hono-sse` repository. Use this as a reference for project conventions and architecture.

## 🛠 Project Overview
A full-stack application leveraging [Hono](https://hono.dev) and [Bun](https://bun.sh) for a lightweight, high-performance backend, integrated with Google's Gemini AI for streaming content via Server-Sent Events (SSE). The project includes a React-based frontend served directly by Bun.

- **Backend:** Hono on Bun Runtime
- **Frontend:** React (TSX) with Tailwind CSS (v4)
- **AI SDK:** `@google/genai` (Unified Google Gen AI SDK)
- **Primary Feature:** Real-time AI response streaming with visible reasoning (thoughts).

## 🚀 Key Commands

### Development
- `bun run dev`: Starts the development server with hot reloading for the backend.
- **Note:** The frontend is served via `Bun.serve` in `src/index.ts`, so this command starts the entire stack.

### Testing
- `bun test`: Runs all tests in the repository using the built-in Bun test runner.
- `bun test src/path/to/file.test.ts`: Runs a specific test file.
- `bun test -t "test name"`: Runs tests matching a specific pattern.
- **Snapshots:** Use `bun test -u` to update snapshots.

### Build & Maintenance
- `bun x tsc --noEmit`: Runs the TypeScript compiler in "no emit" mode for type checking across the project.
- `bun install`: Mandatory for dependency management. NEVER use `npm` or `yarn`.

## 🎨 Code Style & Guidelines

### TypeScript & Types
- **Strict Mode:** Always enabled (`tsconfig.json`).
- **Typing:**
  - Avoid `any`. Use `unknown` or specific interfaces/types.
  - Prefer `interface` for public APIs and object shapes.
  - Use `type` for unions, intersections, and simple aliases.
  - Leverage Hono's built-in types: `Context`, `MiddlewareHandler`, `Next`.
- **Naming:**
  - **Files:** `kebab-case.ts` (e.g., `gemini-service.ts`).
  - **Classes/Interfaces:** `PascalCase`.
  - **Functions/Variables:** `camelCase`.
  - **Constants:** `UPPER_SNAKE_CASE`.

### Imports & Exports
- **Standard:** Use ES modules (`import`/`export`).
- **Grouping:** 
  1. Built-in modules (e.g., `fs`, `path`).
  2. Third-party libraries (e.g., `hono`, `@google/genai`).
  3. Local modules (e.g., `./gemini`).
- **Defaults:** The Hono `app` is defined in `src/index.ts`. `Bun.serve` handles the fetch request.

### Error Handling
- **Backend:** 
  - Use Hono's `HTTPException` for API-level errors.
  - Wrap AI SDK calls and async operations in `try/catch` blocks.
  - Return structured JSON: `{ error: string, message: string }`.
- **Streaming:** 
  - Errors within `streamSSE` must be caught and sent as an `error` event before closing the stream.

### Middleware Usage
- **Built-in:** Leverage Hono's built-in middleware (`logger`, `cors`, `pretty-json`).
- **Custom:** Use `createMiddleware` from `hono/factory` with proper type annotations.

### SSE Protocol & Data Format
The `/api/stream` endpoint follows the standard SSE protocol. Events are structured as follows:
- `event: thought`: Emitted when the model is reasoning. Data is a JSON string: `{"thought": "string"}`.
- `event: message`: Emitted for actual response chunks. Data is a JSON string: `{"text": "string"}`.
- `event: end`: Emitted when the stream is completed successfully. Data is a JSON string: `{"status": "done"}`.
- `event: error`: Emitted on failure. Data is a JSON string: `{"error": "message"}`.

### Bun-specific Features
- Use `Bun.env` for environment variables.
- Use `Bun.serve` for high-performance serving, leveraging the `routes` object for simple routing.
- The project uses Bun's ability to import `.html` files directly (see `src/index.ts`).

### AI Integration (@google/genai)
- **Model:** Use `gemini-2.5-flash` for general tasks.
- **Thinking:** Enabled via `thinkingConfig` in `generateContentStream`.
  - `includeThoughts: true`
  - `thinkingBudget: 1024` (or as appropriate).
- **Processing Chunks:** Iterate over all `parts` in each `chunk.candidates[0].content.parts`. Check `part.thought` to distinguish between reasoning and final output.

### React Guidelines
- **Components:** Functional components with Hooks are the standard.
- **Styling:** Tailwind CSS v4 via CDN in `index.html`. Avoid separate CSS files if possible.
- **State Management:** Use `useRef` for values that need to be accessed inside asynchronous SSE event listeners or callbacks to avoid closure staleness (captured values from a previous render).
- **SSE Client:** 
  - Use the native `EventSource` API to consume the `/api/stream` endpoint.
  - Implement specific listeners for `thought`, `message`, `end`, and `error` events.
  - Always clean up the `EventSource` (call `.close()`) in the component's cleanup function or when the stream is finished to prevent memory leaks.
- **UX:** Provide visual feedback for "thinking" states and "typing" animations.

## 📁 Project Structure
- `src/`
  - `index.ts`: Application entry point, Hono setup, and Bun server.
  - `gemini.ts`: Google Gen AI SDK wrapper and configuration.
  - `client/`: React frontend.
    - `index.html`: Main HTML template.
    - `main.tsx`: React entry point.
    - `App.tsx`: Root component and chat logic.
- `tsconfig.json`: TypeScript configuration (target: ESNext).
- `.env`: Environment variables (GEMINI_API_KEY, PORT).
- `package.json`: Dependency manifest and scripts.

## 🤖 AI Agent Instructions
1. **Always use Bun:** Use `bun` for all commands (installing, running, testing). NEVER use `npm`, `yarn`, or `node`.
2. **Always verify imports:** Ensure you are using `@google/genai` and NOT the deprecated `@google/generative-ai`.
2. **Type-check:** After making changes, run `bun x tsc --noEmit` to ensure type safety.
3. **SSE Consistency:** Always maintain the four-event protocol (`thought`, `message`, `end`, `error`) when modifying streaming logic.
4. **No Semicolons:** Follow the project's formatting preference of no semicolons (enforced by the current codebase style).
5. **Indentation:** Use 2-space indentation consistently.

## 🔑 Environment Variables
Required variables in `.env`:
- `PORT`: Port for the Hono server (default: 3080).
- `GEMINI_API_KEY`: Google AI Studio API key.

---
*Note: This file is intended for AI consumption to ensure consistent code generation and maintenance.*
