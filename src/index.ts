#!/usr/bin/env node

import dotenv from 'dotenv';
dotenv.config({ quiet: true });

import express from 'express';
import cors from 'cors';
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createToolDefinitions } from "./tools.js";
import { setupRequestHandlers } from "./requestHandler.js";
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import { randomUUID } from 'crypto';
import { handleToolCall } from './toolHandler.js';

// Get port from environment variable or use default
const port = parseInt(process.env.PORT) || 3000;

async function runServer() {
  // Create tool definitions
  const TOOLS = createToolDefinitions();

  const transports: { [sessionId: string]: StreamableHTTPServerTransport } = {};

  // Create Express app
  const app = express();
  app.use(
    cors({
      origin: '*', // Configure appropriately for production, for example:
      // origin: ['https://your-remote-domain.com', 'https://your-other-remote-domain.com'],
      exposedHeaders: ['mcp-session-id'],
      allowedHeaders: ['Content-Type', 'mcp-session-id']
    })
  );
  // Middleware to parse JSON
  app.use(express.json());

  // Authentication middleware
  if (process.env.MCP_BEARER_TOKEN) {
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
      // Attach auth info to requestnpm 
      (req as any).authInfo = { token };
      next();
    });
  }

  // Handle MCP requests
  app.post('/mcp', (req, res) => {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;
    
    let transport: StreamableHTTPServerTransport;

    if (sessionId && transports[sessionId]) {
      transport = transports[sessionId];
    } else if (!sessionId && isInitializeRequest(req.body)) {
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (sessionId) => {
          transports[sessionId as string] = transport;
        },
      });
      transport.onclose = () => {
        if (transport.sessionId) {
          console.log('hapus session')
          delete transports[transport.sessionId];
        }
      };

      const server = new McpServer({
        name: "browser",
        version: "1.0.0"
      }, {
        capabilities: {
          tools: {},
          resources: {}
        }
      });

      // Register tools
      for (const tool of TOOLS) {
        server.registerTool(
          tool.name,
          {
            description: tool.description,
            inputSchema: tool.inputSchema,
          },
          (args: any) => handleToolCall(tool.name, args, server)
        );
      }

      // Setup request handlers
      setupRequestHandlers(server);

      server.connect(transport);
    } else {
      res.status(400).json({ error: 'Bad request: Invalid session or initialization.' });
      return;
    }

    transport.handleRequest(req, res, req.body);
  });

  const handleSessionRequest = async (req: express.Request, res: express.Response) => {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;
    if (!sessionId || !transports[sessionId]) {
      res.status(400).send('Invalid or missing session ID')
      return
    }
    const transport = transports[sessionId]
    await transport.handleRequest(req, res)
  }

  app.get('/mcp', handleSessionRequest)
  
  app.delete('/mcp', handleSessionRequest)

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
