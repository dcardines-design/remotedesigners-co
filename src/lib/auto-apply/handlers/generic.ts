import { Page } from 'playwright'
import { BaseATSHandler, ApplicationData, FormAnalysis, SubmitResult, FieldInfo } from './base'

export class GenericHandler extends BaseATSHandler {
  name = 'generic'

  async detect(page: Page): Promise<boolean> {
    // Generic handler accepts any page with a form
    const form = await page.$('form')
    return !!form
  }

  async analyzeForm(page: Page): Promise<FormAnalysis> {
    const fields: FieldInfo[] = []
    const customQuestions: FormAnalysis['customQuestions'] = []

    // Find all forms on the page
    const forms = await page.$$('form')

    for (const form of forms) {
      // Get all input fields
      const inputs = await form.$$('input:not([type="hidden"]):not([type="submit"]):not([type="button"])')

      for (const input of inputs) {
        const type = (await input.getAttribute('type')) || 'text'
        const name = await input.getAttribute('name')
        const id = await input.getAttribute('id')
        const placeholder = await input.getAttribute('placeholder')
        const required = await input.getAttribute('required') !== null

        // Find label
        let label = ''
        if (id) {
          const labelEl = await page.$(`label[for="${id}"]`)
          if (labelEl) {
            label = (await labelEl.textContent()) || ''
          }
        }

        // Check for parent label
        if (!label) {
          const parentLabel = await input.evaluate((el: Element) => {
            const parent = el.closest('label')
            return parent?.textContent || ''
          })
          if (parentLabel) {
            label = parentLabel.replace(await input.getAttribute('value') || '', '').trim()
          }
        }

        if (!label) {
          label = placeholder || name || id || ''
        }

        const selector = id ? `#${id}` : (name ? `[name="${name}"]` : '')
        if (!selector) continue

        const mappedField = this.mapFieldToData(label.toLowerCase(), type)

        fields.push({
          type: type as FieldInfo['type'],
          selector,
          label: label.trim(),
          required,
          mappedField
        })
      }

      // Get textareas
      const textareas = await form.$$('textarea')
      for (const textarea of textareas) {
        const name = await textarea.getAttribute('name')
        const id = await textarea.getAttribute('id')
        const placeholder = await textarea.getAttribute('placeholder')
        const required = await textarea.getAttribute('required') !== null

        let label = ''
        if (id) {
          const labelEl = await page.$(`label[for="${id}"]`)
          if (labelEl) {
            label = (await labelEl.textContent()) || ''
          }
        }

        const selector = id ? `#${id}` : (name ? `[name="${name}"]` : '')
        if (!selector) continue

        const mappedField = this.mapFieldToData((label || placeholder || '').toLowerCase(), 'textarea')

        fields.push({
          type: 'textarea',
          selector,
          label: (label || placeholder || name || id || '').trim(),
          required,
          mappedField
        })
      }

      // Get selects
      const selects = await form.$$('select')
      for (const select of selects) {
        const name = await select.getAttribute('name')
        const id = await select.getAttribute('id')
        const required = await select.getAttribute('required') !== null

        let label = ''
        if (id) {
          const labelEl = await page.$(`label[for="${id}"]`)
          if (labelEl) {
            label = (await labelEl.textContent()) || ''
          }
        }

        const selector = id ? `#${id}` : (name ? `[name="${name}"]` : '')
        if (!selector) continue

        // Get options
        const optionEls = await select.$$('option')
        const options: string[] = []
        for (const opt of optionEls) {
          const text = await opt.textContent()
          if (text && text.trim()) options.push(text.trim())
        }

        fields.push({
          type: 'select',
          selector,
          label: (label || name || id || '').trim(),
          required,
          options
        })
      }
    }

    // Check for file upload
    const hasFileUpload = fields.some(f => f.type === 'file') ||
                         (await page.$$('input[type="file"]')).length > 0

    // Find submit button
    const submitSelectors = [
      'button[type="submit"]',
      'input[type="submit"]',
      'button:has-text("Submit")',
      'button:has-text("Apply")',
      'button:has-text("Send")',
      'input[value*="Submit"]',
      'input[value*="Apply"]'
    ]

    let submitButtonSelector: string | undefined
    for (const selector of submitSelectors) {
      const btn = await page.$(selector)
      if (btn) {
        submitButtonSelector = selector
        break
      }
    }

    // Detect multi-step forms
    const stepIndicators = await page.$$('[class*="step"], [data-step], .progress-step, .form-step')
    const isMultiStep = stepIndicators.length > 1

    // Identify custom questions (fields that couldn't be mapped)
    for (const field of fields) {
      if (!field.mappedField && field.label && field.label.includes('?')) {
        customQuestions.push({
          question: field.label,
          selector: field.selector,
          type: field.type as 'text' | 'textarea' | 'select' | 'radio' | 'checkbox',
          options: field.options
        })
      }
    }

    return {
      fields,
      hasFileUpload,
      hasCustomQuestions: customQuestions.length > 0,
      customQuestions,
      submitButtonSelector,
      isMultiStep
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
      if (field.type === 'file') continue // Handle separately

      const value = field.mappedField ? this.getFieldValue(data, field.mappedField) : undefined

      if (!value) {
        // Try to use custom responses
        if (data.customResponses && data.customResponses[field.selector]) {
          try {
            await this.fillFieldByType(page, field, data.customResponses[field.selector])
            fieldsFilled++
          } catch (error) {
            errors.push(`Failed to fill ${field.label}: ${error}`)
          }
        }
        continue
      }

      try {
        await this.fillFieldByType(page, field, value)
        fieldsFilled++
        await page.waitForTimeout(50)
      } catch (error) {
        errors.push(`Failed to fill ${field.label}: ${error}`)
      }
    }

    return {
      fieldsFilled,
      fieldsTotal: analysis.fields.filter(f => f.type !== 'file').length,
      errors
    }
  }

  private async fillFieldByType(page: Page, field: FieldInfo, value: string): Promise<void> {
    const element = await page.$(field.selector)
    if (!element) return

    switch (field.type) {
      case 'text':
      case 'email':
      case 'phone':
      case 'number':
      case 'date':
      case 'textarea':
        await element.fill(value)
        break

      case 'select':
        // Try exact match first
        try {
          await page.selectOption(field.selector, { label: value })
        } catch {
          // Try partial match
          const options = field.options || []
          const match = options.find(opt =>
            opt.toLowerCase().includes(value.toLowerCase()) ||
            value.toLowerCase().includes(opt.toLowerCase())
          )
          if (match) {
            await page.selectOption(field.selector, { label: match })
          }
        }
        break

      case 'radio':
      case 'checkbox':
        // Find matching option and click
        const name = await element.getAttribute('name')
        if (name) {
          const allOptions = await page.$$(`[name="${name}"]`)
          for (const opt of allOptions) {
            const optValue = await opt.getAttribute('value')
            const optId = await opt.getAttribute('id')
            let optLabel = ''

            if (optId) {
              const labelEl = await page.$(`label[for="${optId}"]`)
              if (labelEl) optLabel = (await labelEl.textContent()) || ''
            }

            if (optValue?.toLowerCase().includes(value.toLowerCase()) ||
                optLabel.toLowerCase().includes(value.toLowerCase())) {
              await opt.click()
              break
            }
          }
        }
        break
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

    const fileInputs = await page.$$('input[type="file"]')

    for (const input of fileInputs) {
      const name = (await input.getAttribute('name'))?.toLowerCase() || ''
      const id = (await input.getAttribute('id'))?.toLowerCase() || ''
      const accept = await input.getAttribute('accept')

      // Find associated label
      let label = ''
      const inputId = await input.getAttribute('id')
      if (inputId) {
        const labelEl = await page.$(`label[for="${inputId}"]`)
        if (labelEl) label = ((await labelEl.textContent()) || '').toLowerCase()
      }

      const isResumeField = name.includes('resume') || name.includes('cv') ||
                           id.includes('resume') || id.includes('cv') ||
                           label.includes('resume') || label.includes('cv')

      const isCoverField = name.includes('cover') || id.includes('cover') ||
                          label.includes('cover')

      // Upload resume
      if (!resumeUploaded && data.resumePdfBuffer && (isResumeField || !isCoverField)) {
        try {
          await input.setInputFiles({
            name: data.resumeFileName || 'resume.pdf',
            mimeType: 'application/pdf',
            buffer: data.resumePdfBuffer
          })
          resumeUploaded = true
          await page.waitForTimeout(1000)
        } catch (error) {
          errors.push(`Resume upload failed: ${error}`)
        }
      }
      // Upload cover letter
      else if (!coverLetterUploaded && data.coverLetterPdfBuffer && isCoverField) {
        try {
          await input.setInputFiles({
            name: data.coverLetterFileName || 'cover-letter.pdf',
            mimeType: 'application/pdf',
            buffer: data.coverLetterPdfBuffer
          })
          coverLetterUploaded = true
          await page.waitForTimeout(1000)
        } catch (error) {
          errors.push(`Cover letter upload failed: ${error}`)
        }
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

      // Find submit button
      const submitSelectors = [
        'button[type="submit"]',
        'input[type="submit"]',
        'button:has-text("Submit")',
        'button:has-text("Apply")',
        'button:has-text("Send")',
        'button:has-text("Continue")',
        '.submit-button',
        '#submit'
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

      // Store current URL to detect navigation
      const currentUrl = page.url()

      // Click and wait
      await Promise.race([
        submitButton.click(),
        page.waitForNavigation({ timeout: 10000 }).catch(() => {})
      ])

      await page.waitForTimeout(3000)

      // Take screenshot
      const screenshotBuffer = await page.screenshot()
      const screenshot = Buffer.from(screenshotBuffer).toString('base64')

      // Check if we navigated to a new page
      const newUrl = page.url()
      const navigated = newUrl !== currentUrl

      // Check for success indicators
      const pageContent = await page.content()
      const successPatterns = [
        /thank\s*you/i,
        /application.*submitted/i,
        /application.*received/i,
        /successfully/i,
        /confirmation/i,
        /we.*received.*application/i
      ]

      for (const pattern of successPatterns) {
        if (pattern.test(pageContent)) {
          return {
            success: true,
            confirmationMessage: 'Application submitted successfully',
            confirmationScreenshot: `data:image/png;base64,${screenshot}`
          }
        }
      }

      // If navigated and no error visible, probably success
      if (navigated) {
        const errorVisible = await page.$('[class*="error"]:visible, .alert-danger:visible')
        if (!errorVisible) {
          return {
            success: true,
            confirmationMessage: 'Form submitted - please verify on the confirmation page',
            confirmationScreenshot: `data:image/png;base64,${screenshot}`
          }
        }
      }

      // Check for errors
      const errorElement = await page.$('.error, .validation-error, [class*="error"], .alert-danger')
      if (errorElement) {
        const errorText = await errorElement.textContent()
        if (errorText && errorText.trim()) {
          return {
            success: false,
            error: errorText.trim(),
            confirmationScreenshot: `data:image/png;base64,${screenshot}`
          }
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

  // Override for generic to better handle unknown fields
  protected mapFieldToData(label: string, type: string): keyof ApplicationData | undefined {
    const labelLower = label.toLowerCase()

    // Extended mappings for generic handler
    // Name variations
    if (/^(full\s*)?name$/.test(labelLower) || /your\s*name/.test(labelLower)) return 'fullName'
    if (/first\s*name|given\s*name|forename/.test(labelLower)) return 'firstName'
    if (/last\s*name|sur\s*name|family\s*name/.test(labelLower)) return 'lastName'

    // Contact variations
    if (/e-?mail|electronic\s*mail/.test(labelLower)) return 'email'
    if (/phone|mobile|cell|telephone|contact\s*number/.test(labelLower)) return 'phone'
    if (/location|city|address|where.*located/.test(labelLower)) return 'location'

    // Links
    if (/linkedin/.test(labelLower)) return 'linkedinUrl'
    if (/portfolio|personal\s*site|work\s*samples/.test(labelLower)) return 'portfolioUrl'
    if (/website|url|homepage/.test(labelLower)) return 'websiteUrl'
    if (/github/.test(labelLower)) return 'githubUrl'
    if (/dribbble/.test(labelLower)) return 'dribbbleUrl'
    if (/behance/.test(labelLower)) return 'behanceUrl'

    // Work
    if (/current\s*(company|employer|organization)/.test(labelLower)) return 'currentCompany'
    if (/current\s*(title|position|role)/.test(labelLower)) return 'currentTitle'
    if (/years.*experience|experience.*years/.test(labelLower)) return 'yearsOfExperience'

    // Cover letter
    if (/cover\s*letter/.test(labelLower) && type === 'textarea') return 'coverLetterText'
    if (/additional|comments|notes|anything\s*else/.test(labelLower)) return 'additionalInfo'

    // Salary
    if (/salary|compensation|pay|rate/.test(labelLower)) return 'salary'

    // Start date
    if (/start\s*date|available|availability/.test(labelLower)) return 'startDate'

    // Referral
    if (/how.*hear|source|referral|where.*find/.test(labelLower)) return 'heardAbout'

    return undefined
  }
}
