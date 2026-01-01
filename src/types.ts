import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

export interface Tool {
  name: string;
  description: string;
  inputSchema: z.ZodObject<any>;
  handler: (args: any) => Promise<any>;
}

export interface ToolCall {
  name: string;
  parameters: Record<string, unknown>;
  result?: CallToolResult;
}