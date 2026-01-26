# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MCP server providing browser automation via Playwright. Enables LLMs to interact with web pages through HTTP, supporting stateful and stateless session management.

**Server name:** `playwright-mcp` | **Tool prefix:** `playwright_`

## Common Development Commands

### Building & Watching
```bash
npm run build        # Compile TypeScript → dist/ + make executable
npm run watch        # TypeScript watch mode
```

### Testing
```bash
npm test                                                    # Run all tests
npm run test:coverage                                       # Tests with coverage
npm test -- src/__tests__/tools/browser/navigation.test.ts # Single test file
```

### Running the Server
```bash
npm run prod         # Production server (runs build first)
node ./dist/index.js # Direct execution
```

### Evals (MCP Integration Testing)
```bash
OPENAI_API_KEY=your-key npx mcp-eval src/evals/evals.ts src/tools/codegen/index.ts
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `STATEFULL` | `true`=stateful sessions, `false`=stateless (default) |
| `PORT` | Server port (default: 3000) |
| `MCP_BEARER_TOKEN` | Optional Bearer token authentication |
| `CHROME_EXECUTABLE_PATH` | Custom Chrome/Chromium executable path |
| `PLAYWRIGHT_BROWSERS_PATH` | Custom browser binaries path |
| `ALLOWED_HOSTS` | Comma-separated allowed hosts (default: localhost,127.0.0.1) |
| `ALLOWED_ORIGINS` | Comma-separated allowed origins |

## Architecture

### Tool Class Hierarchy
All browser tools extend `BrowserToolBase` (`src/tools/browser/base.ts`) which provides:
- `ensurePage(context)` - Validate page exists
- `validatePageAvailable(context)` - Return error response if page missing
- `safeExecute(context, operation)` - Handle browser disconnection gracefully

### Response Pattern
All tools return `ToolResponse` using helpers from `src/tools/common/types.ts`:
- `createSuccessResponse(message: string | string[])` - Success response
- `createErrorResponse(message: string)` - Error response

### Tool Registration Flow
1. Define tool class in category module (e.g., `src/tools/browser/navigation.ts`)
2. Export from category index (`src/tools/browser/index.ts`)
3. Import and instantiate in `src/toolHandler.ts`
4. Add tool definition with Zod schema in `src/tools.ts`

### Key Files

| File | Purpose |
|------|---------|
| `src/index.ts` | Express server, session management, auth middleware |
| `src/toolHandler.ts` | Tool execution dispatcher, global browser/page state |
| `src/tools.ts` | Tool definitions with Zod schemas, tool category constants |
| `src/tools/browser/base.ts` | Base class for all browser tools |
| `src/tools/common/types.ts` | ToolContext, ToolResponse, helper functions |

### Session Management
- **Stateful mode:** Each MCP session gets separate browser context via `MCP-Session-Id` header
- **Stateless mode:** Set `STATEFULL=false`, all requests share same context with session ID `stateless`
- Sessions auto-cleanup on transport close

## Adding New Tools

1. Create tool class extending `BrowserToolBase`:
```typescript
export class MyTool extends BrowserToolBase {
  async execute(args: any, context: ToolContext): Promise<ToolResponse> {
    return this.safeExecute(context, async (page) => {
      // Tool logic here
      return createSuccessResponse("Done");
    });
  }
}
```
2. Export from category `index.ts`
3. Instantiate in `src/toolHandler.ts`
4. Add definition to `src/tools.ts` with Zod schema

**Tool name constraint:** `playwright_yourtoolname` ≤ 43 characters (leaving 17 for server prefix due to Cursor's 60-char limit).

## MCP Protocol Endpoints

- `POST /mcp` - Main MCP endpoint for tool calls and initialization
- `GET /mcp` - Session request handling
- `DELETE /mcp` - Session cleanup
- `GET /.well-known/oauth-protected-resource` - OAuth 2.0 metadata (RFC9728)
