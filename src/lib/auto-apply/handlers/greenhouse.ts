import { Page } from 'playwright'
import { BaseATSHandler, ApplicationData, FormAnalysis, SubmitResult } from './base'

export class GreenhouseHandler extends BaseATSHandler {
  name = 'greenhouse'

  async detect(page: Page): Promise<boolean> {
    const url = page.url()

    // Check URL patterns
    if (/greenhouse\.io|boards\.greenhouse\.io|grnh\.se/i.test(url)) {
      return true
    }

    // Check for Greenhouse-specific elements
    const grnhseApp = await page.$('#grnhse_app')
    if (grnhseApp) return true

    const greenhouseScript = await page.$('script[src*="greenhouse"]')
    if (greenhouseScript) return true

    return false
  }

  async analyzeForm(page: Page): Promise<FormAnalysis> {
    // Greenhouse uses a specific structure
    const fields = []
    const customQuestions: FormAnalysis['customQuestions'] = []

    // Standard Greenhouse fields
    const fieldMappings = [
      { selector: '#first_name', label: 'First Name', type: 'text' as const, mappedField: 'firstName' as const },
      { selector: '#last_name', label: 'Last Name', type: 'text' as const, mappedField: 'lastName' as const },
      { selector: '#email', label: 'Email', type: 'email' as const, mappedField: 'email' as const },
      { selector: '#phone', label: 'Phone', type: 'phone' as const, mappedField: 'phone' as const },
      { selector: 'input[name*="resume"]', label: 'Resume', type: 'file' as const, mappedField: undefined },
      { selector: 'input[name*="cover_letter"]', label: 'Cover Letter', type: 'file' as const, mappedField: undefined },
      { selector: '#job_application_location', label: 'Location', type: 'text' as const, mappedField: 'location' as const },
      { selector: 'input[name*="linkedin"]', label: 'LinkedIn', type: 'text' as const, mappedField: 'linkedinUrl' as const },
      { selector: 'input[name*="website"], input[name*="portfolio"]', label: 'Portfolio', type: 'text' as const, mappedField: 'portfolioUrl' as const },
    ]

    for (const mapping of fieldMappings) {
      const element = await page.$(mapping.selector)
      if (element) {
        const required = await element.getAttribute('required') !== null
        fields.push({
          type: mapping.type,
          selector: mapping.selector,
          label: mapping.label,
          required,
          mappedField: mapping.mappedField
        })
      }
    }

    // Find custom questions (Greenhouse uses data-qa attributes)
    const customFieldContainers = await page.$$('[class*="custom-question"], .application-question:not(.required-fields)')
    for (const container of customFieldContainers) {
      const labelEl = await container.$('label')
      const label = labelEl ? await labelEl.textContent() : ''

      const input = await container.$('input:not([type="hidden"]), textarea, select')
      if (input && label) {
        const tagName = await input.evaluate(el => el.tagName.toLowerCase())
        const inputType = await input.getAttribute('type')

        let type: 'text' | 'textarea' | 'select' | 'radio' | 'checkbox' = 'text'
        if (tagName === 'textarea') type = 'textarea'
        else if (tagName === 'select') type = 'select'
        else if (inputType === 'radio') type = 'radio'
        else if (inputType === 'checkbox') type = 'checkbox'

        const id = await input.getAttribute('id')
        customQuestions.push({
          question: label.trim(),
          selector: id ? `#${id}` : `[name="${await input.getAttribute('name')}"]`,
          type,
          options: type === 'select' ? await this.getSelectOptions(page, input) : undefined
        })
      }
    }

    const hasFileUpload = fields.some(f => f.type === 'file')
    const submitButton = await page.$('button[type="submit"], input[type="submit"], #submit_app')

    return {
      fields,
      hasFileUpload,
      hasCustomQuestions: customQuestions.length > 0,
      customQuestions,
      submitButtonSelector: submitButton ? '#submit_app, button[type="submit"]' : undefined,
      isMultiStep: false
    }
  }

  async fillApplication(page: Page, data: ApplicationData): Promise<{
    fieldsFilled: number
    fieldsTotal: number
    errors: string[]
  }> {
    let fieldsFilled = 0
    const errors: string[] = []
    const fieldsTotal = 5 // Standard required fields

    // Fill standard fields with specific Greenhouse selectors
    const fieldActions = [
      { selector: '#first_name', value: data.firstName },
      { selector: '#last_name', value: data.lastName },
      { selector: '#email', value: data.email },
      { selector: '#phone', value: data.phone },
      { selector: '#job_application_location', value: data.location },
      { selector: 'input[name*="linkedin"]', value: data.linkedinUrl },
      { selector: 'input[name*="website"], input[name*="portfolio"]', value: data.portfolioUrl },
    ]

    for (const action of fieldActions) {
      if (!action.value) continue

      try {
        const element = await page.$(action.selector)
        if (element) {
          await element.fill(action.value)
          fieldsFilled++
          await page.waitForTimeout(100) // Small delay between fields
        }
      } catch (error) {
        errors.push(`Failed to fill ${action.selector}: ${error}`)
      }
    }

    // Handle custom questions with AI-generated responses
    if (data.customResponses) {
      for (const [selector, response] of Object.entries(data.customResponses)) {
        try {
          const element = await page.$(selector)
          if (element) {
            const tagName = await element.evaluate(el => el.tagName.toLowerCase())
            if (tagName === 'select') {
              await page.selectOption(selector, { label: response })
            } else {
              await element.fill(response)
            }
            fieldsFilled++
          }
        } catch (error) {
          errors.push(`Failed to fill custom question ${selector}: ${error}`)
        }
      }
    }

    return { fieldsFilled, fieldsTotal, errors }
  }

  async uploadDocuments(page: Page, data: ApplicationData): Promise<{
    resumeUploaded: boolean
    coverLetterUploaded: boolean
    errors: string[]
  }> {
    let resumeUploaded = false
    let coverLetterUploaded = false
    const errors: string[] = []

    // Greenhouse has specific file input patterns
    const resumeSelectors = [
      'input[name*="resume"]',
      '#resume',
      'input[data-field="resume"]',
      'input[type="file"]:first-of-type'
    ]

    const coverLetterSelectors = [
      'input[name*="cover_letter"]',
      '#cover_letter',
      'input[data-field="cover_letter"]'
    ]

    // Upload resume
    if (data.resumePdfBuffer) {
      for (const selector of resumeSelectors) {
        try {
          const input = await page.$(selector)
          if (input) {
            await input.setInputFiles({
              name: data.resumeFileName || 'resume.pdf',
              mimeType: 'application/pdf',
              buffer: data.resumePdfBuffer
            })
            resumeUploaded = true
            await page.waitForTimeout(1000) // Wait for upload to process
            break
          }
        } catch (error) {
          errors.push(`Resume upload failed with ${selector}: ${error}`)
        }
      }
    }

    // Upload cover letter
    if (data.coverLetterPdfBuffer) {
      for (const selector of coverLetterSelectors) {
        try {
          const input = await page.$(selector)
          if (input) {
            await input.setInputFiles({
              name: data.coverLetterFileName || 'cover-letter.pdf',
              mimeType: 'application/pdf',
              buffer: data.coverLetterPdfBuffer
            })
            coverLetterUploaded = true
            await page.waitForTimeout(1000)
            break
          }
        } catch (error) {
          errors.push(`Cover letter upload failed with ${selector}: ${error}`)
        }
      }
    }

    return { resumeUploaded, coverLetterUploaded, errors }
  }

  async submit(page: Page): Promise<SubmitResult> {
    try {
      // Check for CAPTCHA first
      if (await this.hasCaptcha(page)) {
        return {
          success: false,
          error: 'CAPTCHA detected',
          requiresManualAction: true,
          manualActionReason: 'Please complete the CAPTCHA verification'
        }
      }

      // Find and click submit button
      const submitSelectors = [
        '#submit_app',
        'button[type="submit"]',
        'input[type="submit"]',
        'button:has-text("Submit Application")',
        'button:has-text("Submit")'
      ]

      let submitButton = null
      for (const selector of submitSelectors) {
        submitButton = await page.$(selector)
        if (submitButton) break
      }

      if (!submitButton) {
        return {
          success: false,
          error: 'Submit button not found',
          requiresManualAction: true,
          manualActionReason: 'Could not locate the submit button'
        }
      }

      // Click and wait
      await submitButton.click()
      await page.waitForTimeout(3000)

      // Take screenshot
      const screenshotBuffer = await page.screenshot()
      const screenshot = Buffer.from(screenshotBuffer).toString('base64')

      // Check for success
      const pageContent = await page.content()
      const successPatterns = [
        /thank you/i,
        /application.*received/i,
        /successfully submitted/i,
        /we've received your application/i,
        /application complete/i
      ]

      for (const pattern of successPatterns) {
        if (pattern.test(pageContent)) {
          return {
            success: true,
            confirmationMessage: 'Application submitted successfully via Greenhouse',
            confirmationScreenshot: `data:image/png;base64,${screenshot}`
          }
        }
      }

      // Check for errors
      const errorElement = await page.$('.field-error, .error-message, [class*="error"]')
      if (errorElement) {
        const errorText = await errorElement.textContent()
        return {
          success: false,
          error: errorText || 'Form validation error',
          confirmationScreenshot: `data:image/png;base64,${screenshot}`
        }
      }

      // Uncertain - might have worked
      return {
        success: true,
        confirmationMessage: 'Application may have been submitted - please verify',
        confirmationScreenshot: `data:image/png;base64,${screenshot}`
      }

    } catch (error) {
      return {
        success: false,
        error: `Submit error: ${error}`,
        requiresManualAction: true,
        manualActionReason: 'Error occurred during submission'
      }
    }
  }

  private async getSelectOptions(page: Page, select: any): Promise<string[]> {
    const options = await select.$$('option')
    const values: string[] = []
    for (const option of options) {
      const text = await option.textContent()
      if (text) values.push(text.trim())
    }
    return values
  }
}
