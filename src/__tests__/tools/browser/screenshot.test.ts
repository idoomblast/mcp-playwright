import { ScreenshotTool } from '../../../tools/browser/screenshot.js';
import { ToolContext } from '../../../tools/common/types.js';
import { Page, Browser } from 'playwright';
import { jest } from '@jest/globals';
import fs from 'node:fs';
import path from 'node:path';

// Mock fs module
jest.mock('node:fs', () => ({
  existsSync: jest.fn().mockReturnValue(true),
  mkdirSync: jest.fn(),
  writeFileSync: jest.fn()
}));

// Mock the Page object
const mockScreenshot = jest.fn().mockImplementation(() => 
  Promise.resolve(Buffer.from('mock-screenshot')));

const mockLocatorScreenshot = jest.fn().mockImplementation(() => 
  Promise.resolve(Buffer.from('mock-element-screenshot')));

const mockElementHandle = {
  screenshot: mockLocatorScreenshot
};

const mockElement = jest.fn().mockImplementation(() => Promise.resolve(mockElementHandle));

const mockLocator = jest.fn().mockReturnValue({
  screenshot: mockLocatorScreenshot
});

const mockIsClosed = jest.fn().mockReturnValue(false);
const mockPage = {
  screenshot: mockScreenshot,
  locator: mockLocator,
  $: mockElement,
  isClosed: mockIsClosed
} as unknown as Page;

// Mock browser
const mockIsConnected = jest.fn().mockReturnValue(true);
const mockBrowser = {
  isConnected: mockIsConnected
} as unknown as Browser;

// Mock the server
const mockServer = {
  sendMessage: jest.fn(),
  notification: jest.fn()
};

// Mock context
const mockContext = {
  page: mockPage,
  browser: mockBrowser,
  server: mockServer
} as ToolContext;

describe('ScreenshotTool', () => {
  let screenshotTool: ScreenshotTool;

  beforeEach(() => {
    jest.clearAllMocks();
    screenshotTool = new ScreenshotTool(mockServer);
    
    // Mock Date to return a consistent value for testing
    jest.spyOn(global.Date.prototype, 'toISOString').mockReturnValue('2023-01-01T12:00:00.000Z');
    (fs.existsSync as jest.Mock).mockReturnValue(true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('should take a full page screenshot', async () => {
    const args = {
      name: 'test-screenshot',
      fullPage: true
    };

    // Return a buffer for the screenshot
    const screenshotBuffer = Buffer.from('mock-screenshot');
    mockScreenshot.mockImplementationOnce(() => Promise.resolve(screenshotBuffer));

    const result = await screenshotTool.execute(args, mockContext);

    // Check if screenshot was called with correct options
    expect(mockScreenshot).toHaveBeenCalledWith(expect.objectContaining({ 
      fullPage: true,
      type: 'png'
    }));
    
    // Check that the result contains success message
    expect(result.isError).toBe(false);
    expect((result.content[0] as { text: string }).text).toContain('Screenshot taken');
    expect((result.content[1] as { type: string }).type).toBe('image');
    expect((result.content[1] as any).data).toBe('bW9jay1zY3JlZW5zaG90');
  });

  test('should handle element screenshot', async () => {
    const args = {
      name: 'test-element-screenshot',
      selector: '#test-element'
    };

    // Return a buffer for the screenshot
    const screenshotBuffer = Buffer.from('mock-element-screenshot');
    mockLocatorScreenshot.mockImplementationOnce(() => Promise.resolve(screenshotBuffer));

    const result = await screenshotTool.execute(args, mockContext);

    // Check that the result data contains the element screenshot
    expect(result.isError).toBe(false);
    expect((result.content[0] as { text: string }).text).toContain('Screenshot taken');
    expect((result.content[1] as { type: string }).type).toBe('image');
    expect((result.content[1] as any).data).toBe('bW9jay1zY3JlZW5zaG90');
  });

  test('should handle screenshot errors', async () => {
    const args = {
      name: 'test-screenshot'
    };

    // Mock a screenshot error
    mockScreenshot.mockImplementationOnce(() => Promise.reject(new Error('Screenshot failed')));

    const result = await screenshotTool.execute(args, mockContext);

    expect(mockScreenshot).toHaveBeenCalled();
    expect(result.isError).toBe(true);
    expect((result.content[0] as { text: string }).text).toContain('Operation failed');
  });

  test('should handle missing page', async () => {
    const args = {
      name: 'test-screenshot'
    };

    // Context without page but with browser
    const contextWithoutPage = {
      browser: mockBrowser,
      server: mockServer
    } as unknown as ToolContext;

    const result = await screenshotTool.execute(args, contextWithoutPage);

    expect(mockScreenshot).not.toHaveBeenCalled();
    expect(result.isError).toBe(true);
    expect((result.content[0] as { text: string }).text).toContain('Browser page not initialized');
  });

  test('should store screenshots in a collection', async () => {
    const args = {
      name: 'test-screenshot',
      storeBase64: true
    };

    // Return a buffer for the screenshot
    const screenshotBuffer = Buffer.from('mock-screenshot');
    mockScreenshot.mockImplementationOnce(() => Promise.resolve(screenshotBuffer));

    await screenshotTool.execute(args, mockContext);
    
    // Check that the screenshot was stored in the screenshots collection
    const screenshots = screenshotTool.getScreenshots();
    expect(Array.isArray(screenshots)).toBe(true);
    expect(screenshots.some(s => (s as any).type === 'image' && (s as any).data === 'bW9jay1zY3JlZW5zaG90')).toBe(true);
  });

  test('should take a screenshot with specific browser type', async () => {
    const args = {
      name: 'browser-type-test',
      browserType: 'firefox'
    };

    // Execute with browser type
    const result = await screenshotTool.execute(args, mockContext);
    
    expect(mockScreenshot).toHaveBeenCalled();
    expect(result.isError).toBe(false);
    expect((result.content[0] as { type: string }).type).toContain('text');
    expect((result.content[0] as { text: string }).text).toContain('Screenshot taken');
    expect((result.content[1] as { type: string }).type).toBe('image');
    
  });
}); 