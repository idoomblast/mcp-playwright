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

const statefull = JSON.parse(process.env.STATEFULL || 'false') || false;
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
      exposedHeaders: ['MCP-Session-Id'],
      allowedHeaders: ['Content-Type', 'MCP-Session-Id', 'Authorization']
    })
  );
  // Middleware to parse JSON
  app.use(express.json());

  // DNS Rebinding Protection - Validate Origin header
  // Temporarily disabled - SDK handles Origin validation internally
  // app.use('/mcp', (req, res, next) => {
  //   const origin = req.headers.origin;
  //   const allowedOrigins = process.env.ALLOWED_ORIGINS 
  //     ? process.env.ALLOWED_ORIGINS.split(',')
  //     : ['http://localhost:*', 'http://127.0.0.1:*'];
  //   
  //   // Skip validation if no Origin header (not relevant for DNS rebinding protection)
  //   if (!origin) {
  //     return next();
  //   }
  //   
  //   // Check if origin is allowed
  //   const isAllowed = allowedOrigins.some(allowed => {
  //     if (allowed.includes('*')) {
  //       const prefix = allowed.replace('*', '');
  //       return origin.startsWith(prefix);
  //     }
  //     return origin === allowed;
  //   });
  //   
  //   if (!isAllowed) {
  //     return res.status(403).json({
  //       jsonrpc: '2.0',
  //       error: {
  //         code: -32000,
  //         message: 'Forbidden: Invalid Origin header'
  //       },
  //       id: null
  //     });
  //   }
  //   
  //   next();
  // });

  // Authentication middleware
  if (process.env.MCP_BEARER_TOKEN) {
    app.use('/mcp', (req, res, next) => {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        // Return WWW-Authenticate header per MCP spec 2025-11-25
        const resourceMetadataUrl = `${req.protocol}://${req.get('host')}/.well-known/oauth-protected-resource`;
        res.setHeader('WWW-Authenticate', `Bearer resource_metadata="${resourceMetadataUrl}"`);
        return res.status(401).json({
          jsonrpc: '2.0',
          error: {
            code: -32001,
            message: 'Unauthorized: Missing or invalid Bearer token'
          },
          id: null
        });
      }
      
      const token = authHeader.substring(7); // Remove 'Bearer '
      const expectedToken = process.env.MCP_BEARER_TOKEN || 'default-token';
      
      if (token !== expectedToken) {
        // Return WWW-Authenticate header per MCP spec 2025-11-25
        const resourceMetadataUrl = `${req.protocol}://${req.get('host')}/.well-known/oauth-protected-resource`;
        res.setHeader('WWW-Authenticate', `Bearer resource_metadata="${resourceMetadataUrl}"`);
        return res.status(401).json({
          jsonrpc: '2.0',
          error: {
            code: -32001,
            message: 'Unauthorized: Invalid token'
          },
          id: null
        });
      }
      
      // Attach auth info to request
      (req as any).authInfo = { token };
      next();
    });
  }

  // Handle MCP requests
  app.post('/mcp', (req, res) => {
    let sessionId = (req.headers['MCP-Session-Id'] || req.headers['mcp-session-id']) as string | undefined;
    if (!statefull) {
      sessionId = 'stateless';
    }
    
    let transport: StreamableHTTPServerTransport;

    if (sessionId && transports[sessionId]) {
      transport = transports[sessionId];
    } else if (!sessionId && isInitializeRequest(req.body)) {
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => statefull ? randomUUID() : 'stateless',
        enableDnsRebindingProtection: false,
        enableJsonResponse: true,
        allowedHosts: process.env.ALLOWED_HOSTS 
          ? process.env.ALLOWED_HOSTS.split(',')
          : ['localhost', '127.0.0.1', '192.168.230.113', '192.168.230.113:3000'],
        allowedOrigins: process.env.ALLOWED_ORIGINS 
          ? process.env.ALLOWED_ORIGINS.split(',')
          : ['http://localhost:*', 'http://127.0.0.1:*', 'http://192.168.230.113:*'],
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
    let sessionId = req.headers['MCP-Session-Id'] as string | undefined;
    if (!statefull) {
      sessionId = 'stateless';
    }
    if (!sessionId || !transports[sessionId]) {
      res.status(400).send('Invalid or missing session ID')
      return
    }
    const transport = transports[sessionId]
    await transport.handleRequest(req, res, req.body)
  }

  app.get('/mcp', handleSessionRequest)
  
  app.delete('/mcp', handleSessionRequest)

  // OAuth 2.0 Protected Resource Metadata endpoint (RFC9728)
  // Required per MCP spec 2025-11-25 Authorization section
  app.get('/.well-known/oauth-protected-resource', (req, res) => {
    const serverUrl = `${req.protocol}://${req.get('host')}`;
    res.json({
      resource: `${serverUrl}/mcp`,
      authorization_servers: process.env.AUTHORIZATION_SERVER 
        ? [process.env.AUTHORIZATION_SERVER]
        : [serverUrl], // Default to server URL for simple bearer token auth
      scopes_supported: process.env.SCOPES_SUPPORTED
        ? process.env.SCOPES_SUPPORTED.split(',')
        : [],
      bearer_methods_supported: ['header'],
      resource_metadata: `${serverUrl}/.well-known/oauth-protected-resource`
    });
  });

  // OAuth 2.0 Authorization Server Metadata endpoint (RFC8414)
  // Required per MCP spec 2025-11-25 Authorization section
  app.get('/.well-known/oauth-authorization-server', (req, res) => {
    const serverUrl = `${req.protocol}://${req.get('host')}`;
    res.json({
      issuer: serverUrl,
      authorization_endpoint: `${serverUrl}/authorize`,
      token_endpoint: `${serverUrl}/token`,
      response_types_supported: ['code'],
      grant_types_supported: ['authorization_code', 'client_credentials'],
      scopes_supported: process.env.SCOPES_SUPPORTED
        ? process.env.SCOPES_SUPPORTED.split(',')
        : [],
      token_endpoint_auth_methods_supported: ['client_secret_post', 'client_secret_basic'],
      bearer_methods_supported: ['header'],
      resource_metadata: `${serverUrl}/.well-known/oauth-protected-resource`
    });
  });

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
