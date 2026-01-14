import { BrowserService, ActionLog } from './browser-service'
import { detectATS, isApplicationPage, findApplyButton, ATSType } from './ats-detector'
import { getHandler, ApplicationData, SubmitResult } from './handlers'
import { generateCustomResponses, UserProfile, JobContext, CustomQuestion } from './ai-responder'
import { generateResumePDF, generateCoverLetterPDF, ResumeData, CoverLetterData } from '../pdf-generator'

export type AutoApplyStatus =
  | 'pending'
  | 'navigating'
  | 'detecting'
  | 'filling'
  | 'uploading'
  | 'submitting'
  | 'completed'
  | 'failed'
  | 'captcha'
  | 'manual'

export interface AutoApplySession {
  id: string
  status: AutoApplyStatus
  progress: number // 0-100
  currentStep: string
  atsDetected?: ATSType
  atsConfidence?: number
  fieldsTotal: number
  fieldsFilled: number
  customQuestions: CustomQuestion[]
  screenshots: string[]
  actionLog: ActionLog[]
  error?: string
  result?: SubmitResult
  startedAt?: string
  completedAt?: string
}

export interface AutoApplyInput {
  jobUrl: string
  jobTitle: string
  companyName: string
  jobDescription: string
  userProfile: UserProfile
  resumeData: ResumeData
  coverLetterContent: string
}

export class ApplyController {
  private browser: BrowserService
  private session: AutoApplySession
  private onStatusUpdate?: (session: AutoApplySession) => void

  constructor(sessionId: string, onStatusUpdate?: (session: AutoApplySession) => void) {
    this.browser = new BrowserService({ headless: true })
    this.onStatusUpdate = onStatusUpdate
    this.session = {
      id: sessionId,
      status: 'pending',
      progress: 0,
      currentStep: 'Initializing',
      fieldsTotal: 0,
      fieldsFilled: 0,
      customQuestions: [],
      screenshots: [],
      actionLog: []
    }
  }

  async apply(input: AutoApplyInput): Promise<AutoApplySession> {
    try {
      this.session.startedAt = new Date().toISOString()
      this.updateStatus('pending', 5, 'Initializing browser')

      // Initialize browser
      await this.browser.initialize()

      // Navigate to job URL
      this.updateStatus('navigating', 10, 'Navigating to application page')
      const navigated = await this.browser.navigateTo(input.jobUrl)
      if (!navigated) {
        throw new Error('Failed to navigate to job URL')
      }

      // Take initial screenshot
      const initialScreenshot = await this.browser.takeScreenshot('initial')
      this.session.screenshots.push(initialScreenshot)

      // Check if we're on the application page or need to find apply button
      const page = this.browser.getPage()!
      const isAppPage = await isApplicationPage(page)

      if (!isAppPage) {
        this.updateStatus('navigating', 15, 'Finding apply button')
        const applyUrl = await findApplyButton(page)
        if (applyUrl && applyUrl !== input.jobUrl) {
          await this.browser.navigateTo(applyUrl)
          await this.browser.waitForTimeout(2000)
        }
      }

      // Detect ATS
      this.updateStatus('detecting', 20, 'Detecting application system')
      const { handler, type, confidence } = await getHandler(page)
      this.session.atsDetected = type
      this.session.atsConfidence = confidence

      // Check for CAPTCHA
      if (handler.hasCaptcha && await handler.hasCaptcha(page)) {
        this.updateStatus('captcha', 25, 'CAPTCHA detected - requires manual intervention')
        const captchaScreenshot = await this.browser.takeScreenshot('captcha')
        this.session.screenshots.push(captchaScreenshot)
        return this.session
      }

      // Analyze form
      this.updateStatus('detecting', 30, 'Analyzing application form')
      const formAnalysis = await handler.analyzeForm(page)
      this.session.fieldsTotal = formAnalysis.fields.length
      this.session.customQuestions = formAnalysis.customQuestions

      // Generate documents
      this.updateStatus('filling', 35, 'Generating application documents')

      // Generate resume PDF
      const resumePdfBytes = await generateResumePDF(input.resumeData)
      const resumePdfBuffer = Buffer.from(resumePdfBytes)

      // Generate cover letter PDF
      const coverLetterData: CoverLetterData = {
        fullName: input.resumeData.fullName,
        email: input.resumeData.email,
        phone: input.resumeData.phone,
        date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
        companyName: input.companyName,
        jobTitle: input.jobTitle,
        content: input.coverLetterContent
      }
      const coverLetterPdfBytes = await generateCoverLetterPDF(coverLetterData)
      const coverLetterPdfBuffer = Buffer.from(coverLetterPdfBytes)

      // Prepare application data
      const nameParts = input.userProfile.fullName.split(' ')
      const applicationData: ApplicationData = {
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || '',
        fullName: input.userProfile.fullName,
        email: input.userProfile.email,
        phone: input.resumeData.phone,
        location: input.resumeData.location,
        portfolioUrl: input.resumeData.portfolioUrl,
        linkedinUrl: input.resumeData.linkedinUrl,
        currentCompany: input.userProfile.currentCompany,
        currentTitle: input.userProfile.currentTitle,
        yearsOfExperience: input.userProfile.yearsOfExperience,
        resumePdfBuffer,
        resumeFileName: `${input.userProfile.fullName.replace(/\s+/g, '_')}_Resume.pdf`,
        coverLetterPdfBuffer,
        coverLetterFileName: `${input.userProfile.fullName.replace(/\s+/g, '_')}_Cover_Letter.pdf`,
        coverLetterText: input.coverLetterContent
      }

      // Generate responses for custom questions
      if (formAnalysis.customQuestions.length > 0) {
        this.updateStatus('filling', 40, 'Generating answers for custom questions')

        const jobContext: JobContext = {
          title: input.jobTitle,
          company: input.companyName,
          description: input.jobDescription
        }

        const customResponses = await generateCustomResponses(
          formAnalysis.customQuestions,
          input.userProfile,
          jobContext,
          input.coverLetterContent
        )

        // Map question text to selector
        applicationData.customResponses = {}
        for (const q of formAnalysis.customQuestions) {
          if (customResponses[q.question]) {
            applicationData.customResponses[q.selector] = customResponses[q.question]
          }
        }
      }

      // Fill form fields
      this.updateStatus('filling', 50, 'Filling application form')
      const fillResult = await handler.fillApplication(page, applicationData)
      this.session.fieldsFilled = fillResult.fieldsFilled

      if (fillResult.errors.length > 0) {
        console.warn('Fill errors:', fillResult.errors)
      }

      // Take screenshot after filling
      const filledScreenshot = await this.browser.takeScreenshot('filled')
      this.session.screenshots.push(filledScreenshot)

      // Upload documents
      this.updateStatus('uploading', 70, 'Uploading resume and cover letter')
      const uploadResult = await handler.uploadDocuments(page, applicationData)

      if (uploadResult.errors.length > 0) {
        console.warn('Upload errors:', uploadResult.errors)
      }

      // Take screenshot after upload
      await this.browser.waitForTimeout(1500)
      const uploadedScreenshot = await this.browser.takeScreenshot('uploaded')
      this.session.screenshots.push(uploadedScreenshot)

      // Check for CAPTCHA before submitting
      if (handler.hasCaptcha && await handler.hasCaptcha(page)) {
        this.updateStatus('captcha', 85, 'CAPTCHA detected before submission')
        const captchaScreenshot = await this.browser.takeScreenshot('captcha_pre_submit')
        this.session.screenshots.push(captchaScreenshot)
        return this.session
      }

      // Submit application
      this.updateStatus('submitting', 90, 'Submitting application')
      const submitResult = await handler.submit(page)
      this.session.result = submitResult

      if (submitResult.confirmationScreenshot) {
        this.session.screenshots.push(submitResult.confirmationScreenshot)
      }

      if (submitResult.success) {
        this.updateStatus('completed', 100, 'Application submitted successfully')
      } else if (submitResult.requiresManualAction) {
        this.updateStatus('manual', 95, submitResult.manualActionReason || 'Manual action required')
      } else {
        this.updateStatus('failed', 95, submitResult.error || 'Submission failed')
        this.session.error = submitResult.error
      }

    } catch (error) {
      this.session.error = error instanceof Error ? error.message : 'Unknown error'
      this.updateStatus('failed', this.session.progress, `Error: ${this.session.error}`)

      try {
        const errorScreenshot = await this.browser.takeScreenshot('error')
        this.session.screenshots.push(errorScreenshot)
      } catch {
        // Ignore screenshot error
      }
    } finally {
      this.session.completedAt = new Date().toISOString()
      this.session.actionLog = this.browser.getActionLog()
      await this.browser.close()
    }

    return this.session
  }

  private updateStatus(status: AutoApplyStatus, progress: number, currentStep: string): void {
    this.session.status = status
    this.session.progress = progress
    this.session.currentStep = currentStep

    if (this.onStatusUpdate) {
      this.onStatusUpdate({ ...this.session })
    }
  }

  getSession(): AutoApplySession {
    return { ...this.session }
  }
}

// Helper to run auto-apply with proper error handling
export async function runAutoApply(
  sessionId: string,
  input: AutoApplyInput,
  onStatusUpdate?: (session: AutoApplySession) => void
): Promise<AutoApplySession> {
  const controller = new ApplyController(sessionId, onStatusUpdate)
  return controller.apply(input)
}
