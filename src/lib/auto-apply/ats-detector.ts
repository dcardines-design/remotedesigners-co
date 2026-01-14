import { Page } from 'playwright'

export type ATSType =
  | 'greenhouse'
  | 'lever'
  | 'workday'
  | 'ashby'
  | 'bamboohr'
  | 'smartrecruiters'
  | 'icims'
  | 'taleo'
  | 'jobvite'
  | 'generic'

export interface ATSDetectionResult {
  type: ATSType
  confidence: number // 0-1
  indicators: string[]
}

const ATS_PATTERNS: Record<ATSType, {
  urlPatterns: RegExp[]
  domPatterns: string[]
  metaPatterns: RegExp[]
}> = {
  greenhouse: {
    urlPatterns: [
      /greenhouse\.io/i,
      /boards\.greenhouse\.io/i,
      /grnh\.se/i
    ],
    domPatterns: [
      '#grnhse_app',
      '[data-greenhouse]',
      '.greenhouse-application',
      'script[src*="greenhouse"]'
    ],
    metaPatterns: [
      /greenhouse/i
    ]
  },

  lever: {
    urlPatterns: [
      /lever\.co/i,
      /jobs\.lever\.co/i
    ],
    domPatterns: [
      '.lever-application',
      '[data-lever]',
      '.posting-page',
      'script[src*="lever"]'
    ],
    metaPatterns: [
      /lever/i
    ]
  },

  workday: {
    urlPatterns: [
      /workday\.com/i,
      /myworkdayjobs\.com/i,
      /wd\d+\.myworkday/i
    ],
    domPatterns: [
      '[data-automation-id]',
      '.WD-',
      '[class*="workday"]',
      '.WDPO'
    ],
    metaPatterns: [
      /workday/i
    ]
  },

  ashby: {
    urlPatterns: [
      /ashbyhq\.com/i,
      /jobs\.ashbyhq\.com/i
    ],
    domPatterns: [
      '[data-ashby]',
      '.ashby-application',
      'script[src*="ashby"]'
    ],
    metaPatterns: [
      /ashby/i
    ]
  },

  bamboohr: {
    urlPatterns: [
      /bamboohr\.com/i
    ],
    domPatterns: [
      '.BambooHR-',
      '[class*="bamboo"]',
      '#BambooHR'
    ],
    metaPatterns: [
      /bamboohr/i
    ]
  },

  smartrecruiters: {
    urlPatterns: [
      /smartrecruiters\.com/i,
      /jobs\.smartrecruiters\.com/i
    ],
    domPatterns: [
      '[data-smartrecruiters]',
      '.sr-',
      'script[src*="smartrecruiters"]'
    ],
    metaPatterns: [
      /smartrecruiters/i
    ]
  },

  icims: {
    urlPatterns: [
      /icims\.com/i,
      /\.icims\./i
    ],
    domPatterns: [
      '.icims-',
      '[class*="icims"]',
      '#icims'
    ],
    metaPatterns: [
      /icims/i
    ]
  },

  taleo: {
    urlPatterns: [
      /taleo\.net/i,
      /taleo\.com/i
    ],
    domPatterns: [
      '.taleo-',
      '[class*="taleo"]',
      '#taleo'
    ],
    metaPatterns: [
      /taleo/i
    ]
  },

  jobvite: {
    urlPatterns: [
      /jobvite\.com/i,
      /jobs\.jobvite\.com/i
    ],
    domPatterns: [
      '.jv-',
      '[class*="jobvite"]',
      '#jobvite-application'
    ],
    metaPatterns: [
      /jobvite/i
    ]
  },

  generic: {
    urlPatterns: [],
    domPatterns: [],
    metaPatterns: []
  }
}

export async function detectATS(page: Page): Promise<ATSDetectionResult> {
  const url = page.url()
  const content = await page.content()
  const results: Map<ATSType, { confidence: number; indicators: string[] }> = new Map()

  // Initialize all types
  for (const type of Object.keys(ATS_PATTERNS) as ATSType[]) {
    results.set(type, { confidence: 0, indicators: [] })
  }

  // Check URL patterns (highest confidence)
  for (const [type, patterns] of Object.entries(ATS_PATTERNS) as [ATSType, typeof ATS_PATTERNS[ATSType]][]) {
    if (type === 'generic') continue

    for (const pattern of patterns.urlPatterns) {
      if (pattern.test(url)) {
        const result = results.get(type)!
        result.confidence += 0.6
        result.indicators.push(`URL matches: ${pattern.source}`)
      }
    }
  }

  // Check DOM patterns
  for (const [type, patterns] of Object.entries(ATS_PATTERNS) as [ATSType, typeof ATS_PATTERNS[ATSType]][]) {
    if (type === 'generic') continue

    for (const selector of patterns.domPatterns) {
      try {
        const element = await page.$(selector)
        if (element) {
          const result = results.get(type)!
          result.confidence += 0.25
          result.indicators.push(`DOM element found: ${selector}`)
        }
      } catch {
        // Ignore selector errors
      }
    }
  }

  // Check meta patterns in page content
  for (const [type, patterns] of Object.entries(ATS_PATTERNS) as [ATSType, typeof ATS_PATTERNS[ATSType]][]) {
    if (type === 'generic') continue

    for (const pattern of patterns.metaPatterns) {
      if (pattern.test(content)) {
        const result = results.get(type)!
        result.confidence += 0.15
        result.indicators.push(`Content matches: ${pattern.source}`)
      }
    }
  }

  // Find the best match
  let bestMatch: ATSType = 'generic'
  let bestConfidence = 0
  let bestIndicators: string[] = []

  for (const [type, result] of results) {
    if (result.confidence > bestConfidence) {
      bestMatch = type
      bestConfidence = Math.min(result.confidence, 1) // Cap at 1
      bestIndicators = result.indicators
    }
  }

  // If no strong match, check for generic form
  if (bestConfidence < 0.3) {
    const hasForm = await page.$('form')
    const hasFileInput = await page.$('input[type="file"]')

    if (hasForm && hasFileInput) {
      return {
        type: 'generic',
        confidence: 0.5,
        indicators: ['Generic application form detected']
      }
    }

    return {
      type: 'generic',
      confidence: 0.3,
      indicators: ['No specific ATS detected, using generic handler']
    }
  }

  return {
    type: bestMatch,
    confidence: bestConfidence,
    indicators: bestIndicators
  }
}

// Check if the page is an application form (vs job listing)
export async function isApplicationPage(page: Page): Promise<boolean> {
  const indicators = [
    'form',
    'input[type="file"]',
    'input[type="email"]',
    'button[type="submit"]',
    'button:has-text("Submit")',
    'button:has-text("Apply")',
    '[class*="application"]',
    '[id*="application"]'
  ]

  let score = 0

  for (const selector of indicators) {
    try {
      const element = await page.$(selector)
      if (element) score++
    } catch {
      // Ignore
    }
  }

  // Also check page text
  const pageText = await page.textContent('body') || ''
  const textIndicators = [
    'submit your application',
    'apply for this',
    'upload your resume',
    'personal information',
    'contact information'
  ]

  for (const text of textIndicators) {
    if (pageText.toLowerCase().includes(text)) score++
  }

  return score >= 3
}

// Get the apply URL from a job listing page
export async function findApplyButton(page: Page): Promise<string | null> {
  const applySelectors = [
    'a:has-text("Apply")',
    'a:has-text("Apply Now")',
    'a:has-text("Apply for this job")',
    'button:has-text("Apply")',
    'button:has-text("Apply Now")',
    '[class*="apply-button"]',
    '[id*="apply-button"]',
    'a[href*="apply"]'
  ]

  for (const selector of applySelectors) {
    try {
      const element = await page.$(selector)
      if (element) {
        const href = await element.getAttribute('href')
        if (href) return href

        // If it's a button, click it and get the resulting URL
        const tagName = await element.evaluate(el => el.tagName.toLowerCase())
        if (tagName === 'button') {
          await element.click()
          await page.waitForTimeout(2000)
          return page.url()
        }
      }
    } catch {
      // Continue trying other selectors
    }
  }

  return null
}
