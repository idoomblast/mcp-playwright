# MCP Playwright Server - AI Coding Guidelines

## Project Overview
This is a **Model Context Protocol (MCP) server** providing browser automation via Playwright. It enables LLMs to interact with web pages, take screenshots, generate test code, and execute JavaScript in real browsers.

**Server name:** `playwright-mcp` | **Tool prefix:** `playwright_`

---

## Critical Architecture Patterns

### Tool Class Hierarchy
All browser tools extend `BrowserToolBase` (`src/tools/browser/base.ts`) which provides:
- `ensurePage(context)` - Validate page exists
- `validatePageAvailable(context)` - Return error response if page missing
- `safeExecute(context, operation)` - Handle browser disconnection gracefully

**Example implementation** (see `src/tools/browser/navigation.ts`):
```typescript
export class NavigationTool extends BrowserToolBase {
  async execute(args: any, context: ToolContext): Promise<ToolResponse> {
    return this.safeExecute(context, async (page) => {
      await page.goto(args.url, { timeout: args.timeout || 30000 });
      return createSuccessResponse(`Navigated to ${args.url}`);
    });
  }
}
```

### Response Pattern
All tools return `ToolResponse` using helper functions (`src/tools/common/types.ts`):
- `createSuccessResponse(message: string | string[])` - Success response
- `createErrorResponse(message: string)` - Error response

### Tool Registration Flow
1. Define tool in category module (e.g., `src/tools/browser/navigation.ts`)
2. Export from category index (`src/tools/browser/index.ts`)
3. Import in `src/toolHandler.ts` and instantiate as global variable
4. Register in `src/tools.ts` using `createToolDefinitions()`

---

## Naming Conventions

### Tool Names
- **Prefix:** Always use `playwright_` (e.g., `playwright_navigate`, `playwright_click`)
- **Length limit:** Keep tool names SHORT. Cursor imposes **60-character limit** for `server:tool` combined names
- **Avoid:** Long descriptions or redundant prefixes

### File Structure
```
src/tools/
├── browser/          # Browser automation tools
├── api/             # HTTP request tools
├── codegen/         # Test generation/recording tools
├── common/          # Shared types and utilities
└── index.ts         # Tool exports
```

---

## Critical Workflows

### Build & Test
```bash
npm run build        # Compile TypeScript → dist/ + make executable
npm run watch       # TypeScript watch mode
npm test            # Run Jest tests (no coverage)
npm run test:coverage  # Generate coverage report in coverage/
node run-tests.cjs  # Custom test runner with coverage
```

### Running the Server
```bash
npm run prod        # Run compiled server
node ./dist/index.js  # Direct execution
```

### Evals (Testing MCP Integration)
```bash
OPENAI_API_KEY=your-key npx mcp-eval src/evals/evals.ts src/tools/codegen/index.ts
```

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `STATEFULL` | `true`=stateful sessions (default), `false`=stateless |
| `PORT` | Server port (default: 3000) |
| `MCP_BEARER_TOKEN` | Optional Bearer token authentication |
| `PLAYWRIGHT_BROWSERS_PATH` | Custom browser binaries path |
| `ALLOWED_HOSTS` | Comma-separated list of allowed host headers (default: localhost,127.0.0.1,192.168.230.113) |
| `ALLOWED_ORIGINS` | Comma-separated list of allowed origin headers (default: http://localhost:*,http://127.0.0.1:*) |
| `AUTHORIZATION_SERVER` | Optional authorization server URL for OAuth 2.0 |
| `SCOPES_SUPPORTED` | Comma-separated list of supported OAuth scopes |

---

## Session Management

**Stateful mode (default):** Each MCP session gets separate browser context via `MCP-Session-Id` header (case-sensitive per MCP spec 2025-11-25).

**Stateless mode:** Set `STATEFULL=false`, all requests share same context with session ID `stateless`.

Sessions auto-cleanup on transport close (see `src/index.ts`).

---

## Security

**MCP Specification 2025-11-25 Compliance:**
- DNS rebinding protection enabled via `enableDnsRebindingProtection`
- Configure `ALLOWED_HOSTS` and `ALLOWED_ORIGINS` environment variables for production
- Origin header validation enforced per MCP spec 2025-11-25
- OAuth 2.0 Protected Resource Metadata endpoint at `/.well-known/oauth-protected-resource` (RFC9728)
- WWW-Authenticate header included in 401 responses per MCP spec 2025-11-25
- Header case sensitivity: `MCP-Session-Id` (case-sensitive per spec)

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `src/index.ts` | Express server, session management, auth middleware |
| `src/toolHandler.ts` | Tool execution dispatcher, global browser/page state |
| `src/tools.ts` | Tool definitions with Zod schemas |
| `src/tools/browser/base.ts` | Base class for all browser tools |
| `src/tools/common/types.ts` | ToolContext, ToolResponse, helper functions |

---

## Adding New Tools

1. Create tool class in appropriate category (e.g., `src/tools/browser/`)
2. Extend `BrowserToolBase` and implement `execute(args, context)`
3. Export from category `index.ts`
4. Import and instantiate as global in `src/toolHandler.ts`
5. Add tool definition to `src/tools.ts` with Zod schema

**Tool name constraint:** Verify `playwright_yourtoolname` ≤ 43 characters (leaving 17 for `playwright:` prefix).