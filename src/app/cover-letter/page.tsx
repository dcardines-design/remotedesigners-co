'use client'

import { useState } from 'react'
import { Sparkles, Copy, Download, RefreshCw, Check } from 'lucide-react'

export default function CoverLetterPage() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [coverLetter, setCoverLetter] = useState('')
  const [copied, setCopied] = useState(false)

  const [formData, setFormData] = useState({
    jobTitle: '',
    company: '',
    jobDescription: '',
    yourName: '',
    yourExperience: '',
    yourSkills: '',
    tone: 'professional',
  })

  const generateCoverLetter = async () => {
    setIsGenerating(true)

    try {
      const response = await fetch('/api/ai/cover-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const { coverLetter: generated } = await response.json()
        setCoverLetter(generated)
      } else {
        // Demo fallback for when API isn't configured
        setCoverLetter(`Dear Hiring Manager,

I am writing to express my strong interest in the ${formData.jobTitle || '[Job Title]'} position at ${formData.company || '[Company]'}. With my background in ${formData.yourSkills || 'design'} and passion for creating exceptional user experiences, I am excited about the opportunity to contribute to your team.

${formData.yourExperience || 'Throughout my career, I have developed expertise in user-centered design principles and have successfully delivered impactful design solutions. I am particularly drawn to this role because it aligns perfectly with my skills and career aspirations.'}

I am impressed by ${formData.company || 'your company'}'s commitment to innovation and would welcome the opportunity to bring my skills and enthusiasm to your team. I am confident that my experience and passion for design would make me a valuable addition.

Thank you for considering my application. I look forward to the opportunity to discuss how I can contribute to ${formData.company || 'your team'}'s continued success.

Best regards,
${formData.yourName || '[Your Name]'}`)
      }
    } catch (error) {
      console.error('Failed to generate:', error)
      // Show demo content on error
      setCoverLetter(`Dear Hiring Manager,

I am writing to express my strong interest in the ${formData.jobTitle || '[Job Title]'} position at ${formData.company || '[Company]'}. With my background in ${formData.yourSkills || 'design'} and passion for creating exceptional user experiences, I am excited about the opportunity to contribute to your team.

Thank you for considering my application.

Best regards,
${formData.yourName || '[Your Name]'}`)
    } finally {
      setIsGenerating(false)
    }
  }

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(coverLetter)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            AI Cover Letter Generator
          </h1>
          <p className="text-gray-600 mt-2">
            Generate personalized cover letters tailored to each job application
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Input Form */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h2 className="text-lg font-semibold mb-4">Job Details</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Job Title *
                  </label>
                  <input
                    type="text"
                    value={formData.jobTitle}
                    onChange={(e) =>
                      setFormData({ ...formData, jobTitle: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Senior Product Designer"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) =>
                      setFormData({ ...formData, company: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Figma"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Job Description
                  </label>
                  <textarea
                    value={formData.jobDescription}
                    onChange={(e) =>
                      setFormData({ ...formData, jobDescription: e.target.value })
                    }
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Paste the job description here for a more personalized cover letter..."
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h2 className="text-lg font-semibold mb-4">Your Information</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    value={formData.yourName}
                    onChange={(e) =>
                      setFormData({ ...formData, yourName: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Jane Designer"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Relevant Skills
                  </label>
                  <input
                    type="text"
                    value={formData.yourSkills}
                    onChange={(e) =>
                      setFormData({ ...formData, yourSkills: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="UI/UX Design, Figma, User Research, Design Systems"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Brief Experience Summary
                  </label>
                  <textarea
                    value={formData.yourExperience}
                    onChange={(e) =>
                      setFormData({ ...formData, yourExperience: e.target.value })
                    }
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="I have 5 years of experience as a Product Designer, most recently at Stripe where I led the design of their checkout flow..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tone
                  </label>
                  <select
                    value={formData.tone}
                    onChange={(e) =>
                      setFormData({ ...formData, tone: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="professional">Professional</option>
                    <option value="friendly">Friendly & Warm</option>
                    <option value="confident">Confident & Bold</option>
                    <option value="creative">Creative & Unique</option>
                  </select>
                </div>
              </div>
            </div>

            <button
              onClick={generateCoverLetter}
              disabled={isGenerating || !formData.jobTitle || !formData.company || !formData.yourName}
              className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 text-white py-3 rounded-lg font-medium transition-colors"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Generate Cover Letter
                </>
              )}
            </button>
          </div>

          {/* Output */}
          <div className="lg:sticky lg:top-24 h-fit">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h2 className="font-semibold text-gray-900">Generated Cover Letter</h2>
                {coverLetter && (
                  <div className="flex gap-2">
                    <button
                      onClick={copyToClipboard}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4 text-green-500" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Copy
                        </>
                      )}
                    </button>
                    <button className="flex items-center gap-1 px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                      <Download className="w-4 h-4" />
                      Download
                    </button>
                  </div>
                )}
              </div>

              <div className="p-6 min-h-[500px]">
                {coverLetter ? (
                  <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                    {coverLetter}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center py-20">
                    <Sparkles className="w-12 h-12 text-gray-300 mb-4" />
                    <p className="text-gray-500">
                      Fill in the details and click "Generate" to create your
                      personalized cover letter
                    </p>
                  </div>
                )}
              </div>
            </div>

            {coverLetter && (
              <div className="mt-4 p-4 bg-primary-50 rounded-lg border border-primary-200">
                <p className="text-sm text-primary-800">
                  <strong>Tip:</strong> Review and personalize the generated content.
                  Add specific examples from your experience to make it more authentic.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
