import { ensureBrowser, resetBrowserState } from '../toolHandler';
import { chromium, firefox, webkit } from 'playwright';

// Mock the browser modules
jest.mock('playwright', () => ({
  chromium: {
    launch: jest.fn()
  },
  firefox: {
    launch: jest.fn()
  },
  webkit: {
    launch: jest.fn()
  }
}));

const mockBrowser = {
  isConnected: jest.fn().mockReturnValue(true),
  on: jest.fn(),
  newContext: jest.fn().mockResolvedValue({
    newPage: jest.fn().mockResolvedValue({
      on: jest.fn(),
      addInitScript: jest.fn(),
      isClosed: jest.fn().mockReturnValue(false),
      bringToFront: jest.fn()
    })
  }),
  close: jest.fn(),
  contexts: jest.fn().mockReturnValue([])
};

describe('SSL/TLS Configuration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetBrowserState();
    
    // Setup default mock implementations
    (chromium.launch as jest.Mock).mockResolvedValue(mockBrowser);
    (firefox.launch as jest.Mock).mockResolvedValue(mockBrowser);
    (webkit.launch as jest.Mock).mockResolvedValue(mockBrowser);
  });

  afterEach(() => {
    resetBrowserState();
  });

  describe('Accept Insecure Certificates', () => {
    it('should launch browser with acceptInsecureCerts option', async () => {
      await ensureBrowser({
        acceptInsecureCerts: true,
        browserType: 'chromium',
        headless: true
      });

      expect(chromium.launch).toHaveBeenCalledWith({
        headless: true,
        executablePath: undefined,
        acceptInsecureCerts: true
      });
    });

    it('should launch Firefox with acceptInsecureCerts option', async () => {
      await ensureBrowser({
        acceptInsecureCerts: true,
        browserType: 'firefox',
        headless: true
      });

      expect(firefox.launch).toHaveBeenCalledWith({
        headless: true,
        executablePath: undefined,
        acceptInsecureCerts: true
      });
    });

    it('should launch WebKit with acceptInsecureCerts option', async () => {
      await ensureBrowser({
        acceptInsecureCerts: true,
        browserType: 'webkit',
        headless: true
      });

      expect(webkit.launch).toHaveBeenCalledWith({
        headless: true,
        executablePath: undefined,
        acceptInsecureCerts: true
      });
    });

    it('should not include acceptInsecureCerts when false', async () => {
      await ensureBrowser({
        acceptInsecureCerts: false,
        browserType: 'chromium',
        headless: true
      });

      expect(chromium.launch).toHaveBeenCalledWith({
        headless: true,
        executablePath: undefined
      });
    });
  });

  describe('Ignore HTTPS Errors', () => {
    it('should create context with ignoreHTTPSErrors option', async () => {
      await ensureBrowser({
        ignoreHTTPSErrors: true,
        browserType: 'chromium',
        headless: true
      });

      expect(mockBrowser.newContext).toHaveBeenCalledWith({
        viewport: {
          width: 1280,
          height: 720,
        },
        deviceScaleFactor: 1,
        ignoreHTTPSErrors: true,
      });
    });

    it('should create context without ignoreHTTPSErrors when false', async () => {
      await ensureBrowser({
        ignoreHTTPSErrors: false,
        browserType: 'chromium',
        headless: true
      });

      expect(mockBrowser.newContext).toHaveBeenCalledWith({
        viewport: {
          width: 1280,
          height: 720,
        },
        deviceScaleFactor: 1,
        ignoreHTTPSErrors: false,
      });
    });
  });

  describe('Combined SSL/TLS Options', () => {
    it('should handle both acceptInsecureCerts and ignoreHTTPSErrors', async () => {
      await ensureBrowser({
        acceptInsecureCerts: true,
        ignoreHTTPSErrors: true,
        browserType: 'chromium',
        headless: true
      });

      expect(chromium.launch).toHaveBeenCalledWith({
        headless: true,
        executablePath: undefined,
        acceptInsecureCerts: true
      });

      expect(mockBrowser.newContext).toHaveBeenCalledWith({
        viewport: {
          width: 1280,
          height: 720,
        },
        deviceScaleFactor: 1,
        ignoreHTTPSErrors: true,
      });
    });

    it('should combine SSL options with proxy configuration', async () => {
      const proxyConfig = {
        server: 'http://proxy.test:8080',
        username: 'testuser',
        password: 'testpass'
      };

      await ensureBrowser({
        acceptInsecureCerts: true,
        ignoreHTTPSErrors: true,
        proxy: proxyConfig,
        browserType: 'chromium',
        headless: true
      });

      expect(chromium.launch).toHaveBeenCalledWith({
        headless: true,
        executablePath: undefined,
        proxy: proxyConfig,
        acceptInsecureCerts: true
      });

      expect(mockBrowser.newContext).toHaveBeenCalledWith({
        viewport: {
          width: 1280,
          height: 720,
        },
        deviceScaleFactor: 1,
        ignoreHTTPSErrors: true,
      });
    });
  });

  describe('Default Values', () => {
    it('should use default values when SSL options not provided', async () => {
      await ensureBrowser({
        browserType: 'chromium',
        headless: true
      });

      expect(chromium.launch).toHaveBeenCalledWith({
        headless: true,
        executablePath: undefined
      });

      expect(mockBrowser.newContext).toHaveBeenCalledWith({
        viewport: {
          width: 1280,
          height: 720,
        },
        deviceScaleFactor: 1,
        ignoreHTTPSErrors: false,
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle SSL configuration errors gracefully', async () => {
      (chromium.launch as jest.Mock).mockRejectedValue(new Error('SSL configuration error'));
      
      await expect(ensureBrowser({
        acceptInsecureCerts: true,
        browserType: 'chromium',
        headless: true
      })).rejects.toThrow('SSL configuration error');
    });

    it('should retry with SSL configuration on failure', async () => {
      (chromium.launch as jest.Mock)
        .mockRejectedValueOnce(new Error('Connection failed'))
        .mockResolvedValueOnce(mockBrowser);
      
      await ensureBrowser({
        acceptInsecureCerts: true,
        ignoreHTTPSErrors: true,
        browserType: 'chromium',
        headless: true
      });

      expect(chromium.launch).toHaveBeenCalledTimes(2);
      expect(chromium.launch).toHaveBeenNthCalledWith(1, {
        headless: true,
        executablePath: undefined,
        acceptInsecureCerts: true
      });
      expect(chromium.launch).toHaveBeenNthCalledWith(2, {
        headless: true,
        acceptInsecureCerts: true
      });
    });
  });
}); 