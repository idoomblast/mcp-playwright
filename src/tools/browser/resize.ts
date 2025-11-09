import { BrowserToolBase } from './base.js';
import { ToolContext, ToolResponse, createSuccessResponse, createErrorResponse } from '../common/types.js';

/**
 * Tool for resizing the browser viewport
 */
export class ResizeTool extends BrowserToolBase {
  /**
   * Execute the resize tool
   */
  async execute(args: any, context: ToolContext): Promise<ToolResponse> {
    // Validate input parameters
    if (typeof args.width !== 'number' || args.width <= 0) {
      return createErrorResponse("Width must be a positive number");
    }

    if (typeof args.height !== 'number' || args.height <= 0) {
      return createErrorResponse("Height must be a positive number");
    }

    return this.safeExecute(context, async (page) => {
      try {
        await page.setViewportSize({
          width: args.width,
          height: args.height
        });

        return createSuccessResponse(`Viewport resized to ${args.width}x${args.height} pixels`);
      } catch (error) {
        const errorMessage = (error as Error).message;
        return createErrorResponse(`Failed to resize viewport: ${errorMessage}`);
      }
    });
  }
}