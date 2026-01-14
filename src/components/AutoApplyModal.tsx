'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { X, Loader2, CheckCircle, AlertCircle, FileText, User, Mail, Phone, MapPin, Briefcase, ExternalLink, Upload, File, Trash2 } from 'lucide-react'

interface Job {
  id: string
  title: string
  company: string
  location: string
  apply_url: string
  description: string
}

interface UserProfile {
  fullName: string
  email: string
  phone?: string
  location?: string
  headline?: string
  summary?: string
  skills: string[]
  yearsOfExperience?: number
  currentCompany?: string
  currentTitle?: string
  portfolioUrl?: string
  linkedinUrl?: string
}

interface ResumeData {
  fullName: string
  email: string
  phone?: string
  location?: string
  summary?: string
  skills: string[]
  portfolioUrl?: string
  linkedinUrl?: string
  experiences: {
    company: string
    title: string
    location?: string
    startDate: string
    endDate?: string
    isCurrent: boolean
    description?: string
    highlights: string[]
  }[]
  education: {
    institution: string
    degree: string
    fieldOfStudy?: string
    startDate?: string
    endDate?: string
    gpa?: string
  }[]
}

interface AutoApplyModalProps {
  job: Job
  isOpen: boolean
  onClose: () => void
  userProfile?: UserProfile
  resumeData?: ResumeData
}

type ModalStep = 'profile' | 'cover-letter' | 'review' | 'applying' | 'result'

interface ApplyStatus {
  status: string
  progress: number
  currentStep: string
  error?: string
  result?: {
    success: boolean
    confirmationMessage?: string
    confirmationScreenshot?: string
  }
}

export function AutoApplyModal({ job, isOpen, onClose, userProfile: initialProfile, resumeData: initialResume }: AutoApplyModalProps) {
  const [step, setStep] = useState<ModalStep>('profile')
  const [isLoading, setIsLoading] = useState(false)

  // Form state
  const [profile, setProfile] = useState<UserProfile>(initialProfile || {
    fullName: '',
    email: '',
    phone: '',
    location: '',
    headline: '',
    summary: '',
    skills: [],
    currentCompany: '',
    currentTitle: '',
    portfolioUrl: '',
    linkedinUrl: ''
  })

  const [resume, setResume] = useState<ResumeData>(initialResume || {
    fullName: '',
    email: '',
    phone: '',
    location: '',
    summary: '',
    skills: [],
    portfolioUrl: '',
    linkedinUrl: '',
    experiences: [],
    education: []
  })

  const [coverLetter, setCoverLetter] = useState('')
  const [isGeneratingCoverLetter, setIsGeneratingCoverLetter] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [applyStatus, setApplyStatus] = useState<ApplyStatus | null>(null)

  // Resume upload state
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isParsingResume, setIsParsingResume] = useState(false)
  const [parseError, setParseError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Handle resume upload and parsing
  const handleResumeUpload = async (file: File) => {
    setUploadedFile(file)
    setParseError(null)
    setIsParsingResume(true)

    try {
      const formData = new FormData()
      formData.append('resume', file)

      const response = await fetch('/api/resume/parse', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to parse resume')
      }

      const { data } = await response.json()

      // Update profile with parsed data
      setProfile(prev => ({
        ...prev,
        fullName: data.fullName || prev.fullName,
        email: data.email || prev.email,
        phone: data.phone || prev.phone,
        location: data.location || prev.location,
        headline: data.headline || prev.headline,
        summary: data.summary || prev.summary,
        skills: data.skills?.length > 0 ? data.skills : prev.skills,
        yearsOfExperience: data.yearsOfExperience || prev.yearsOfExperience,
        currentCompany: data.currentCompany || prev.currentCompany,
        currentTitle: data.currentTitle || prev.currentTitle,
        portfolioUrl: data.portfolioUrl || prev.portfolioUrl,
        linkedinUrl: data.linkedinUrl || prev.linkedinUrl
      }))

      // Update resume data
      setResume(prev => ({
        ...prev,
        fullName: data.fullName || prev.fullName,
        email: data.email || prev.email,
        phone: data.phone || prev.phone,
        location: data.location || prev.location,
        summary: data.summary || prev.summary,
        skills: data.skills?.length > 0 ? data.skills : prev.skills,
        portfolioUrl: data.portfolioUrl || prev.portfolioUrl,
        linkedinUrl: data.linkedinUrl || prev.linkedinUrl,
        experiences: data.experiences?.length > 0 ? data.experiences : prev.experiences,
        education: data.education?.length > 0 ? data.education : prev.education
      }))

    } catch (error) {
      console.error('Resume parse error:', error)
      setParseError(error instanceof Error ? error.message : 'Failed to parse resume')
    } finally {
      setIsParsingResume(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleResumeUpload(file)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleResumeUpload(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const removeUploadedFile = () => {
    setUploadedFile(null)
    setParseError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Generate cover letter using AI
  const generateCoverLetter = async () => {
    setIsGeneratingCoverLetter(true)
    try {
      const response = await fetch('/api/ai/cover-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobTitle: job.title,
          company: job.company,
          jobDescription: job.description,
          resumeSummary: resume.summary || profile.summary,
          skills: resume.skills.length > 0 ? resume.skills : profile.skills,
          experience: resume.experiences.slice(0, 2).map(e => `${e.title} at ${e.company}`)
        })
      })

      if (response.ok) {
        const data = await response.json()
        setCoverLetter(data.coverLetter)
      }
    } catch (error) {
      console.error('Failed to generate cover letter:', error)
    } finally {
      setIsGeneratingCoverLetter(false)
    }
  }

  // Sync profile with resume
  useEffect(() => {
    if (profile.fullName && !resume.fullName) {
      setResume(prev => ({
        ...prev,
        fullName: profile.fullName,
        email: profile.email,
        phone: profile.phone,
        location: profile.location,
        summary: profile.summary,
        skills: profile.skills,
        portfolioUrl: profile.portfolioUrl,
        linkedinUrl: profile.linkedinUrl
      }))
    }
  }, [profile, resume.fullName])

  // Poll for status updates
  const pollStatus = useCallback(async (sid: string) => {
    try {
      const response = await fetch(`/api/applications/auto-apply/${sid}`)
      if (response.ok) {
        const data = await response.json()
        setApplyStatus(data)

        // Continue polling if still in progress
        if (!['completed', 'failed', 'captcha', 'manual'].includes(data.status)) {
          setTimeout(() => pollStatus(sid), 2000)
        }
      }
    } catch (error) {
      console.error('Failed to poll status:', error)
    }
  }, [])

  // Start auto-apply
  const startAutoApply = async () => {
    setIsLoading(true)
    setStep('applying')

    try {
      const response = await fetch('/api/applications/auto-apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobUrl: job.apply_url,
          jobTitle: job.title,
          companyName: job.company,
          jobDescription: job.description,
          userProfile: profile,
          resumeData: resume,
          coverLetterContent: coverLetter
        })
      })

      if (response.ok) {
        const data = await response.json()
        setSessionId(data.sessionId)
        pollStatus(data.sessionId)
      } else {
        throw new Error('Failed to start auto-apply')
      }
    } catch (error) {
      console.error('Auto-apply error:', error)
      setApplyStatus({
        status: 'failed',
        progress: 0,
        currentStep: 'Failed to start',
        error: 'Failed to start auto-apply process'
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Validate profile
  const isProfileValid = profile.fullName && profile.email

  // Validate for submission
  const isReadyToApply = isProfileValid && coverLetter.length > 50

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-xl font-semibold">Auto Apply</h2>
            <p className="text-sm text-gray-500">{job.title} at {job.company}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Steps indicator */}
        {step !== 'applying' && step !== 'result' && (
          <div className="flex items-center justify-center gap-2 py-3 bg-gray-50 border-b">
            {['profile', 'cover-letter', 'review'].map((s, i) => (
              <div key={s} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step === s ? 'bg-primary-600 text-white' :
                  ['profile', 'cover-letter', 'review'].indexOf(step) > i ? 'bg-green-500 text-white' :
                  'bg-gray-200 text-gray-500'
                }`}>
                  {['profile', 'cover-letter', 'review'].indexOf(step) > i ? '✓' : i + 1}
                </div>
                {i < 2 && <div className="w-12 h-0.5 bg-gray-200 mx-2" />}
              </div>
            ))}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Profile Step */}
          {step === 'profile' && (
            <div className="space-y-4">
              {/* Resume Upload Section */}
              <div className="mb-6">
                <h3 className="text-lg font-medium flex items-center gap-2 mb-3">
                  <Upload className="w-5 h-5" />
                  Upload Your Resume
                </h3>
                <p className="text-sm text-gray-500 mb-3">
                  Upload your resume to auto-fill your information, or enter it manually below.
                </p>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept=".pdf,.txt"
                  className="hidden"
                />

                {!uploadedFile ? (
                  <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-primary-500 hover:bg-primary-50 transition-colors"
                  >
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">
                      <span className="text-primary-600 font-medium">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-400 mt-1">PDF or TXT (max 5MB)</p>
                  </div>
                ) : (
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary-100 rounded-lg">
                          <File className="w-5 h-5 text-primary-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{uploadedFile.name}</p>
                          <p className="text-xs text-gray-500">
                            {(uploadedFile.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isParsingResume ? (
                          <div className="flex items-center gap-2 text-primary-600">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="text-sm">Parsing...</span>
                          </div>
                        ) : parseError ? (
                          <span className="text-sm text-red-500">Failed</span>
                        ) : (
                          <span className="text-sm text-green-600 flex items-center gap-1">
                            <CheckCircle className="w-4 h-4" />
                            Parsed
                          </span>
                        )}
                        <button
                          onClick={removeUploadedFile}
                          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Remove file"
                        >
                          <Trash2 className="w-4 h-4 text-gray-500" />
                        </button>
                      </div>
                    </div>
                    {parseError && (
                      <p className="text-sm text-red-500 mt-2">{parseError}</p>
                    )}
                  </div>
                )}
              </div>

              <div className="border-t pt-4">
                <h3 className="text-lg font-medium flex items-center gap-2 mb-4">
                  <User className="w-5 h-5" />
                  Your Information
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={profile.fullName}
                    onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="john@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input
                    type="text"
                    value={profile.location}
                    onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="San Francisco, CA"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Headline</label>
                <input
                  type="text"
                  value={profile.headline}
                  onChange={(e) => setProfile({ ...profile, headline: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Senior Product Designer"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Portfolio URL</label>
                  <input
                    type="url"
                    value={profile.portfolioUrl}
                    onChange={(e) => setProfile({ ...profile, portfolioUrl: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="https://portfolio.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn URL</label>
                  <input
                    type="url"
                    value={profile.linkedinUrl}
                    onChange={(e) => setProfile({ ...profile, linkedinUrl: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="https://linkedin.com/in/..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Skills (comma-separated)
                </label>
                <input
                  type="text"
                  value={profile.skills.join(', ')}
                  onChange={(e) => setProfile({ ...profile, skills: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Figma, UI Design, Prototyping, User Research"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Summary</label>
                <textarea
                  value={profile.summary}
                  onChange={(e) => setProfile({ ...profile, summary: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Brief summary of your experience..."
                />
              </div>
            </div>
          )}

          {/* Cover Letter Step */}
          {step === 'cover-letter' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Cover Letter
                </h3>
                <button
                  onClick={generateCoverLetter}
                  disabled={isGeneratingCoverLetter}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                >
                  {isGeneratingCoverLetter ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>Generate with AI</>
                  )}
                </button>
              </div>

              <textarea
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                rows={12}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-sm"
                placeholder="Write your cover letter here or click 'Generate with AI' to auto-generate one based on your profile and the job description..."
              />

              <p className="text-sm text-gray-500">
                {coverLetter.length} characters ({coverLetter.split(/\s+/).filter(Boolean).length} words)
              </p>
            </div>
          )}

          {/* Review Step */}
          {step === 'review' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium">Review Your Application</h3>

              {/* Job Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900">{job.title}</h4>
                <p className="text-gray-600">{job.company}</p>
                <p className="text-sm text-gray-500">{job.location}</p>
              </div>

              {/* Profile Summary */}
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Your Profile
                </h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span>{profile.fullName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span>{profile.email}</span>
                  </div>
                  {profile.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span>{profile.phone}</span>
                    </div>
                  )}
                  {profile.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span>{profile.location}</span>
                    </div>
                  )}
                </div>
                {profile.skills.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {profile.skills.slice(0, 6).map(skill => (
                      <span key={skill} className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">
                        {skill}
                      </span>
                    ))}
                    {profile.skills.length > 6 && (
                      <span className="text-xs text-gray-400">+{profile.skills.length - 6} more</span>
                    )}
                  </div>
                )}
              </div>

              {/* Cover Letter Preview */}
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Cover Letter
                </h4>
                <p className="text-sm text-gray-600 whitespace-pre-wrap line-clamp-6">
                  {coverLetter}
                </p>
              </div>

              {/* Warning */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm">
                <p className="font-medium text-yellow-800">Before you apply:</p>
                <ul className="list-disc ml-5 mt-2 text-yellow-700 space-y-1">
                  <li>Your application will be submitted automatically</li>
                  <li>Make sure all information is accurate</li>
                  <li>You may need to complete a CAPTCHA manually</li>
                </ul>
              </div>
            </div>
          )}

          {/* Applying Step */}
          {step === 'applying' && (
            <div className="text-center py-8 space-y-6">
              <Loader2 className="w-12 h-12 text-primary-600 animate-spin mx-auto" />

              <div>
                <h3 className="text-lg font-medium">
                  {applyStatus?.currentStep || 'Starting auto-apply...'}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Please wait while we submit your application
                </p>
              </div>

              {/* Progress bar */}
              <div className="max-w-md mx-auto">
                <div className="flex justify-between text-sm text-gray-500 mb-1">
                  <span>Progress</span>
                  <span>{applyStatus?.progress || 0}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${applyStatus?.progress || 0}%` }}
                  />
                </div>
              </div>

              {applyStatus?.status === 'captcha' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="font-medium text-yellow-800">CAPTCHA Required</p>
                  <p className="text-sm text-yellow-700 mt-1">
                    Please complete the CAPTCHA in the browser to continue.
                  </p>
                </div>
              )}

              {applyStatus?.status === 'completed' && (
                <div className="text-center">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-green-700">Application Submitted!</h3>
                  <p className="text-gray-600 mt-2">
                    {applyStatus.result?.confirmationMessage || 'Your application has been submitted successfully.'}
                  </p>
                  {applyStatus.result?.confirmationScreenshot && (
                    <img
                      src={applyStatus.result.confirmationScreenshot}
                      alt="Confirmation"
                      className="mt-4 rounded-lg border max-w-full"
                    />
                  )}
                </div>
              )}

              {applyStatus?.status === 'failed' && (
                <div className="text-center">
                  <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-red-700">Application Failed</h3>
                  <p className="text-gray-600 mt-2">
                    {applyStatus.error || 'Something went wrong. Please try again or apply manually.'}
                  </p>
                  <a
                    href={job.apply_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Apply Manually
                  </a>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {step !== 'applying' && (
          <div className="flex items-center justify-between p-4 border-t bg-gray-50">
            <button
              onClick={() => {
                if (step === 'cover-letter') setStep('profile')
                else if (step === 'review') setStep('cover-letter')
                else onClose()
              }}
              className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
            >
              {step === 'profile' ? 'Cancel' : 'Back'}
            </button>

            {step === 'profile' && (
              <button
                onClick={() => setStep('cover-letter')}
                disabled={!isProfileValid}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            )}

            {step === 'cover-letter' && (
              <button
                onClick={() => setStep('review')}
                disabled={coverLetter.length < 50}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            )}

            {step === 'review' && (
              <button
                onClick={startAutoApply}
                disabled={!isReadyToApply || isLoading}
                className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Starting...
                  </>
                ) : (
                  <>
                    <Briefcase className="w-4 h-4" />
                    Submit Application
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {/* Close button for completed/failed states */}
        {(applyStatus?.status === 'completed' || applyStatus?.status === 'failed') && (
          <div className="flex justify-center p-4 border-t bg-gray-50">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
