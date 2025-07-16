import type { Request, Response } from 'playwright';
import { BrowserToolBase } from './base.js';
import { ToolContext, ToolResponse, createSuccessResponse, createErrorResponse } from '../common/types.js';

interface NetworkRequest {
  id: string;
  url: string;
  method: string;
  headers: Record<string, string>;
  postData?: string;
  timestamp: number;
  resourceType: string;
}

interface NetworkResponse {
  id: string;
  url: string;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  timestamp: number;
  requestId: string;
}

interface NetworkEntry {
  request: NetworkRequest;
  response?: NetworkResponse;
  duration?: number;
}

/**
 * Tool for monitoring and inspecting network traffic in the browser
 */
export class NetworkInspectionTool extends BrowserToolBase {
  private networkEntries: Map<string, NetworkEntry> = new Map();
  private requestCounter = 0;
  private isMonitoring = false;

  /**
   * Generate a unique request ID
   */
  private generateRequestId(): string {
    return `req_${++this.requestCounter}_${Date.now()}`;
  }

  /**
   * Register network listeners on a page
   */
  registerNetworkListeners(page: any): void {
    if (this.isMonitoring) {
      return; // Already monitoring
    }

    this.isMonitoring = true;

    // Listen for requests
    page.on('request', (request: Request) => {
      const requestId = this.generateRequestId();
      const networkRequest: NetworkRequest = {
        id: requestId,
        url: request.url(),
        method: request.method(),
        headers: request.headers(),
        postData: request.postData(),
        timestamp: Date.now(),
        resourceType: request.resourceType()
      };

      this.networkEntries.set(requestId, {
        request: networkRequest
      });

      // Store request ID for response matching
      (request as any)._networkRequestId = requestId;
    });

    // Listen for responses
    page.on('response', (response: Response) => {
      const request = response.request();
      const requestId = (request as any)._networkRequestId;

      if (requestId && this.networkEntries.has(requestId)) {
        const entry = this.networkEntries.get(requestId)!;
        const networkResponse: NetworkResponse = {
          id: `res_${requestId}`,
          url: response.url(),
          status: response.status(),
          statusText: response.statusText(),
          headers: response.headers(),
          timestamp: Date.now(),
          requestId: requestId
        };

        entry.response = networkResponse;
        entry.duration = networkResponse.timestamp - entry.request.timestamp;
        this.networkEntries.set(requestId, entry);
      }
    });

    // Listen for request failures
    page.on('requestfailed', (request: Request) => {
      const requestId = (request as any)._networkRequestId;
      if (requestId && this.networkEntries.has(requestId)) {
        const entry = this.networkEntries.get(requestId)!;
        entry.response = {
          id: `res_${requestId}`,
          url: request.url(),
          status: 0,
          statusText: request.failure()?.errorText || 'Request failed',
          headers: {},
          timestamp: Date.now(),
          requestId: requestId
        };
        entry.duration = entry.response.timestamp - entry.request.timestamp;
        this.networkEntries.set(requestId, entry);
      }
    });
  }

  /**
   * Execute the network inspection tool
   */
  async execute(args: any, context: ToolContext): Promise<ToolResponse> {
    const {
      action = 'get',
      filter = {},
      limit = 50,
      clear = false,
      format = 'summary'
    } = args;

    if (action === 'start') {
      return this.safeExecute(context, async (page) => {
        this.registerNetworkListeners(page);
        return createSuccessResponse("Network monitoring started. All network requests and responses will be captured.");
      });
    }

    if (action === 'stop') {
      this.isMonitoring = false;
      return createSuccessResponse("Network monitoring stopped.");
    }

    if (action === 'clear') {
      this.networkEntries.clear();
      this.requestCounter = 0;
      return createSuccessResponse("Network entries cleared.");
    }

    // Get network entries
    let entries = Array.from(this.networkEntries.values());

    // Apply filters
    if (filter.method) {
      entries = entries.filter(entry => 
        entry.request.method.toLowerCase() === filter.method.toLowerCase()
      );
    }

    if (filter.url) {
      entries = entries.filter(entry => 
        entry.request.url.includes(filter.url)
      );
    }

    if (filter.status) {
      entries = entries.filter(entry => 
        entry.response && entry.response.status === filter.status
      );
    }

    if (filter.resourceType) {
      entries = entries.filter(entry => 
        entry.request.resourceType === filter.resourceType
      );
    }

    if (filter.minDuration) {
      entries = entries.filter(entry => 
        entry.duration && entry.duration >= filter.minDuration
      );
    }

    // Sort by timestamp
    entries.sort((a, b) => a.request.timestamp - b.request.timestamp);

    // Apply limit
    if (limit > 0) {
      entries = entries.slice(-limit);
    }

    // Clear if requested
    if (clear) {
      this.networkEntries.clear();
      this.requestCounter = 0;
    }

    // Format response
    if (entries.length === 0) {
      return createSuccessResponse("No network entries matching the criteria");
    }

    if (format === 'detailed') {
      return this.formatDetailedResponse(entries);
    } else {
      return this.formatSummaryResponse(entries);
    }
  }

  /**
   * Format summary response
   */
  private formatSummaryResponse(entries: NetworkEntry[]): ToolResponse {
    const summary = entries.map(entry => {
      const status = entry.response ? entry.response.status : 'Pending';
      const duration = entry.duration ? `${entry.duration}ms` : 'N/A';
      return `${entry.request.method} ${entry.request.url} - ${status} (${duration})`;
    });

    return createSuccessResponse([
      `Retrieved ${entries.length} network entries:`,
      '',
      ...summary
    ]);
  }

  /**
   * Format detailed response
   */
  private formatDetailedResponse(entries: NetworkEntry[]): ToolResponse {
    const detailed = entries.map(entry => {
      const lines = [
        `--- Request ${entry.request.id} ---`,
        `URL: ${entry.request.url}`,
        `Method: ${entry.request.method}`,
        `Resource Type: ${entry.request.resourceType}`,
        `Timestamp: ${new Date(entry.request.timestamp).toISOString()}`,
      ];

      if (entry.request.postData) {
        lines.push(`Post Data: ${entry.request.postData.substring(0, 200)}${entry.request.postData.length > 200 ? '...' : ''}`);
      }

      if (entry.response) {
        lines.push(
          '',
          `Response Status: ${entry.response.status} ${entry.response.statusText}`,
          `Duration: ${entry.duration}ms`,
          `Response Timestamp: ${new Date(entry.response.timestamp).toISOString()}`
        );
      } else {
        lines.push('', 'Response: Pending or Failed');
      }

      lines.push('');
      return lines.join('\n');
    });

    return createSuccessResponse([
      `Retrieved ${entries.length} network entries (detailed):`,
      '',
      ...detailed
    ]);
  }

  /**
   * Get all network entries
   */
  getNetworkEntries(): NetworkEntry[] {
    return Array.from(this.networkEntries.values());
  }

  /**
   * Get network statistics
   */
  getNetworkStats(): any {
    const entries = Array.from(this.networkEntries.values());
    const completedEntries = entries.filter(entry => entry.response && entry.duration);
    
    const stats = {
      total: entries.length,
      completed: completedEntries.length,
      pending: entries.length - completedEntries.length,
      methods: {} as Record<string, number>,
      resourceTypes: {} as Record<string, number>,
      statusCodes: {} as Record<number, number>,
      averageDuration: 0
    };

    if (completedEntries.length > 0) {
      const totalDuration = completedEntries.reduce((sum, entry) => sum + (entry.duration || 0), 0);
      stats.averageDuration = Math.round(totalDuration / completedEntries.length);
    }

    entries.forEach(entry => {
      // Count methods
      stats.methods[entry.request.method] = (stats.methods[entry.request.method] || 0) + 1;
      
      // Count resource types
      stats.resourceTypes[entry.request.resourceType] = (stats.resourceTypes[entry.request.resourceType] || 0) + 1;
      
      // Count status codes
      if (entry.response) {
        stats.statusCodes[entry.response.status] = (stats.statusCodes[entry.response.status] || 0) + 1;
      }
    });

    return stats;
  }

  /**
   * Clear all network entries
   */
  clearNetworkEntries(): void {
    this.networkEntries.clear();
    this.requestCounter = 0;
  }

  /**
   * Check if monitoring is active
   */
  isNetworkMonitoring(): boolean {
    return this.isMonitoring;
  }
} 