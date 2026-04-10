---
applyTo: "**"
---

# Tool Fallback Chain

VS Code may not always provide all tools listed in agent frontmatters. MCP servers may fail to start. Every agent must be prepared for tool unavailability.

## DISCOVERY

- [P0-MUST] At the start of every agent session, verify core tools are available before proceeding.
- [P0-MUST] Probe the built-in tool first, then the MCP fallback for the same operation.
- [P0-MUST] If a required tool is unavailable, follow the fallback chain below.

## GENERAL_FALLBACK_CHAIN

| Operation      | Priority 1 (Built-in)   | Priority 2 (MCP)            | Priority 3 (Terminal)                         | Priority 4     |
| -------------- | ----------------------- | --------------------------- | --------------------------------------------- | -------------- |
| Read file      | `read/readFile`         | `filesystem/read_file`      | `execute/runInTerminal` with `cat`/`type`     | `TOOL_FAILURE` |
| Write file     | `edit/createFile`       | `filesystem/write_file`     | `execute/runInTerminal` with redirect         | `TOOL_FAILURE` |
| Edit file      | `edit/editFiles`        | `filesystem/edit_file`      | `execute/runInTerminal` with `sed`/PowerShell | `TOOL_FAILURE` |
| List directory | `search/listDirectory`  | `filesystem/list_directory` | `execute/runInTerminal` with `ls`/`dir`       | `TOOL_FAILURE` |
| Search code    | `search/textSearch`     | —                           | `execute/runInTerminal` with `rg`             | `TOOL_FAILURE` |
| Run commands   | `execute/runInTerminal` | —                           | —                                             | `TOOL_FAILURE` |

## AGLOOP_MCP_FALLBACK_CHAIN

The AgLoop Gateway MCP server (`agloop` in `.vscode/mcp.json`) provides structured state access. **Prefer MCP introspection tools over raw file I/O** when available.

| Operation   | Priority 1 (MCP)                  | Priority 2 (Built-in)                 | Priority 3     |
| ----------- | --------------------------------- | ------------------------------------- | -------------- |
| Read state  | `mcp_agloop_agloop_get_state`     | `read/readFile` on .agloop/state.json | `TOOL_FAILURE` |
| Update task | `mcp_agloop_agloop_update_task`   | `edit/editFiles` on state.json        | `TOOL_FAILURE` |
| Append log  | `mcp_agloop_agloop_append_log`    | Manual JSON append to log.json        | `TOOL_FAILURE` |
| Read plan   | `mcp_agloop_agloop_get_plan`      | `read/readFile` on .agloop/plan.yaml  | `TOOL_FAILURE` |
| Next task   | `mcp_agloop_agloop_get_next_task` | Manual topological sort from state    | `TOOL_FAILURE` |

## FAILURE_REPORTING

- [P0-MUST] If all fallbacks are exhausted, return `FAILED` with reason `TOOL_FAILURE`.
- [P0-MUST] Include in RESULT block: `Blockers: [tool_name] not available — tried [fallback_1], [fallback_2], [fallback_3]`.
- [P1-SHOULD] If a non-critical tool is unavailable but the task can still complete, log a warning and continue.
- [P1-SHOULD] Executors should attempt terminal fallbacks before reporting TOOL_FAILURE.
