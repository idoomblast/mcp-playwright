import { BrowserToolBase } from './base.js';
import { ToolContext, ToolResponse, createSuccessResponse } from '../common/types.js';

/**
 * Tool for retrieving and filtering console logs from the browser
 */
export class ConsoleLogsTool extends BrowserToolBase {
  private consoleLogs: string[] = [];

  /**
   * Register a console message
   * @param type The type of console message
   * @param text The text content of the message
   */
  registerConsoleMessage(type: string, text: string): void {
    const logEntry = `[${type}] ${text}`;
    this.consoleLogs.push(logEntry);
  }

  /**
   * Execute the console logs tool
   */
  async execute(args: any, context: ToolContext): Promise<ToolResponse> {
    // No need to use safeExecute here as we don't need to interact with the page
    // We're just filtering and returning logs that are already stored
    
    let logs = [...this.consoleLogs];
    
    // Filter by type if specified
    if (args.type && args.type !== 'all') {
      logs = logs.filter(log => log.startsWith(`[${args.type}]`));
    }
    
    // Filter by search text if specified
    if (args.search) {
      logs = logs.filter(log => log.includes(args.search));
    }
    
    // Group identical log messages if requested
    if (args.group) {
      const logCounts = new Map<string, number>();
      for (const log of logs) {
        logCounts.set(log, (logCounts.get(log) || 0) + 1);
      }
      logs = Array.from(logCounts.entries()).map(([log, count]) => {
        if (count > 1) {
          // Extract type and message from log format "[TYPE] message"
          const match = log.match(/^\[([^\]]+)\]\s*(.+)$/);
          if (match) {
            const [, type, message] = match;
            return `[${type}] ${message} (x${count})`;
          }
        }
        return log;
      });
    }
    
    // Limit the number of logs (after grouping)
    if (args.limit && args.limit > 0) {
      logs = logs.slice(-args.limit);
    }
    
    // Truncate long log messages if maxLength is specified
    if (args.maxLength && args.maxLength > 0) {
      logs = logs.map(log => {
        // Check if this is a grouped log with "(xN)" suffix
        const groupedMatch = log.match(/^(.+)\s+\(x\d+\)$/);
        if (groupedMatch) {
          const [, baseLog] = groupedMatch;
          if (baseLog.length > args.maxLength) {
            return `${baseLog.substring(0, args.maxLength)}... ${log.match(/\(x\d+\)$/)![0]}`;
          }
          return log;
        }
        
        // Regular log truncation
        if (log.length > args.maxLength) {
          return `${log.substring(0, args.maxLength)}...`;
        }
        return log;
      });
    }
    
    // Clear logs if requested
    if (args.clear) {
      this.consoleLogs = [];
    }
    
    // Format the response
    if (logs.length === 0) {
      return createSuccessResponse("No console logs matching the criteria");
    } else {
      return createSuccessResponse([
        `Retrieved ${logs.length} console log(s):`,
        ...logs
      ]);
    }
  }

  /**
   * Get all console logs
   */
  getConsoleLogs(): string[] {
    return this.consoleLogs;
  }

  /**
   * Clear all console logs
   */
  clearConsoleLogs(): void {
    this.consoleLogs = [];
  }
} 