import { Page } from 'playwright'

export interface ApplicationData {
  // Personal info
  firstName: string
  lastName: string
  fullName: string
  email: string
  phone?: string
  location?: string

  // Links
  portfolioUrl?: string
  linkedinUrl?: string
  websiteUrl?: string
  githubUrl?: string
  dribbbleUrl?: string
  behanceUrl?: string

  // Resume/Cover Letter
  resumePdfBuffer?: Buffer
  resumeFileName?: string
  coverLetterPdfBuffer?: Buffer
  coverLetterFileName?: string
  coverLetterText?: string

  // Work authorization
  workAuthorization?: string
  requiresSponsorship?: boolean

  // Experience
  yearsOfExperience?: number
  currentCompany?: string
  currentTitle?: string

  // Additional
  salary?: string
  startDate?: string
  heardAbout?: string
  additionalInfo?: string

  // Custom question responses (AI-generated)
  customResponses?: Record<string, string>
}

export interface FieldInfo {
  type: 'text' | 'email' | 'phone' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'file' | 'date' | 'number'
  selector: string
  label: string
  required: boolean
  options?: string[] // For select/radio
  value?: string // Current value
  mappedField?: keyof ApplicationData | string // Field from ApplicationData to use
}

export interface FormAnalysis {
  fields: FieldInfo[]
  hasFileUpload: boolean
  hasCustomQuestions: boolean
  customQuestions: {
    question: string
    selector: string
    type: 'text' | 'textarea' | 'select' | 'radio' | 'checkbox'
    options?: string[]
  }[]
  submitButtonSelector?: string
  isMultiStep: boolean
  currentStep?: number
  totalSteps?: number
}

export interface SubmitResult {
  success: boolean
  confirmationMessage?: string
  confirmationScreenshot?: string
  applicationId?: string
  error?: string
  requiresManualAction?: boolean
  manualActionReason?: string
}

export interface ATSHandler {
  name: string

  // Check if this handler can handle the current page
  detect(page: Page): Promise<boolean>

  // Analyze the form structure
  analyzeForm(page: Page): Promise<FormAnalysis>

  // Fill out the application form
  fillApplication(page: Page, data: ApplicationData): Promise<{
    fieldsFilled: number
    fieldsTotal: number
    errors: string[]
  }>

  // Upload resume and cover letter
  uploadDocuments(page: Page, data: ApplicationData): Promise<{
    resumeUploaded: boolean
    coverLetterUploaded: boolean
    errors: string[]
  }>

  // Submit the application
  submit(page: Page): Promise<SubmitResult>

  // Handle multi-step forms
  goToNextStep?(page: Page): Promise<boolean>

  // Check for CAPTCHA
  hasCaptcha?(page: Page): Promise<boolean>
}

// Base implementation with common functionality
export abstract class BaseATSHandler implements ATSHandler {
  abstract name: string

  abstract detect(page: Page): Promise<boolean>

  async analyzeForm(page: Page): Promise<FormAnalysis> {
    const fields: FieldInfo[] = []
    const customQuestions: FormAnalysis['customQuestions'] = []

    // Find all input fields
    const inputs = await page.$$('input:not([type="hidden"]):not([type="submit"]):not([type="button"])')
    for (const input of inputs) {
      const type = await input.getAttribute('type') || 'text'
      const name = await input.getAttribute('name') || ''
      const id = await input.getAttribute('id') || ''
      const placeholder = await input.getAttribute('placeholder') || ''
      const required = await input.getAttribute('required') !== null

      // Try to find associated label
      let label = ''
      if (id) {
        const labelEl = await page.$(`label[for="${id}"]`)
        if (labelEl) {
          label = (await labelEl.textContent()) || ''
        }
      }
      if (!label) {
        label = placeholder || name || id
      }

      const mappedField = this.mapFieldToData(label.toLowerCase(), type)

      fields.push({
        type: type as FieldInfo['type'],
        selector: id ? `#${id}` : `[name="${name}"]`,
        label: label.trim(),
        required,
        mappedField
      })
    }

    // Find textareas
    const textareas = await page.$$('textarea')
    for (const textarea of textareas) {
      const name = await textarea.getAttribute('name') || ''
      const id = await textarea.getAttribute('id') || ''
      const required = await textarea.getAttribute('required') !== null

      let label = ''
      if (id) {
        const labelEl = await page.$(`label[for="${id}"]`)
        if (labelEl) {
          label = (await labelEl.textContent()) || ''
        }
      }

      const mappedField = this.mapFieldToData(label.toLowerCase(), 'textarea')

      fields.push({
        type: 'textarea',
        selector: id ? `#${id}` : `[name="${name}"]`,
        label: label.trim(),
        required,
        mappedField
      })
    }

    // Find selects
    const selects = await page.$$('select')
    for (const select of selects) {
      const name = await select.getAttribute('name') || ''
      const id = await select.getAttribute('id') || ''
      const required = await select.getAttribute('required') !== null

      let label = ''
      if (id) {
        const labelEl = await page.$(`label[for="${id}"]`)
        if (labelEl) {
          label = (await labelEl.textContent()) || ''
        }
      }

      // Get options
      const optionEls = await select.$$('option')
      const options: string[] = []
      for (const opt of optionEls) {
        const text = await opt.textContent()
        if (text) options.push(text.trim())
      }

      fields.push({
        type: 'select',
        selector: id ? `#${id}` : `[name="${name}"]`,
        label: label.trim(),
        required,
        options
      })
    }

    // Check for file upload
    const hasFileUpload = (await page.$$('input[type="file"]')).length > 0

    // Find submit button
    const submitButton = await page.$('button[type="submit"], input[type="submit"], button:has-text("Submit"), button:has-text("Apply")')
    const submitButtonSelector = submitButton
      ? await this.getSelector(page, submitButton)
      : undefined

    // Check for multi-step indicators
    const isMultiStep = (await page.$$('[class*="step"], [class*="progress"], [data-step]')).length > 0

    return {
      fields,
      hasFileUpload,
      hasCustomQuestions: customQuestions.length > 0,
      customQuestions,
      submitButtonSelector,
      isMultiStep,
    }
  }

  async fillApplication(page: Page, data: ApplicationData): Promise<{
    fieldsFilled: number
    fieldsTotal: number
    errors: string[]
  }> {
    const analysis = await this.analyzeForm(page)
    let fieldsFilled = 0
    const errors: string[] = []

    for (const field of analysis.fields) {
      if (!field.mappedField) continue

      const value = this.getFieldValue(data, field.mappedField)
      if (!value) continue

      try {
        await this.fillField(page, field, value)
        fieldsFilled++
      } catch (error) {
        errors.push(`Failed to fill ${field.label}: ${error}`)
      }
    }

    return {
      fieldsFilled,
      fieldsTotal: analysis.fields.length,
      errors
    }
  }

  async uploadDocuments(page: Page, data: ApplicationData): Promise<{
    resumeUploaded: boolean
    coverLetterUploaded: boolean
    errors: string[]
  }> {
    let resumeUploaded = false
    let coverLetterUploaded = false
    const errors: string[] = []

    // Find file inputs
    const fileInputs = await page.$$('input[type="file"]')

    for (const input of fileInputs) {
      const accept = await input.getAttribute('accept')
      const name = await input.getAttribute('name') || ''
      const id = await input.getAttribute('id') || ''

      // Try to find associated label to determine what type of file
      let label = ''
      if (id) {
        const labelEl = await page.$(`label[for="${id}"]`)
        if (labelEl) {
          label = ((await labelEl.textContent()) || '').toLowerCase()
        }
      }

      const isResume = label.includes('resume') || label.includes('cv') || name.includes('resume') || name.includes('cv')
      const isCoverLetter = label.includes('cover') || name.includes('cover')

      if (isResume && data.resumePdfBuffer) {
        try {
          await input.setInputFiles({
            name: data.resumeFileName || 'resume.pdf',
            mimeType: 'application/pdf',
            buffer: data.resumePdfBuffer
          })
          resumeUploaded = true
        } catch (error) {
          errors.push(`Failed to upload resume: ${error}`)
        }
      } else if (isCoverLetter && data.coverLetterPdfBuffer) {
        try {
          await input.setInputFiles({
            name: data.coverLetterFileName || 'cover-letter.pdf',
            mimeType: 'application/pdf',
            buffer: data.coverLetterPdfBuffer
          })
          coverLetterUploaded = true
        } catch (error) {
          errors.push(`Failed to upload cover letter: ${error}`)
        }
      } else if (!resumeUploaded && data.resumePdfBuffer) {
        // Default to resume if unclear
        try {
          await input.setInputFiles({
            name: data.resumeFileName || 'resume.pdf',
            mimeType: 'application/pdf',
            buffer: data.resumePdfBuffer
          })
          resumeUploaded = true
        } catch (error) {
          errors.push(`Failed to upload resume: ${error}`)
        }
      }
    }

    return { resumeUploaded, coverLetterUploaded, errors }
  }

  async submit(page: Page): Promise<SubmitResult> {
    try {
      const submitButton = await page.$('button[type="submit"], input[type="submit"], button:has-text("Submit"), button:has-text("Apply Now"), button:has-text("Send Application")')

      if (!submitButton) {
        return {
          success: false,
          error: 'Could not find submit button',
          requiresManualAction: true,
          manualActionReason: 'Submit button not found'
        }
      }

      // Click and wait for navigation or confirmation
      await Promise.all([
        page.waitForNavigation({ timeout: 30000 }).catch(() => {}),
        submitButton.click()
      ])

      // Wait a moment for any confirmation messages
      await new Promise(r => setTimeout(r, 2000))

      // Take confirmation screenshot
      const screenshotBuffer = await page.screenshot()
      const screenshot = Buffer.from(screenshotBuffer).toString('base64')

      // Check for success indicators
      const pageContent = await page.content()
      const successIndicators = [
        'thank you',
        'application submitted',
        'successfully applied',
        'application received',
        'we have received your application',
        'confirmation'
      ]

      const hasSuccessIndicator = successIndicators.some(
        indicator => pageContent.toLowerCase().includes(indicator)
      )

      if (hasSuccessIndicator) {
        return {
          success: true,
          confirmationScreenshot: `data:image/png;base64,${screenshot}`,
          confirmationMessage: 'Application submitted successfully'
        }
      }

      // Check for error messages
      const errorElement = await page.$('[class*="error"], [class*="alert-danger"], .error-message')
      if (errorElement) {
        const errorText = await errorElement.textContent()
        return {
          success: false,
          error: errorText || 'Unknown error occurred',
          confirmationScreenshot: `data:image/png;base64,${screenshot}`
        }
      }

      // Uncertain outcome
      return {
        success: true,
        confirmationScreenshot: `data:image/png;base64,${screenshot}`,
        confirmationMessage: 'Application may have been submitted - please verify'
      }

    } catch (error) {
      return {
        success: false,
        error: `Submit failed: ${error}`,
        requiresManualAction: true,
        manualActionReason: 'Error during submission'
      }
    }
  }

  async hasCaptcha(page: Page): Promise<boolean> {
    const captchaSelectors = [
      '[class*="captcha"]',
      '[id*="captcha"]',
      'iframe[src*="recaptcha"]',
      'iframe[src*="hcaptcha"]',
      '.g-recaptcha',
      '.h-captcha'
    ]

    for (const selector of captchaSelectors) {
      const element = await page.$(selector)
      if (element) return true
    }

    return false
  }

  // Helper methods
  protected mapFieldToData(label: string, type: string): keyof ApplicationData | undefined {
    const labelLower = label.toLowerCase()

    // Name fields
    if (labelLower.includes('first name') || labelLower === 'first') return 'firstName'
    if (labelLower.includes('last name') || labelLower === 'last') return 'lastName'
    if (labelLower.includes('full name') || labelLower === 'name') return 'fullName'

    // Contact
    if (labelLower.includes('email')) return 'email'
    if (labelLower.includes('phone') || labelLower.includes('mobile')) return 'phone'
    if (labelLower.includes('location') || labelLower.includes('city') || labelLower.includes('address')) return 'location'

    // Links
    if (labelLower.includes('linkedin')) return 'linkedinUrl'
    if (labelLower.includes('portfolio') || labelLower.includes('website')) return 'portfolioUrl'
    if (labelLower.includes('github')) return 'githubUrl'
    if (labelLower.includes('dribbble')) return 'dribbbleUrl'
    if (labelLower.includes('behance')) return 'behanceUrl'

    // Work
    if (labelLower.includes('current company') || labelLower.includes('employer')) return 'currentCompany'
    if (labelLower.includes('current title') || labelLower.includes('job title')) return 'currentTitle'
    if (labelLower.includes('years') && labelLower.includes('experience')) return 'yearsOfExperience'

    // Cover letter / additional info
    if (labelLower.includes('cover letter') && type === 'textarea') return 'coverLetterText'
    if (labelLower.includes('additional') || labelLower.includes('anything else')) return 'additionalInfo'

    // Salary
    if (labelLower.includes('salary') || labelLower.includes('compensation')) return 'salary'

    // Start date
    if (labelLower.includes('start') && labelLower.includes('date')) return 'startDate'

    // How did you hear
    if (labelLower.includes('hear') || labelLower.includes('source') || labelLower.includes('referral')) return 'heardAbout'

    return undefined
  }

  protected getFieldValue(data: ApplicationData, field: keyof ApplicationData | string): string | undefined {
    const value = data[field as keyof ApplicationData]

    if (value === undefined || value === null) return undefined
    if (typeof value === 'string') return value
    if (typeof value === 'number') return value.toString()
    if (typeof value === 'boolean') return value ? 'Yes' : 'No'

    return undefined
  }

  protected async fillField(page: Page, field: FieldInfo, value: string): Promise<void> {
    const element = await page.$(field.selector)
    if (!element) throw new Error(`Element not found: ${field.selector}`)

    switch (field.type) {
      case 'text':
      case 'email':
      case 'phone':
      case 'number':
      case 'date':
        await element.fill(value)
        break

      case 'textarea':
        await element.fill(value)
        break

      case 'select':
        // Try to find matching option
        const options = field.options || []
        const matchingOption = options.find(
          opt => opt.toLowerCase().includes(value.toLowerCase()) ||
                 value.toLowerCase().includes(opt.toLowerCase())
        )
        if (matchingOption) {
          await page.selectOption(field.selector, { label: matchingOption })
        }
        break

      case 'radio':
      case 'checkbox':
        // Find the option that matches
        const radioOptions = await page.$$(`${field.selector}, [name="${await element.getAttribute('name')}"]`)
        for (const option of radioOptions) {
          const optionValue = await option.getAttribute('value')
          const optionLabel = await option.evaluate(el => {
            const label = el.closest('label') || document.querySelector(`label[for="${el.id}"]`)
            return label?.textContent || ''
          })

          if (optionValue?.toLowerCase().includes(value.toLowerCase()) ||
              optionLabel.toLowerCase().includes(value.toLowerCase())) {
            await option.click()
            break
          }
        }
        break
    }
  }

  protected async getSelector(page: Page, element: any): Promise<string> {
    const id = await element.getAttribute('id')
    if (id) return `#${id}`

    const name = await element.getAttribute('name')
    if (name) return `[name="${name}"]`

    const className = await element.getAttribute('class')
    if (className) return `.${className.split(' ')[0]}`

    return ''
  }
}
