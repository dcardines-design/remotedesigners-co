import { Page } from 'playwright'
import { BaseATSHandler, ApplicationData, FormAnalysis, SubmitResult } from './base'

export class LeverHandler extends BaseATSHandler {
  name = 'lever'

  async detect(page: Page): Promise<boolean> {
    const url = page.url()

    // Check URL patterns
    if (/lever\.co|jobs\.lever\.co/i.test(url)) {
      return true
    }

    // Check for Lever-specific elements
    const leverApp = await page.$('.posting-page, .application-page')
    if (leverApp) return true

    const leverScript = await page.$('script[src*="lever"]')
    if (leverScript) return true

    // Check for Lever's characteristic class names
    const leverClasses = await page.$('[class*="posting-"], [class*="application-form"]')
    if (leverClasses) return true

    return false
  }

  async analyzeForm(page: Page): Promise<FormAnalysis> {
    const fields = []
    const customQuestions: FormAnalysis['customQuestions'] = []

    // Lever's standard field structure
    const fieldMappings = [
      { selector: 'input[name="name"]', label: 'Full Name', type: 'text' as const, mappedField: 'fullName' as const },
      { selector: 'input[name="email"]', label: 'Email', type: 'email' as const, mappedField: 'email' as const },
      { selector: 'input[name="phone"]', label: 'Phone', type: 'phone' as const, mappedField: 'phone' as const },
      { selector: 'input[name="org"]', label: 'Current Company', type: 'text' as const, mappedField: 'currentCompany' as const },
      { selector: 'input[name="urls[LinkedIn]"]', label: 'LinkedIn', type: 'text' as const, mappedField: 'linkedinUrl' as const },
      { selector: 'input[name="urls[Portfolio]"]', label: 'Portfolio', type: 'text' as const, mappedField: 'portfolioUrl' as const },
      { selector: 'input[name="urls[GitHub]"]', label: 'GitHub', type: 'text' as const, mappedField: 'githubUrl' as const },
      { selector: 'input[name="urls[Twitter]"]', label: 'Twitter', type: 'text' as const, mappedField: undefined },
      { selector: 'input[name="urls[Other]"]', label: 'Other URL', type: 'text' as const, mappedField: 'websiteUrl' as const },
      { selector: 'input[type="file"]', label: 'Resume', type: 'file' as const, mappedField: undefined },
      { selector: 'textarea[name="comments"]', label: 'Additional Information', type: 'textarea' as const, mappedField: 'additionalInfo' as const },
    ]

    for (const mapping of fieldMappings) {
      const element = await page.$(mapping.selector)
      if (element) {
        const required = await element.getAttribute('required') !== null ||
                        await element.getAttribute('aria-required') === 'true'
        fields.push({
          type: mapping.type,
          selector: mapping.selector,
          label: mapping.label,
          required,
          mappedField: mapping.mappedField
        })
      }
    }

    // Find custom questions (Lever uses specific card structure)
    const questionCards = await page.$$('.application-question, [class*="custom-question"]')
    for (const card of questionCards) {
      const labelEl = await card.$('label, .question-label')
      const label = labelEl ? await labelEl.textContent() : ''

      const input = await card.$('input:not([type="hidden"]), textarea, select')
      if (input && label) {
        const tagName = await input.evaluate(el => el.tagName.toLowerCase())
        const inputType = await input.getAttribute('type')

        let type: 'text' | 'textarea' | 'select' | 'radio' | 'checkbox' = 'text'
        if (tagName === 'textarea') type = 'textarea'
        else if (tagName === 'select') type = 'select'
        else if (inputType === 'radio') type = 'radio'
        else if (inputType === 'checkbox') type = 'checkbox'

        const name = await input.getAttribute('name')
        customQuestions.push({
          question: label.trim(),
          selector: name ? `[name="${name}"]` : '',
          type,
          options: type === 'select' ? await this.getSelectOptions(input) : undefined
        })
      }
    }

    const hasFileUpload = fields.some(f => f.type === 'file')
    const submitButton = await page.$('button[type="submit"], .application-submit button, button:has-text("Submit application")')

    return {
      fields,
      hasFileUpload,
      hasCustomQuestions: customQuestions.length > 0,
      customQuestions,
      submitButtonSelector: submitButton ? 'button[type="submit"], .application-submit button' : undefined,
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
    const fieldsTotal = 4 // name, email, phone, resume typically required

    // Fill standard Lever fields
    const fieldActions = [
      { selector: 'input[name="name"]', value: data.fullName },
      { selector: 'input[name="email"]', value: data.email },
      { selector: 'input[name="phone"]', value: data.phone },
      { selector: 'input[name="org"]', value: data.currentCompany },
      { selector: 'input[name="urls[LinkedIn]"]', value: data.linkedinUrl },
      { selector: 'input[name="urls[Portfolio]"]', value: data.portfolioUrl },
      { selector: 'input[name="urls[GitHub]"]', value: data.githubUrl },
      { selector: 'input[name="urls[Other]"]', value: data.websiteUrl },
      { selector: 'textarea[name="comments"]', value: data.additionalInfo || data.coverLetterText },
    ]

    for (const action of fieldActions) {
      if (!action.value) continue

      try {
        const element = await page.$(action.selector)
        if (element) {
          await element.fill(action.value)
          fieldsFilled++
          await page.waitForTimeout(100)
        }
      } catch (error) {
        errors.push(`Failed to fill ${action.selector}: ${error}`)
      }
    }

    // Handle custom questions
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
    const coverLetterUploaded = false // Lever typically uses textarea for cover letter
    const errors: string[] = []

    // Lever usually has a single resume upload
    if (data.resumePdfBuffer) {
      const resumeSelectors = [
        'input[type="file"]',
        'input[name="resume"]',
        '.resume-upload input[type="file"]'
      ]

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
            await page.waitForTimeout(1500) // Lever needs time to process
            break
          }
        } catch (error) {
          errors.push(`Resume upload failed: ${error}`)
        }
      }
    }

    // If there's a cover letter, put it in the comments/additional info section
    if (data.coverLetterText) {
      try {
        const commentsField = await page.$('textarea[name="comments"], textarea[name="additional"]')
        if (commentsField) {
          await commentsField.fill(data.coverLetterText)
        }
      } catch (error) {
        errors.push(`Cover letter text failed: ${error}`)
      }
    }

    return { resumeUploaded, coverLetterUploaded, errors }
  }

  async submit(page: Page): Promise<SubmitResult> {
    try {
      // Check for CAPTCHA
      if (await this.hasCaptcha(page)) {
        return {
          success: false,
          error: 'CAPTCHA detected',
          requiresManualAction: true,
          manualActionReason: 'Please complete the CAPTCHA verification'
        }
      }

      // Find submit button (Lever uses specific classes)
      const submitSelectors = [
        'button[type="submit"]',
        '.application-submit button',
        'button:has-text("Submit application")',
        'button:has-text("Apply")',
        'input[type="submit"]'
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

      // Wait for any ongoing uploads to complete
      await page.waitForTimeout(1000)

      // Click submit
      await submitButton.click()
      await page.waitForTimeout(3000)

      // Take screenshot
      const screenshotBuffer = await page.screenshot()
      const screenshot = Buffer.from(screenshotBuffer).toString('base64')

      // Check for success (Lever redirects to a thank you page)
      const url = page.url()
      if (url.includes('thanks') || url.includes('confirmation')) {
        return {
          success: true,
          confirmationMessage: 'Application submitted successfully via Lever',
          confirmationScreenshot: `data:image/png;base64,${screenshot}`
        }
      }

      // Check page content for success messages
      const pageContent = await page.content()
      const successPatterns = [
        /thank you/i,
        /application.*submitted/i,
        /we've received/i,
        /application complete/i
      ]

      for (const pattern of successPatterns) {
        if (pattern.test(pageContent)) {
          return {
            success: true,
            confirmationMessage: 'Application submitted successfully via Lever',
            confirmationScreenshot: `data:image/png;base64,${screenshot}`
          }
        }
      }

      // Check for errors
      const errorElement = await page.$('.error, .validation-error, [class*="error"]')
      if (errorElement) {
        const errorText = await errorElement.textContent()
        return {
          success: false,
          error: errorText || 'Form validation error',
          confirmationScreenshot: `data:image/png;base64,${screenshot}`
        }
      }

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

  private async getSelectOptions(select: any): Promise<string[]> {
    const options = await select.$$('option')
    const values: string[] = []
    for (const option of options) {
      const text = await option.textContent()
      if (text) values.push(text.trim())
    }
    return values
  }
}
