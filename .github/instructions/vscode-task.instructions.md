---
applyTo: '**/*.ts, **/*.js'
---
In our **development environment**, all development (e.g., `npm run start` ) **MUST** be started and managed using the Visual Studio Code (VSCode) task system.

### Allowed
* Start/manage mcp servers **only** via:
  * `run_task`
* View logs/output **only** via:
  * `get_task_output`
* You are allowed to run test and other command exept mentioned below.

### Forbidden ❌ Direct terminal commands: `npm run start`

---

## Starting MCP Server
Use `run_task` with:
* `id`: task ID `npm:start`
* `workspaceFolder`: absolute workspace path

## Check Error
**Mandatory** check for error after modifying code
* `id`: task ID `npm:watch`
* `workspaceFolder`: absolute workspace path

---

## Retrieving Logs / Output

Use `get_task_output` with the **same** task ID and workspace folder.
Example:
```
{
  "id": "npm:prod",
  "workspaceFolder": "<absolute workspace path>"
}
```

## Stopping / Restarting Tasks (Exception Case)
> No task tool exists for stopping task processes.
> **Terminal use is allowed ONLY for stopping/killing processes that forbidden to run in terminal.**

---

## Task Discovery
* Tasks are defined in workspace configuration `.vscode/tasks.json`
* Always rely on the **latest workspace metadata**
* Current task IDs:
  * `npm:watch` => `npm run watch`
  * `npm:build` => `npm run build`
  * `npm:prod` => `npm run prod` if you run this task, this will automaticially run `npm:build` task first and then `npm:prod`.

---

## Absolute Rules (Do Not Violate)
* Always use `run_task` to start mcp server `npm run prod` task id: `npm:prod`
* Never start mcp servers directly from terminal
* Only use terminal to **stop/kill** running tasks: `pkill -f "node ./dist/index.js" || true; sleep 1; pgrep -af "node ./dist/index.js" || true`
* Always use `get_task_output` for logs
* Follow restart procedure for non auto-reload tasks

* don't mind "ephemeral", the data is still the same as what you saw earlier