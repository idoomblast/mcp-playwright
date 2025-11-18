import { ensureBrowser, resetBrowserState } from '../toolHandler';
import { chromium, firefox, webkit } from 'playwright';

// Mock the browser modules
jest.mock('playwright', () => ({
  chromium: {
    launch: jest.fn(),
    launchPersistentContext: jest.fn()
  },
  firefox: {
    launch: jest.fn(),
    launchPersistentContext: jest.fn()
  },
  webkit: {
    launch: jest.fn(),
    launchPersistentContext: jest.fn()
  }
}));

const mockPage = {
  on: jest.fn(),
  addInitScript: jest.fn(),
  isClosed: jest.fn().mockReturnValue(false),
  bringToFront: jest.fn()
};

const mockBrowser = {
  isConnected: jest.fn().mockReturnValue(true),
  on: jest.fn(),
  newContext: jest.fn().mockResolvedValue({
    newPage: jest.fn().mockResolvedValue(mockPage)
  }),
  close: jest.fn(),
  contexts: jest.fn().mockReturnValue([])
};

const mockPersistentContext = {
  browser: jest.fn().mockReturnValue(null),
  pages: jest.fn().mockReturnValue([mockPage]),
  newPage: jest.fn().mockResolvedValue(mockPage)
};

describe('Browser Profile Support', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetBrowserState();
    
    // Setup default mock implementations
    (chromium.launch as jest.Mock).mockResolvedValue(mockBrowser);
    (firefox.launch as jest.Mock).mockResolvedValue(mockBrowser);
    (webkit.launch as jest.Mock).mockResolvedValue(mockBrowser);
    
    (chromium.launchPersistentContext as jest.Mock).mockResolvedValue(mockPersistentContext);
    (firefox.launchPersistentContext as jest.Mock).mockResolvedValue(mockPersistentContext);
    (webkit.launchPersistentContext as jest.Mock).mockResolvedValue(mockPersistentContext);
  });

  afterEach(() => {
    resetBrowserState();
  });

  describe('Persistent Context Launch', () => {
    it('should launch persistent context when userDataDir is provided', async () => {
      const userDataDir = '/path/to/profile';
      
      await ensureBrowser({
        userDataDir,
        browserType: 'chromium',
        headless: true
      });

            expect(chromium.launchPersistentContext).toHaveBeenCalledWith(userDataDir, {
        headless: true,
        executablePath: undefined,
        viewport: {
          width: 1600,
          height: 900,
        },
        deviceScaleFactor: 1,
        ignoreHTTPSErrors: false,
      });

      // Verify regular launch was NOT called
      expect(chromium.launch).not.toHaveBeenCalled();
    });

    it('should launch persistent context with Firefox', async () => {
      const userDataDir = '/path/to/firefox-profile';
      
      await ensureBrowser({
        userDataDir,
        browserType: 'firefox',
        headless: true
      });

      expect(firefox.launchPersistentContext).toHaveBeenCalledWith(userDataDir, {
        headless: true,
        executablePath: undefined,
        viewport: {
          width: 1600,
          height: 900,
        },
        deviceScaleFactor: 1,
        ignoreHTTPSErrors: false,
      });
    });

    it('should launch persistent context with WebKit', async () => {
      const userDataDir = '/path/to/webkit-profile';
      
      await ensureBrowser({
        userDataDir,
        browserType: 'webkit',
        headless: true
      });

      expect(webkit.launchPersistentContext).toHaveBeenCalledWith(userDataDir, {
        headless: true,
        executablePath: undefined,
        viewport: {
          width: 1600,
          height: 900,
        },
        deviceScaleFactor: 1,
        ignoreHTTPSErrors: false,
      });
    });

    it('should include proxy configuration in persistent context', async () => {
      const userDataDir = '/path/to/profile';
      const proxy = {
        server: 'http://proxy.test:8080',
        username: 'user',
        password: 'pass'
      };
      
      await ensureBrowser({
        userDataDir,
        proxy,
        browserType: 'chromium',
        headless: true
      });

      expect(chromium.launchPersistentContext).toHaveBeenCalledWith(userDataDir, {
        headless: true,
        executablePath: undefined,
        proxy: proxy,
        viewport: {
          width: 1600,
          height: 900,
        },
        deviceScaleFactor: 1,
        ignoreHTTPSErrors: false,
      });
    });

    it('should include custom user agent in persistent context', async () => {
      const userDataDir = '/path/to/profile';
      const userAgent = 'Custom Browser 1.0';
      
      await ensureBrowser({
        userDataDir,
        userAgent,
        browserType: 'chromium',
        headless: true
      });

      expect(chromium.launchPersistentContext).toHaveBeenCalledWith(userDataDir, {
        headless: true,
        executablePath: undefined,
        userAgent: userAgent,
        viewport: {
          width: 1600,
          height: 900,
        },
        deviceScaleFactor: 1,
        ignoreHTTPSErrors: false,
      });
    });

    it('should include custom viewport in persistent context', async () => {
      const userDataDir = '/path/to/profile';
      
      await ensureBrowser({
        userDataDir,
        viewport: {
          width: 1920,
          height: 1080
        },
        browserType: 'chromium',
        headless: true
      });

      expect(chromium.launchPersistentContext).toHaveBeenCalledWith(userDataDir, {
        headless: true,
        executablePath: undefined,
        viewport: {
          width: 1920,
          height: 1080,
        },
        deviceScaleFactor: 1,
        ignoreHTTPSErrors: false,
      });
    });
  });

  describe('Regular Browser Launch (No Profile)', () => {
    it('should launch regular browser when no userDataDir is provided', async () => {
      await ensureBrowser({
        browserType: 'chromium',
        headless: true
      });

      expect(chromium.launch).toHaveBeenCalled();
      expect(chromium.launchPersistentContext).not.toHaveBeenCalled();
    });

    it('should launch regular browser when userDataDir is undefined', async () => {
      await ensureBrowser({
        browserType: 'chromium',
        headless: true,
        userDataDir: undefined
      });

      expect(chromium.launch).toHaveBeenCalled();
      expect(chromium.launchPersistentContext).not.toHaveBeenCalled();
    });

    it('should launch regular browser when userDataDir is empty string', async () => {
      await ensureBrowser({
        browserType: 'chromium',
        headless: true,
        userDataDir: ''
      });

      expect(chromium.launch).toHaveBeenCalled();
      expect(chromium.launchPersistentContext).not.toHaveBeenCalled();
    });
  });

  describe('Page Management with Persistent Context', () => {
    it('should use existing page from persistent context if available', async () => {
      const existingPage = { ...mockPage };
      mockPersistentContext.pages.mockReturnValue([existingPage]);
      
      const page = await ensureBrowser({
        userDataDir: '/path/to/profile',
        browserType: 'chromium'
      });

      expect(page).toBe(existingPage);
      expect(mockPersistentContext.newPage).not.toHaveBeenCalled();
    });

    it('should create new page in persistent context if none exist', async () => {
      mockPersistentContext.pages.mockReturnValue([]);
      const newPage = { ...mockPage };
      mockPersistentContext.newPage.mockResolvedValue(newPage);
      
      const page = await ensureBrowser({
        userDataDir: '/path/to/profile',
        browserType: 'chromium'
      });

      expect(mockPersistentContext.newPage).toHaveBeenCalled();
      expect(page).toBe(newPage);
    });

    it('should store context reference in page object for persistent context', async () => {
      const page = await ensureBrowser({
        userDataDir: '/path/to/profile',
        browserType: 'chromium'
      });

      expect((page as any)._playwrightContext).toBe(mockPersistentContext);
    });
  });

  describe('SSL and Certificate Handling with Profiles', () => {
    it('should include SSL options in persistent context', async () => {
      const userDataDir = '/path/to/profile';
      
      await ensureBrowser({
        userDataDir,
        acceptInsecureCerts: false,
        ignoreHTTPSErrors: false,
        browserType: 'chromium',
        headless: true
      });

      expect(chromium.launchPersistentContext).toHaveBeenCalledWith(userDataDir, {
        headless: true,
        executablePath: undefined,
        acceptInsecureCerts: false,
        viewport: {
          width: 1600,
          height: 900,
        },
        deviceScaleFactor: 1,
        ignoreHTTPSErrors: false,
      });
    });
  });
}); 