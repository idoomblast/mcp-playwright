import { z } from "zod";
import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import { codegenTools } from './tools/codegen';

export function createToolDefinitions() {
  return [
    {
      name: "playwright_navigate",
      description: "Navigate to a URL. ⚠️ CRITICAL: After navigating, NEVER assume what's on the page. ALWAYS use `playwright_get_visible_text` or `playwright_get_visible_html` immediately to view the ACTUAL page content. Without reading the content, you will be unable to perform accurate actions on the page. The browser will NOT output content automatically - you must explicitly request it.",
      inputSchema: z.object({
        url: z.string().describe("URL to navigate to the website specified"),
        browserType: z.enum(["chromium", "firefox", "webkit"]).describe("Browser type to use (chromium, firefox, webkit). Defaults to chromium").optional().default('chromium'),
        width: z.number().describe("Viewport width in pixels (default: 1280)").optional().default(1280),
        height: z.number().describe("Viewport height in pixels (default: 720)").optional().default(720),
        timeout: z.number().describe("Navigation timeout in milliseconds").optional(),
        waitUntil: z.string().describe("Navigation wait condition").optional(),
        headless: z.boolean().describe("Run browser in headless mode (default: false)").optional().default(false),
        acceptInsecureCerts: z.boolean().describe("Accept insecure/self-signed certificates (default: true)").optional().default(true),
        ignoreHTTPSErrors: z.boolean().describe("Ignore HTTPS errors (default: true)").optional().default(true),
        proxy: z.object({
          server: z.string().describe("Proxy server URL (e.g., http://proxy.server:8080)").optional(),
          username: z.string().describe("Username for proxy authentication (optional)").optional(),
          password: z.string().describe("Password for proxy authentication (optional)").optional()
        }).describe("Proxy configuration for browser").optional().default(undefined),
        userDataDir: z.string().describe("Path to user data directory for persistent browser profile (optional)").optional()
      })
    },
    {
      name: "playwright_screenshot",
      description: "Take a screenshot of the current page or a specific element. Use this for visual testing, debugging layout issues, documenting test results, or capturing page states. Useful for: regression testing, cross-browser comparison, responsive layout verification, and providing visual evidence of test failures.",
      inputSchema: z.object({
        name: z.string().describe("Name for the screenshot"),
        selector: z.string().describe("CSS selector for element to screenshot").optional(),
        width: z.number().describe("Width in pixels (default: 800)").optional().default(800),
        height: z.number().describe("Height in pixels (default: 600)").optional().default(600),
        fullPage: z.boolean().describe("Store screenshot of the entire page (default: false)").optional().default(false)
      })
    },
    {
      name: "playwright_click",
      description: "Click an element on the page. ⚠️ CRITICAL: After clicking, ALWAYS use `playwright_get_visible_text` or `playwright_get_visible_html` to view the ACTUAL updated page content. Never assume what happened or what content changed - you MUST read the page to confirm the action's effect.",
      inputSchema: z.object({
        selector: z.string().describe("CSS selector for the element to click")
      })
    },
    {
      name: "playwright_iframe_click",
      description: "Click an element in an iframe on the page",
      inputSchema: z.object({
        iframeSelector: z.string().describe("CSS selector for the iframe containing the element to click"),
        selector: z.string().describe("CSS selector for the element to click")
      })
    },
    {
      name: "playwright_iframe_fill",
      description: "Fill an element in an iframe on the page",
      inputSchema: z.object({
        iframeSelector: z.string().describe("CSS selector for the iframe containing the element to fill"),
        selector: z.string().describe("CSS selector for the element to fill"),
        value: z.string().describe("Value to fill")
      })
    },
    {
      name: "playwright_fill",
      description: "fill out an input field",
      inputSchema: z.object({
        selector: z.string().describe("CSS selector for input field"),
        value: z.string().describe("Value to fill")
      })
    },
    {
      name: "playwright_select",
      description: "Select an element on the page with Select tag",
      inputSchema: z.object({
        selector: z.string().describe("CSS selector for element to select"),
        value: z.string().describe("Value to select")
      })
    },
    {
      name: "playwright_hover",
      description: "Hover an element on the page",
      inputSchema: z.object({
        selector: z.string().describe("CSS selector for element to hover")
      })
    },
    {
      name: "playwright_upload_file",
      description: "Upload a file to an input[type='file'] element on the page. IMPORTANT: The filePath parameter requires an ABSOLUTE path to the file that exists on the system. Use this for automating file upload processes in forms, testing file upload functionality, or validating file validation logic. Common use cases: profile picture uploads, document submission, attachment testing.",
      inputSchema: z.object({
        selector: z.string().describe("CSS selector for the file input element"),
        filePath: z.string().describe("Absolute path to the file to upload")
      })
    },
    {
      name: "playwright_evaluate",
      description: "⚠️ DEVELOPMENT ONLY: Execute JavaScript in the browser console. This tool is strictly for debugging and development purposes only. Real-world applications and end users will NEVER use this tool. It should ONLY be used during the development phase for testing and debugging purposes. If you need to view page content, use `playwright_get_visible_text` or `playwright_get_visible_html` instead.",
      inputSchema: z.object({
        script: z.string().describe("JavaScript code to execute")
      })
    },
    {
      name: "playwright_console_logs",
      description: "⚠️ DEVELOPMENT ONLY: Retrieve console logs from the browser with filtering options. This tool is strictly for debugging and development purposes only. Real-world applications and end users will NEVER use this tool. It should ONLY be used during the development phase for testing, debugging JavaScript errors, and monitoring browser console output.",
      inputSchema: z.object({
        type: z.enum(["all", "error", "warning", "log", "info", "debug", "exception"]).describe("Type of logs to retrieve (all, error, warning, log, info, debug, exception)").optional().default('all'),
        search: z.string().describe("Text to search for in logs (handles text with square brackets)").optional(),
        limit: z.number().describe("Maximum number of logs to return (default: 50)").optional().default(50),
        maxLength: z.number().describe("Maximum length for each log message before truncation").optional(),
        group: z.boolean().describe("Group identical log messages and show a count (default: false)").optional().default(false),
        clear: z.boolean().describe("Whether to clear logs after retrieval (default: false)").optional().default(false)
      })
    },
    {
      name: "playwright_network_inspection",
      description: "⚠️ DEVELOPMENT ONLY: Monitor and inspect network traffic in the browser. This tool is strictly for debugging and development purposes only. Real-world applications and end users will NEVER use this tool. It should ONLY be used during the development phase for testing, debugging API calls, monitoring network requests/responses, and analyzing performance issues.",
      inputSchema: z.object({
        action: z.enum(["start", "stop", "get", "clear"]).describe("Action to perform (start, stop, get, clear)").optional(),
        filter: z.object({
          method: z.string().describe("Filter by HTTP method (GET, POST, PUT, DELETE, etc.)").optional(),
          url: z.string().describe("Filter by URL pattern (partial match)").optional(),
          status: z.number().describe("Filter by HTTP status code").optional(),
          resourceType: z.string().describe("Filter by resource type (document, stylesheet, script, xhr, fetch, etc.)").optional(),
          minDuration: z.number().describe("Filter by minimum request duration in milliseconds").optional()
        }).describe("Filter criteria for network entries").optional(),
        limit: z.number().describe("Maximum number of network entries to return (default: 50)").optional().default(50),
        clear: z.boolean().describe("Whether to clear network entries after retrieval (default: false)").optional().default(false),
        format: z.enum(["summary", "detailed"]).describe("Output format (summary or detailed)").optional()
      })
    },
    {
      name: "playwright_close",
      description: "Close the browser and release all resources",
      inputSchema: z.object({})
    },
    {
      name: "playwright_get",
      description: "Perform an HTTP GET request DIRECTLY without browser. ⚠️ NOTE: This makes a DIRECT HTTP request like curl or Postman - does NOT require a browser session. Use this for testing APIs directly, fetching data, or making HTTP requests. If you need to test HTTP responses TRIGGERED by browser UI actions (click, form submit, etc.), use `playwright_expect_response` + `playwright_assert_response` instead.",
      inputSchema: z.object({
        url: z.string().describe("URL to perform GET operation")
      })
    },
    {
      name: "playwright_post",
      description: "Perform an HTTP POST request DIRECTLY without browser. ⚠️ NOTE: This makes a DIRECT HTTP request like curl or Postman - does NOT require a browser session. Use this for testing APIs directly, sending data to servers, or making HTTP requests. If you need to test HTTP responses TRIGGERED by browser UI actions (form submit, button click, etc.), use `playwright_expect_response` + `playwright_assert_response` instead.",
      inputSchema: z.object({
        url: z.string().describe("URL to perform POST operation"),
        value: z.string().describe("Data to post in the body"),
        token: z.string().describe("Bearer token for authorization").optional(),
        headers: z.record(z.string()).describe("Additional headers to include in the request").optional()
      })
    },
    {
      name: "playwright_put",
      description: "Perform an HTTP PUT request DIRECTLY without browser. ⚠️ NOTE: This makes a DIRECT HTTP request like curl or Postman - does NOT require a browser session. Use this for testing APIs directly, updating data on servers, or making HTTP requests. If you need to test HTTP responses TRIGGERED by browser UI actions, use `playwright_expect_response` + `playwright_assert_response` instead.",
      inputSchema: z.object({
        url: z.string().describe("URL to perform PUT operation"),
        value: z.string().describe("Data to PUT in the body")
      })
    },
    {
      name: "playwright_patch",
      description: "Perform an HTTP PATCH request DIRECTLY without browser. ⚠️ NOTE: This makes a DIRECT HTTP request like curl or Postman - does NOT require a browser session. Use this for testing APIs directly, partially updating data on servers, or making HTTP requests. If you need to test HTTP responses TRIGGERED by browser UI actions, use `playwright_expect_response` + `playwright_assert_response` instead.",
      inputSchema: z.object({
        url: z.string().describe("URL to perform PATCH operation"),
        value: z.string().describe("Data to PATCH in the body")
      })
    },
    {
      name: "playwright_delete",
      description: "Perform an HTTP DELETE request DIRECTLY without browser. ⚠️ NOTE: This makes a DIRECT HTTP request like curl or Postman - does NOT require a browser session. Use this for testing APIs directly, deleting data from servers, or making HTTP requests. If you need to test HTTP responses TRIGGERED by browser UI actions, use `playwright_expect_response` + `playwright_assert_response` instead.",
      inputSchema: z.object({
        url: z.string().describe("URL to perform DELETE operation")
      })
    },
    {
      name: "playwright_expect_response",
      description: "Ask Playwright to start waiting for an HTTP response TRIGGERED BY BROWSER ACTIONS. ⚠️ IMPORTANT: This is DIFFERENT from API tools like `playwright_get`/`playwright_post`. Use this tool to MONITOR/INTERCEPT HTTP responses that are TRIGGERED by user actions in the browser (e.g., clicking a button, submitting a form, loading data via AJAX). You MUST have an active browser session. Workflow: 1) Call this tool BEFORE the action, 2) Perform the user action, 3) Use `playwright_assert_response` to wait and validate the response. Common use cases: testing form submissions, monitoringXHR/Fetch requests, validating SPA API calls triggered by UI interactions, testing async loading states.",
      inputSchema: z.object({
        id: z.string().describe("Unique & arbitrary identifier to be used for retrieving this response later with `Playwright_assert_response`."),
        url: z.string().describe("URL pattern to match in the response.")
      })
    },
    {
      name: "playwright_assert_response",
      description: "Wait for and validate a previously initiated HTTP response MONITOR from browser actions. ⚠️ IMPORTANT: This is DIFFERENT from API tools like `playwright_get`/`playwright_post`. Use this tool ONLY after calling `playwright_expect_response` and performing the browser action that TRIGGERED the HTTP request (e.g., clicking a submit button, filling and submitting a form). This tool waits for the response to arrive from the browser's network stack and optionally validates the response body content. You MUST have an active browser session. Common use cases: validating form submission responses, checking API success/failure status from UI-triggered calls, testing SPA data fetch operations, validating async network requests.",
      inputSchema: z.object({
        id: z.string().describe("Identifier of the HTTP response initially expected using `Playwright_expect_response`."),
        value: z.string().describe("Data to expect in the body of the HTTP response. If provided, the assertion will fail if this value is not found in the response body.").optional()
      })
    },
    {
      name: "playwright_custom_user_agent",
      description: "Set a custom User Agent for the browser. Use this to simulate different browsers/devices (e.g., mobile devices, desktop browsers, bots), test responsive layouts, or bypass bot detection. Common use cases: testing mobile view validation, emulating specific browser versions, spoofing user agents for testing purposes.",
      inputSchema: z.object({
        userAgent: z.string().describe("Custom User Agent for the Playwright browser instance")
      })
    },
    {
      name: "playwright_get_visible_text",
      description: "Get the visible text content of the current page. ⚠️ CRITICAL: ALWAYS use this tool after navigating to a page or performing any action to see the ACTUAL content. NEVER assume or hallucinate about page content - you MUST read the actual page content using this tool. This is your primary way to understand what's on the page. After any `playwright_navigate`, `playwright_click`, `playwright_click_and_switch_tab`, or any action that might change the page content, immediately use this tool to view the updated content.",
      inputSchema: z.object({})
    },
    {
      name: "playwright_get_visible_html",
      description: "Get the HTML content of the current page. By default, all <script> tags are removed from the output unless removeScripts is explicitly set to false. ⚠️ CRITICAL: ALWAYS use this tool after navigating to a page or performing any action to see the ACTUAL HTML structure and content. NEVER assume or hallucinate about page elements, attributes, or structure - you MUST read the actual HTML using this tool. This is essential for understanding page structure, finding correct selectors, and verifying element existence. After any `playwright_navigate`, `playwright_click`, `playwright_click_and_switch_tab`, or any action that might change the page, immediately use this tool to view the updated HTML.",
      inputSchema: z.object({
        selector: z.string().describe("CSS selector to limit the HTML to a specific container").optional(),
        removeScripts: z.boolean().describe("Remove all script tags from the HTML (default: true)").optional().default(true),
        removeComments: z.boolean().describe("Remove all HTML comments (default: false)").optional().default(false),
        removeStyles: z.boolean().describe("Remove all style tags from the HTML (default: false)").optional().default(false),
        removeMeta: z.boolean().describe("Remove all meta tags from the HTML (default: false)").optional().default(false),
        cleanHtml: z.boolean().describe("Perform comprehensive HTML cleaning (default: false)").optional().default(false),
        minify: z.boolean().describe("Minify the HTML output (default: false)").optional().default(false),
        maxLength: z.number().describe("Maximum number of characters to return (default: 20000)").optional().default(20000)
      })
    },
    {
      name: "playwright_go_back",
      description: "Navigate back in browser history",
      inputSchema: z.object({})
    },
    {
      name: "playwright_go_forward",
      description: "Navigate forward in browser history",
      inputSchema: z.object({})
    },
    {
      name: "playwright_drag",
      description: "Drag an element to a target location. Use this for testing drag-and-drop functionality, reordering items, moving elements, or testing interactive UI components that require dragging. Common use cases: list reordering, dashboard widget placement, file drop zones, map markers, carousel interactions, kanban board card movement.",
      inputSchema: z.object({
        sourceSelector: z.string().describe("CSS selector for the element to drag"),
        targetSelector: z.string().describe("CSS selector for the target location")
      })
    },
    {
      name: "playwright_press_key",
      description: "Press a keyboard key. Use this for keyboard navigation, form submission, shortcut testing, text editing, or triggering keyboard-based interactions. Common use cases: submitting forms (Enter), navigation (Arrow keys), combo testing (Ctrl+C, Cmd+V), accessibility testing, keyboard shortcuts validation.",
      inputSchema: z.object({
        key: z.string().describe("Key to press (e.g. 'Enter', 'ArrowDown', 'a')"),
        selector: z.string().describe("Optional CSS selector to focus before pressing key").optional()
      })
    },
    {
      name: "playwright_save_as_pdf",
      description: "Save the current page as a PDF file. Use this for generating PDF reports, preserving page content for documentation, creating printable versions of dynamic content, or archiving page states. Common use cases: reporting automation, invoice generation, certificate creation, content archiving, document export functionality testing.",
      inputSchema: z.object({
        outputPath: z.string().describe("Directory path where PDF will be saved"),
        filename: z.string().describe("Name of the PDF file (default: page.pdf)").optional().default('page.pdf'),
        format: z.string().describe("Page format (e.g. 'A4', 'Letter')").optional(),
        printBackground: z.boolean().describe("Whether to print background graphics").optional().default(false),
        margin: z.object({
          top: z.string().optional(),
          right: z.string().optional(),
          bottom: z.string().optional(),
          left: z.string().optional()
        }).describe("Page margins").optional()
      })
    },
    {
      name: "playwright_click_and_switch_tab",
      description: "Click a link and switch to the newly opened tab. ⚠️ CRITICAL: After switching to the new tab, ALWAYS use `playwright_get_visible_text` or `playwright_get_visible_html` immediately to view the ACTUAL content of the new page. Never assume what's on the page - you MUST read the content to understand the new context. Use this for testing flows that open new tabs/windows, handling multi-tab interactions, or validating navigation to external pages. Common use cases: testing 'open in new tab' links, modal interactions, pop-up windows, external redirect validation, multi-page workflows.",
      inputSchema: z.object({
        selector: z.string().describe("CSS selector for the link to click")
      })
    },
    {
      name: "playwright_resize",
      description: "Resize the browser viewport to test responsive layouts without closing and reopening the browser. Use this for testing how pages behave at different screen sizes, validating mobile/tablet/desktop views, debugging CSS media queries, and responsive design testing. Common use cases: mobile view validation, tablet testing, desktop layout verification, breakpoint testing, responsive UX validation.",
      inputSchema: z.object({
        width: z.number().describe("New viewport width in pixels"),
        height: z.number().describe("New viewport height in pixels")
      })
    },
    // Codegen tools
    {
      name: "start_codegen_session",
      description: "⚠️ DEVELOPMENT ONLY: Start a new code generation session to record Playwright actions. This tool is strictly for development and testing purposes only. Real-world applications and end users will NEVER use this tool. It should ONLY be used during the development phase to generate test automation code by recording browser interactions.",
      inputSchema: z.object({
        options: z.object({
          outputPath: z.string().describe("Directory path where generated tests will be saved (use absolute path)"),
          testNamePrefix: z.string().describe("Prefix to use for generated test names (default: 'GeneratedTest')").optional().default('GeneratedTest'),
          includeComments: z.boolean().describe("Whether to include descriptive comments in generated tests").optional().default(false)
        }).describe("Code generation options")
      })
    },
    {
      name: "end_codegen_session",
      description: "⚠️ DEVELOPMENT ONLY: End a code generation session and generate the test file. This tool is strictly for development and testing purposes only. Real-world applications and end users will NEVER use this tool. It should ONLY be used during the development phase to finalize and generate test automation code from a recorded session.",
      inputSchema: z.object({
        sessionId: z.string().describe("ID of the session to end")
      })
    },
    {
      name: "get_codegen_session",
      description: "⚠️ DEVELOPMENT ONLY: Get information about a code generation session. This tool is strictly for development and testing purposes only. Real-world applications and end users will NEVER use this tool. It should ONLY be used during the development phase to retrieve recorded actions and session metadata for debugging or reviewing test generation.",
      inputSchema: z.object({
        sessionId: z.string().describe("ID of the session to retrieve")
      })
    },
    {
      name: "clear_codegen_session",
      description: "⚠️ DEVELOPMENT ONLY: Clear a code generation session without generating a test. This tool is strictly for development and testing purposes only. Real-world applications and end users will NEVER use this tool. It should ONLY be used during the development phase to discard recorded actions and clean up session data when needed.",
      inputSchema: z.object({
        sessionId: z.string().describe("ID of the session to clear")
      })
    }
  ] as const;
}

// Browser-requiring tools for conditional browser launch
export const BROWSER_TOOLS = [
  "playwright_navigate",
  "playwright_resize",
  "playwright_screenshot",
  "playwright_click",
  "playwright_iframe_click",
  "playwright_iframe_fill",
  "playwright_fill",
  "playwright_select",
  "playwright_hover",
  "playwright_upload_file",
  "playwright_evaluate",
  "playwright_console_logs",
  "playwright_network_inspection",
  "playwright_close",
  "playwright_expect_response",
  "playwright_assert_response",
  "playwright_custom_user_agent",
  "playwright_get_visible_text",
  "playwright_get_visible_html",
  "playwright_go_back",
  "playwright_go_forward",
  "playwright_drag",
  "playwright_press_key",
  "playwright_save_as_pdf",
  "playwright_click_and_switch_tab"
];

// API Request tools for conditional launch
export const API_TOOLS = [
  "playwright_get",
  "playwright_post",
  "playwright_put",
  "playwright_delete",
  "playwright_patch"
];

// Codegen tools
export const CODEGEN_TOOLS = [
  'start_codegen_session',
  'end_codegen_session',
  'get_codegen_session',
  'clear_codegen_session'
];

// All available tools
export const tools = [
  ...BROWSER_TOOLS,
  ...API_TOOLS,
  ...CODEGEN_TOOLS
];
