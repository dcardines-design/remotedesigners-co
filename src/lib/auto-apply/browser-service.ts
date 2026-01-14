import { chromium, Browser, BrowserContext, Page } from 'playwright'

export interface BrowserConfig {
  headless?: boolean
  timeout?: number
  viewport?: { width: number; height: number }
  userAgent?: string
}

const DEFAULT_CONFIG: BrowserConfig = {
  headless: true,
  timeout: 30000,
  viewport: { width: 1280, height: 800 },
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}

export interface ActionLog {
  timestamp: string
  action: string
  result: 'success' | 'error' | 'warning'
  details?: string
  screenshot?: string
}

export class BrowserService {
  private browser: Browser | null = null
  private context: BrowserContext | null = null
  private page: Page | null = null
  private config: BrowserConfig
  private actionLog: ActionLog[] = []

  constructor(config: Partial<BrowserConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  async initialize(): Promise<void> {
    try {
      this.browser = await chromium.launch({
        headless: this.config.headless,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu'
        ]
      })

      this.context = await this.browser.newContext({
        viewport: this.config.viewport,
        userAgent: this.config.userAgent,
        locale: 'en-US',
        timezoneId: 'America/New_York',
        permissions: ['geolocation'],
        extraHTTPHeaders: {
          'Accept-Language': 'en-US,en;q=0.9'
        }
      })

      this.page = await this.context.newPage()
      this.page.setDefaultTimeout(this.config.timeout!)

      this.logAction('initialize', 'success', 'Browser initialized')
    } catch (error) {
      this.logAction('initialize', 'error', `Failed to initialize: ${error}`)
      throw error
    }
  }

  async navigateTo(url: string): Promise<boolean> {
    if (!this.page) throw new Error('Browser not initialized')

    try {
      this.logAction('navigate', 'success', `Navigating to ${url}`)

      await this.page.goto(url, {
        waitUntil: 'networkidle',
        timeout: this.config.timeout
      })

      // Wait a bit for any dynamic content
      await this.page.waitForTimeout(1000)

      this.logAction('navigate', 'success', `Loaded ${url}`)
      return true
    } catch (error) {
      this.logAction('navigate', 'error', `Failed to navigate: ${error}`)
      return false
    }
  }

  async takeScreenshot(name?: string): Promise<string> {
    if (!this.page) throw new Error('Browser not initialized')

    try {
      const screenshotBuffer = await this.page.screenshot({
        fullPage: false
      })

      const base64 = Buffer.from(screenshotBuffer).toString('base64')
      const dataUrl = `data:image/png;base64,${base64}`
      this.logAction('screenshot', 'success', name || 'Screenshot captured', dataUrl)

      return dataUrl
    } catch (error) {
      this.logAction('screenshot', 'error', `Failed to capture screenshot: ${error}`)
      throw error
    }
  }

  async waitForSelector(selector: string, timeout?: number): Promise<boolean> {
    if (!this.page) throw new Error('Browser not initialized')

    try {
      await this.page.waitForSelector(selector, {
        timeout: timeout || this.config.timeout
      })
      return true
    } catch {
      return false
    }
  }

  async click(selector: string): Promise<boolean> {
    if (!this.page) throw new Error('Browser not initialized')

    try {
      await this.page.click(selector)
      this.logAction('click', 'success', `Clicked ${selector}`)
      return true
    } catch (error) {
      this.logAction('click', 'error', `Failed to click ${selector}: ${error}`)
      return false
    }
  }

  async fill(selector: string, value: string): Promise<boolean> {
    if (!this.page) throw new Error('Browser not initialized')

    try {
      await this.page.fill(selector, value)
      this.logAction('fill', 'success', `Filled ${selector}`)
      return true
    } catch (error) {
      this.logAction('fill', 'error', `Failed to fill ${selector}: ${error}`)
      return false
    }
  }

  async uploadFile(selector: string, file: { name: string; mimeType: string; buffer: Buffer }): Promise<boolean> {
    if (!this.page) throw new Error('Browser not initialized')

    try {
      const input = await this.page.$(selector)
      if (!input) {
        this.logAction('upload', 'error', `File input not found: ${selector}`)
        return false
      }

      await input.setInputFiles(file)
      this.logAction('upload', 'success', `Uploaded ${file.name} to ${selector}`)
      return true
    } catch (error) {
      this.logAction('upload', 'error', `Failed to upload: ${error}`)
      return false
    }
  }

  async selectOption(selector: string, value: string): Promise<boolean> {
    if (!this.page) throw new Error('Browser not initialized')

    try {
      await this.page.selectOption(selector, { label: value })
      this.logAction('select', 'success', `Selected "${value}" in ${selector}`)
      return true
    } catch (error) {
      this.logAction('select', 'error', `Failed to select: ${error}`)
      return false
    }
  }

  async getPageContent(): Promise<string> {
    if (!this.page) throw new Error('Browser not initialized')
    return this.page.content()
  }

  async getCurrentUrl(): Promise<string> {
    if (!this.page) throw new Error('Browser not initialized')
    return this.page.url()
  }

  async waitForNavigation(timeout?: number): Promise<void> {
    if (!this.page) throw new Error('Browser not initialized')

    await this.page.waitForNavigation({
      timeout: timeout || this.config.timeout,
      waitUntil: 'networkidle'
    })
  }

  async waitForTimeout(ms: number): Promise<void> {
    if (!this.page) throw new Error('Browser not initialized')
    await this.page.waitForTimeout(ms)
  }

  getPage(): Page | null {
    return this.page
  }

  getActionLog(): ActionLog[] {
    return [...this.actionLog]
  }

  clearActionLog(): void {
    this.actionLog = []
  }

  async close(): Promise<void> {
    try {
      if (this.page) {
        await this.page.close()
        this.page = null
      }
      if (this.context) {
        await this.context.close()
        this.context = null
      }
      if (this.browser) {
        await this.browser.close()
        this.browser = null
      }
      this.logAction('close', 'success', 'Browser closed')
    } catch (error) {
      this.logAction('close', 'error', `Error closing browser: ${error}`)
    }
  }

  private logAction(action: string, result: ActionLog['result'], details?: string, screenshot?: string): void {
    this.actionLog.push({
      timestamp: new Date().toISOString(),
      action,
      result,
      details,
      screenshot
    })
  }
}

// Singleton instance for reuse
let browserServiceInstance: BrowserService | null = null

export async function getBrowserService(config?: Partial<BrowserConfig>): Promise<BrowserService> {
  if (!browserServiceInstance) {
    browserServiceInstance = new BrowserService(config)
    await browserServiceInstance.initialize()
  }
  return browserServiceInstance
}

export async function closeBrowserService(): Promise<void> {
  if (browserServiceInstance) {
    await browserServiceInstance.close()
    browserServiceInstance = null
  }
}
