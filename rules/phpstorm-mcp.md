---
description: When/how to use PhpStorm MCP (mcp.json server key phpstorm) in Stage 5–6. Attach with anti-over-engineering on RED/GREEN chats.
alwaysApply: false
---

# PhpStorm MCP

Use the PhpStorm MCP server during **Stage 5 (RED)** and **Stage 6 (GREEN)** for IDE/PHP insight. Do not use it for SPEC, TEST-PLAN, or review agents (`specify`, `spec-reviewer`, `test-plan`, `test-plan-reviewer`, `revizor`).

Docs: [PhpStorm MCP Server](https://www.jetbrains.com/help/phpstorm/mcp-server.html).

## Server name

Config key in `~/.cursor/mcp.json`: **`phpstorm`**.

Do not refer to Cursor’s internal label `user-phpstorm` — the server key is `phpstorm`.

## Prerequisites

- PhpStorm is open with **MCP Server** enabled (Settings → Tools → MCP Server).
- Cursor points at the live HTTP Stream endpoint, e.g. `http://127.0.0.1:64442/stream` with `"type": "http"` in `~/.cursor/mcp.json` (port can change after PhpStorm restart).
- Cursor Agent CLI rejects `"type": "streamable-http"` and silently drops the whole MCP config — use `"http"` (same transport). PhpStorm Auto-Configure may rewrite this; change it back if `agent mcp list` shows nothing.
- If tools are missing: keep PhpStorm running, then **Reload** MCP in Cursor (Settings → Tools & MCP) or start a new agent session.

## Project targeting

- When a tool accepts `projectPath`, pass the workspace root.
- Optional mcp.json header `IJ_MCP_SERVER_PROJECT_PATH` sets the same default project for the session.

## When to use

Prefer `phpstorm` MCP for PHP/IDE insight:

- `get_php_project_config` — language level, interpreter, runtime
- `get_file_problems` / `get_inspections` — after edits that the IDE should validate
- `search_symbol` / `get_symbol_info` — navigation and symbol context
- `apply_quick_fix` — only when an inspection quick-fix is the intended change

## When not to use

- Spec / test-plan / review stages and their subagents
- Replacing project test commands (`npm test`, Playwright, etc.) with MCP
- Terminal / run-configuration tools unless necessary (Brave mode is usually off → PhpStorm may prompt)

## Discipline

MCP assists; it does not override workflow rules. **anti-over-engineering** and the active **tech-stack-*** rule still win on code changes.
