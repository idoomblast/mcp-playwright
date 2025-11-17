#!/usr/bin/env node

import dotenv from 'dotenv';
dotenv.config({quiet: true});

import { randomUUID } from 'crypto';
import express from 'express';
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createToolDefinitions } from "./tools.js";
import { setupRequestHandlers } from "./requestHandler.js";

// Get port from environment variable or use default
const port = parseInt(process.env.PORT) || 3000;

async function runServer() {
  const server = new Server(
    {
      name: "browser",
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
    sessionIdGenerator: undefined, // Stateless mode
    enableJsonResponse: true, // Use direct JSON responses
  });

  // Create Express app
  const app = express();

  // Middleware to parse JSON
  app.use(express.json());

  // Authentication middleware
  app.use('/mcp', (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: Missing or invalid Bearer token' });
    }
    const token = authHeader.substring(7); // Remove 'Bearer '
    // For simplicity, check against a hardcoded token (in production, verify JWT or database)
    const expectedToken = process.env.MCP_BEARER_TOKEN || 'default-token';
    if (token !== expectedToken) {
      return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
    // Attach auth info to request
    (req as any).authInfo = { token };
    next();
  });

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