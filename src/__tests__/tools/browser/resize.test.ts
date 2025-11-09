import { ResizeTool } from '../../../tools/browser/resize.js';
import { ToolContext } from '../../../tools/common/types.js';
import { Page, Browser } from 'playwright';
import { jest } from '@jest/globals';

// Mock the Page object
const mockSetViewportSize = jest.fn();
mockSetViewportSize.mockImplementation(() => Promise.resolve());
const mockIsClosed = jest.fn().mockReturnValue(false);

const mockPage = {
  setViewportSize: mockSetViewportSize,
  isClosed: mockIsClosed
} as unknown as Page;

// Mock the browser
const mockIsConnected = jest.fn().mockReturnValue(true);
const mockBrowser = {
  isConnected: mockIsConnected
} as unknown as Browser;

// Mock the server
const mockServer = {
  sendMessage: jest.fn()
};

// Mock context
const mockContext = {
  page: mockPage,
  browser: mockBrowser,
  server: mockServer
} as ToolContext;

describe('ResizeTool', () => {
  let resizeTool: ResizeTool;

  beforeEach(() => {
    jest.clearAllMocks();
    resizeTool = new ResizeTool(mockServer);
    // Reset mocks
    mockIsConnected.mockReturnValue(true);
    mockIsClosed.mockReturnValue(false);
  });

  test('should resize viewport to specified dimensions', async () => {
    const args = {
      width: 1920,
      height: 1080
    };

    const result = await resizeTool.execute(args, mockContext);

    expect(mockSetViewportSize).toHaveBeenCalledWith({
      width: 1920,
      height: 1080
    });
    expect(result.isError).toBe(false);
    expect(result.content[0].text).toContain('Viewport resized to 1920x1080 pixels');
  });

  test('should handle mobile viewport size', async () => {
    const args = {
      width: 375,
      height: 667
    };

    const result = await resizeTool.execute(args, mockContext);

    expect(mockSetViewportSize).toHaveBeenCalledWith({
      width: 375,
      height: 667
    });
    expect(result.isError).toBe(false);
    expect(result.content[0].text).toContain('Viewport resized to 375x667 pixels');
  });

  test('should handle tablet viewport size', async () => {
    const args = {
      width: 768,
      height: 1024
    };

    const result = await resizeTool.execute(args, mockContext);

    expect(mockSetViewportSize).toHaveBeenCalledWith({
      width: 768,
      height: 1024
    });
    expect(result.isError).toBe(false);
    expect(result.content[0].text).toContain('Viewport resized to 768x1024 pixels');
  });

  test('should reject invalid width', async () => {
    const args = {
      width: 0,
      height: 800
    };

    const result = await resizeTool.execute(args, mockContext);

    expect(mockSetViewportSize).not.toHaveBeenCalled();
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Width must be a positive number');
  });

  test('should reject invalid height', async () => {
    const args = {
      width: 1200,
      height: -100
    };

    const result = await resizeTool.execute(args, mockContext);

    expect(mockSetViewportSize).not.toHaveBeenCalled();
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Height must be a positive number');
  });

  test('should reject non-numeric width', async () => {
    const args = {
      width: 'invalid',
      height: 800
    };

    const result = await resizeTool.execute(args, mockContext);

    expect(mockSetViewportSize).not.toHaveBeenCalled();
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Width must be a positive number');
  });

  test('should reject non-numeric height', async () => {
    const args = {
      width: 1200,
      height: 'invalid'
    };

    const result = await resizeTool.execute(args, mockContext);

    expect(mockSetViewportSize).not.toHaveBeenCalled();
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Height must be a positive number');
  });

  test('should handle resize errors', async () => {
    const args = {
      width: 1920,
      height: 1080
    };

    // Mock a resize error
    mockSetViewportSize.mockImplementationOnce(() => Promise.reject(new Error('Resize failed')));

    const result = await resizeTool.execute(args, mockContext);

    expect(mockSetViewportSize).toHaveBeenCalledWith({
      width: 1920,
      height: 1080
    });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Failed to resize viewport: Resize failed');
  });
});