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

// Mock proxy server config for testing
const mockProxyConfig = {
  server: 'http://proxy.test:8080',
  username: 'testuser',
  password: 'testpass'
};

describe('Proxy Configuration', () => {
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

  describe('Browser with proxy settings', () => {
    it('should launch browser with proxy configuration', async () => {
      await ensureBrowser({
        proxy: mockProxyConfig,
        browserType: 'chromium',
        headless: true
      });

      expect(chromium.launch).toHaveBeenCalledWith({
        headless: true,
        executablePath: undefined,
        proxy: mockProxyConfig
      });
    });

    it('should launch Firefox with proxy configuration', async () => {
      await ensureBrowser({
        proxy: mockProxyConfig,
        browserType: 'firefox',
        headless: true
      });

      expect(firefox.launch).toHaveBeenCalledWith({
        headless: true,
        executablePath: undefined,
        proxy: mockProxyConfig
      });
    });

    it('should launch WebKit with proxy configuration', async () => {
      await ensureBrowser({
        proxy: mockProxyConfig,
        browserType: 'webkit',
        headless: true
      });

      expect(webkit.launch).toHaveBeenCalledWith({
        headless: true,
        executablePath: undefined,
        proxy: mockProxyConfig
      });
    });

    it('should launch browser without proxy if not provided', async () => {
      await ensureBrowser({
        browserType: 'chromium',
        headless: true
      });

      expect(chromium.launch).toHaveBeenCalledWith({
        headless: true,
        executablePath: undefined
      });
    });

    it('should handle proxy configuration without authentication', async () => {
      const proxyWithoutAuth = {
        server: 'http://proxy.test:8080'
      };
      
      await ensureBrowser({
        proxy: proxyWithoutAuth,
        browserType: 'chromium',
        headless: true
      });

      expect(chromium.launch).toHaveBeenCalledWith({
        headless: true,
        executablePath: undefined,
        proxy: proxyWithoutAuth
      });
    });

    it('should handle SOCKS proxy configuration', async () => {
      const socksProxy = {
        server: 'socks5://proxy.test:1080'
      };
      
      await ensureBrowser({
        proxy: socksProxy,
        browserType: 'chromium',
        headless: true
      });

      expect(chromium.launch).toHaveBeenCalledWith({
        headless: true,
        executablePath: undefined,
        proxy: socksProxy
      });
    });
  });

  describe('Error handling', () => {
    it('should handle invalid proxy configuration gracefully', async () => {
      (chromium.launch as jest.Mock).mockRejectedValue(new Error('Invalid proxy configuration'));
      
      await expect(ensureBrowser({
        proxy: { server: 'invalid-proxy' },
        browserType: 'chromium',
        headless: true
      })).rejects.toThrow('Invalid proxy configuration');
    });

    it('should retry with proxy configuration on failure', async () => {
      (chromium.launch as jest.Mock)
        .mockRejectedValueOnce(new Error('Connection failed'))
        .mockResolvedValueOnce(mockBrowser);
      
      await ensureBrowser({
        proxy: mockProxyConfig,
        browserType: 'chromium',
        headless: true
      });

      expect(chromium.launch).toHaveBeenCalledTimes(2);
      expect(chromium.launch).toHaveBeenNthCalledWith(1, {
        headless: true,
        executablePath: undefined,
        proxy: mockProxyConfig
      });
      expect(chromium.launch).toHaveBeenNthCalledWith(2, {
        headless: true,
        proxy: mockProxyConfig
      });
    });
  });
}); 