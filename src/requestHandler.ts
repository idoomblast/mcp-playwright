import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { 
  ListResourcesRequestSchema, 
  ReadResourceRequestSchema, 
} from "@modelcontextprotocol/sdk/types.js";
import { getConsoleLogs, getScreenshots } from "./toolHandler.js";

export function setupRequestHandlers(server: McpServer) {
  // List resources handler
  server.server.setRequestHandler(ListResourcesRequestSchema, async () => ({
    resources: [
      {
        uri: "console://logs",
        mimeType: "text/plain",
        name: "Browser console logs",
      },
      ...getScreenshots().map((screenshot, index) => ({
        uri: `screenshot://${index}`,
        mimeType: screenshot.type === "image" ? screenshot.mimeType : "text/plain",
        name: `Screenshot: ${index}`,
      })),
    ],
  }));

  // Read resource handler
  server.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const uri = request.params.uri.toString();

    if (uri === "console://logs") {
      const logs = getConsoleLogs().join("\n");
      return {
        contents: [{
          uri,
          mimeType: "text/plain",
          text: logs,
        }],
      };
    }

    if (uri.startsWith("screenshot://")) {
      const name = uri.split("://")[1];
      const index = Number(name);
      const screenshots = getScreenshots();
      const screenshot = screenshots[index];
      if (screenshot && screenshot.type === "image") {
        return {
          contents: [{
            uri,
            mimeType: screenshot.mimeType ?? "image/png",
            blob: screenshot.data,
          }],
        };
      }
    }

    throw new Error(`Resource not found: ${uri}`);
  });
}