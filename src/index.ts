#!/usr/bin/env node

import { randomUUID } from 'crypto';
import express from 'express';
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createToolDefinitions } from "./tools.js";
import { setupRequestHandlers } from "./requestHandler.js";

// Parse command line arguments
const args = process.argv.slice(2);
let port = 3000;
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--port' && i + 1 < args.length) {
    const parsedPort = parseInt(args[i + 1]);
    if (!isNaN(parsedPort) && parsedPort > 0) {
      port = parsedPort;
    }
    break;
  }
}

async function runServer() {
  const server = new Server(
    {
      name: "playwright-mcp",
      version: "1.0.6",
    },
    {
      capabilities: {
        resources: {},
        tools: {},
      },
    }
  );

  // Create tool definitions
  const TOOLS = createToolDefinitions();

  // Setup request handlers
  setupRequestHandlers(server, TOOLS);

  // Create HTTP transport
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => randomUUID(),
  });

  // Create Express app
  const app = express();

  // Middleware to parse JSON
  app.use(express.json());

  // Handle MCP requests
  app.use('/mcp', async (req, res) => {
    await transport.handleRequest(req, res, req.body);
  });

  // Connect server to transport
  await server.connect(transport);

  // Graceful shutdown logic
  function shutdown() {
    console.log('Shutdown signal received');
    process.exit(0);
  }

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
  process.on('exit', shutdown);
  process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
  });

  // Start HTTP server
  app.listen(port, () => {
    console.log(`MCP server listening on port ${port}`);
  });
}

runServer().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});