import fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import type { Page } from 'playwright';
import { BrowserToolBase } from './base.js';
import { ToolContext, ToolResponse } from '../common/types.js';
import type { TextContent, ImageContent } from '@modelcontextprotocol/sdk/types.js';
const defaultDownloadsPath = path.join(os.homedir(), 'Downloads');

/**
 * Tool for taking screenshots of pages or elements
 */
export class ScreenshotTool extends BrowserToolBase {
  private screenshots: (TextContent | ImageContent)[] = [];

  /**
   * Execute the screenshot tool
   */
  async execute(args: any, context: ToolContext): Promise<ToolResponse> {
    return this.safeExecute(context, async (page) => {
      const screenshotOptions: any = {
        type: args.type || "png",
        fullPage: !!args.fullPage
      };

      if (args.selector) {
        const element = await page.$(args.selector);
        if (!element) {
          return {
            content: [{
              type: "text",
              text: `Element not found: ${args.selector}`,
            }],
            isError: true
          };
        }
        screenshotOptions.element = element;
      }

      // Generate output path
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `${args.name || 'screenshot'}-${timestamp}.png`;
      const downloadsDir = args.downloadsDir || defaultDownloadsPath;

      if (!fs.existsSync(downloadsDir)) {
        fs.mkdirSync(downloadsDir, { recursive: true });
      }

      const screenshot = await page.screenshot(screenshotOptions);
      const base64Screenshot = screenshot.toString('base64');
      const content = {
          type: "image",
          data: `${base64Screenshot}`,
          mimeType: "image/png",
          metadata: {
            name: filename || 'screenshot',
            description: `${filename} taken at ${new Date().toISOString()}`,
            source: "screenshot_tool",
            encoding: "base64"
          }
        } as ImageContent;
      this.screenshots.push(content);
      this.server.notification({
        method: "notifications/resources/list_changed",
      });
      //return createSuccessResponse(`base64image: "data:image/png;base64,${base64Screenshot}"`);
      const message: TextContent = {
        type: "text",
        text: `Screenshot taken: ${filename}`,
      };
      return {
        content: [message,content],
        isError: false
      };
    });
  }

  /**
   * Get all stored screenshots
   */
  getScreenshots(): (TextContent | ImageContent)[] {
    return this.screenshots;
  }
} 