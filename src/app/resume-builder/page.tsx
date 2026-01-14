'use client'

import { useState } from 'react'
import { Plus, Trash2, Sparkles, Download, Eye, Save } from 'lucide-react'

interface Experience {
  id: string
  company: string
  title: string
  startDate: string
  endDate: string
  isCurrent: boolean
  description: string
  highlights: string[]
}

interface Education {
  id: string
  institution: string
  degree: string
  fieldOfStudy: string
  startDate: string
  endDate: string
}

export default function ResumeBuilderPage() {
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit')
  const [isEnhancing, setIsEnhancing] = useState<string | null>(null)

  // Form state
  const [personalInfo, setPersonalInfo] = useState({
    fullName: '',
    email: '',
    phone: '',
    location: '',
    portfolioUrl: '',
    linkedinUrl: '',
    summary: '',
  })

  const [skills, setSkills] = useState<string[]>([])
  const [newSkill, setNewSkill] = useState('')

  const [experiences, setExperiences] = useState<Experience[]>([
    {
      id: '1',
      company: '',
      title: '',
      startDate: '',
      endDate: '',
      isCurrent: false,
      description: '',
      highlights: [''],
    },
  ])

  const [education, setEducation] = useState<Education[]>([
    {
      id: '1',
      institution: '',
      degree: '',
      fieldOfStudy: '',
      startDate: '',
      endDate: '',
    },
  ])

  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()])
      setNewSkill('')
    }
  }

  const removeSkill = (skill: string) => {
    setSkills(skills.filter((s) => s !== skill))
  }

  const addExperience = () => {
    setExperiences([
      ...experiences,
      {
        id: Date.now().toString(),
        company: '',
        title: '',
        startDate: '',
        endDate: '',
        isCurrent: false,
        description: '',
        highlights: [''],
      },
    ])
  }

  const removeExperience = (id: string) => {
    setExperiences(experiences.filter((e) => e.id !== id))
  }

  const updateExperience = (id: string, field: keyof Experience, value: any) => {
    setExperiences(
      experiences.map((e) => (e.id === id ? { ...e, [field]: value } : e))
    )
  }

  const addHighlight = (expId: string) => {
    setExperiences(
      experiences.map((e) =>
        e.id === expId ? { ...e, highlights: [...e.highlights, ''] } : e
      )
    )
  }

  const updateHighlight = (expId: string, index: number, value: string) => {
    setExperiences(
      experiences.map((e) =>
        e.id === expId
          ? {
              ...e,
              highlights: e.highlights.map((h, i) => (i === index ? value : h)),
            }
          : e
      )
    )
  }

  const enhanceHighlight = async (expId: string, index: number) => {
    const exp = experiences.find((e) => e.id === expId)
    if (!exp || !exp.highlights[index]) return

    setIsEnhancing(`${expId}-${index}`)

    try {
      const response = await fetch('/api/ai/enhance-bullet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bulletPoint: exp.highlights[index],
          jobTitle: exp.title,
          company: exp.company,
        }),
      })

      if (response.ok) {
        const { enhanced } = await response.json()
        updateHighlight(expId, index, enhanced)
      }
    } catch (error) {
      console.error('Failed to enhance:', error)
    } finally {
      setIsEnhancing(null)
    }
  }

  const addEducation = () => {
    setEducation([
      ...education,
      {
        id: Date.now().toString(),
        institution: '',
        degree: '',
        fieldOfStudy: '',
        startDate: '',
        endDate: '',
      },
    ])
  }

  const removeEducation = (id: string) => {
    setEducation(education.filter((e) => e.id !== id))
  }

  const updateEducation = (id: string, field: keyof Education, value: string) => {
    setEducation(
      education.map((e) => (e.id === id ? { ...e, [field]: value } : e))
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-16 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">Resume Builder</h1>

            <div className="flex items-center gap-4">
              {/* Tabs */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setActiveTab('edit')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'edit'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Edit
                </button>
                <button
                  onClick={() => setActiveTab('preview')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'preview'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Eye className="w-4 h-4 inline mr-1" />
                  Preview
                </button>
              </div>

              <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                <Save className="w-4 h-4" />
                Save
              </button>
              <button className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg">
                <Download className="w-4 h-4" />
                Export PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      {activeTab === 'edit' ? (
        <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
          {/* Personal Information */}
          <section className="bg-white rounded-xl p-6 border border-gray-200">
            <h2 className="text-lg font-semibold mb-4">Personal Information</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={personalInfo.fullName}
                  onChange={(e) =>
                    setPersonalInfo({ ...personalInfo, fullName: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Jane Designer"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={personalInfo.email}
                  onChange={(e) =>
                    setPersonalInfo({ ...personalInfo, email: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="jane@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={personalInfo.phone}
                  onChange={(e) =>
                    setPersonalInfo({ ...personalInfo, phone: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="+1 (555) 000-0000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={personalInfo.location}
                  onChange={(e) =>
                    setPersonalInfo({ ...personalInfo, location: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="San Francisco, CA"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Portfolio URL
                </label>
                <input
                  type="url"
                  value={personalInfo.portfolioUrl}
                  onChange={(e) =>
                    setPersonalInfo({ ...personalInfo, portfolioUrl: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="https://yourportfolio.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  LinkedIn
                </label>
                <input
                  type="url"
                  value={personalInfo.linkedinUrl}
                  onChange={(e) =>
                    setPersonalInfo({ ...personalInfo, linkedinUrl: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="https://linkedin.com/in/yourprofile"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Professional Summary
              </label>
              <textarea
                value={personalInfo.summary}
                onChange={(e) =>
                  setPersonalInfo({ ...personalInfo, summary: e.target.value })
                }
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="A brief summary of your experience and what you're looking for..."
              />
            </div>
          </section>

          {/* Skills */}
          <section className="bg-white rounded-xl p-6 border border-gray-200">
            <h2 className="text-lg font-semibold mb-4">Skills</h2>
            <div className="flex flex-wrap gap-2 mb-4">
              {skills.map((skill) => (
                <span
                  key={skill}
                  className="flex items-center gap-1 px-3 py-1.5 bg-primary-50 text-primary-700 rounded-lg"
                >
                  {skill}
                  <button
                    onClick={() => removeSkill(skill)}
                    className="hover:text-primary-900"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Add a skill (e.g., Figma, User Research)"
              />
              <button
                onClick={addSkill}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg"
              >
                Add
              </button>
            </div>
          </section>

          {/* Experience */}
          <section className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Work Experience</h2>
              <button
                onClick={addExperience}
                className="flex items-center gap-1 text-primary-600 hover:text-primary-700"
              >
                <Plus className="w-4 h-4" />
                Add Experience
              </button>
            </div>

            <div className="space-y-6">
              {experiences.map((exp, expIndex) => (
                <div
                  key={exp.id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-sm font-medium text-gray-500">
                      Experience {expIndex + 1}
                    </span>
                    {experiences.length > 1 && (
                      <button
                        onClick={() => removeExperience(exp.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Company
                      </label>
                      <input
                        type="text"
                        value={exp.company}
                        onChange={(e) =>
                          updateExperience(exp.id, 'company', e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="Company Name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Job Title
                      </label>
                      <input
                        type="text"
                        value={exp.title}
                        onChange={(e) =>
                          updateExperience(exp.id, 'title', e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="Product Designer"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Start Date
                      </label>
                      <input
                        type="month"
                        value={exp.startDate}
                        onChange={(e) =>
                          updateExperience(exp.id, 'startDate', e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        End Date
                      </label>
                      <input
                        type="month"
                        value={exp.endDate}
                        onChange={(e) =>
                          updateExperience(exp.id, 'endDate', e.target.value)
                        }
                        disabled={exp.isCurrent}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100"
                      />
                      <label className="flex items-center gap-2 mt-2 text-sm">
                        <input
                          type="checkbox"
                          checked={exp.isCurrent}
                          onChange={(e) =>
                            updateExperience(exp.id, 'isCurrent', e.target.checked)
                          }
                          className="rounded"
                        />
                        Currently working here
                      </label>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Key Achievements / Responsibilities
                    </label>
                    {exp.highlights.map((highlight, hIndex) => (
                      <div key={hIndex} className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={highlight}
                          onChange={(e) =>
                            updateHighlight(exp.id, hIndex, e.target.value)
                          }
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                          placeholder="Describe an achievement or responsibility..."
                        />
                        <button
                          onClick={() => enhanceHighlight(exp.id, hIndex)}
                          disabled={isEnhancing === `${exp.id}-${hIndex}`}
                          className="flex items-center gap-1 px-3 py-2 bg-primary-50 text-primary-700 hover:bg-primary-100 rounded-lg disabled:opacity-50"
                          title="Enhance with AI"
                        >
                          <Sparkles className="w-4 h-4" />
                          {isEnhancing === `${exp.id}-${hIndex}` ? '...' : 'AI'}
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => addHighlight(exp.id)}
                      className="text-sm text-primary-600 hover:text-primary-700"
                    >
                      + Add another point
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Education */}
          <section className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Education</h2>
              <button
                onClick={addEducation}
                className="flex items-center gap-1 text-primary-600 hover:text-primary-700"
              >
                <Plus className="w-4 h-4" />
                Add Education
              </button>
            </div>

            <div className="space-y-6">
              {education.map((edu, eduIndex) => (
                <div
                  key={edu.id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-sm font-medium text-gray-500">
                      Education {eduIndex + 1}
                    </span>
                    {education.length > 1 && (
                      <button
                        onClick={() => removeEducation(edu.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Institution
                      </label>
                      <input
                        type="text"
                        value={edu.institution}
                        onChange={(e) =>
                          updateEducation(edu.id, 'institution', e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="University Name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Degree
                      </label>
                      <input
                        type="text"
                        value={edu.degree}
                        onChange={(e) =>
                          updateEducation(edu.id, 'degree', e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="Bachelor's, Master's, etc."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Field of Study
                      </label>
                      <input
                        type="text"
                        value={edu.fieldOfStudy}
                        onChange={(e) =>
                          updateEducation(edu.id, 'fieldOfStudy', e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="Graphic Design, HCI, etc."
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Start
                        </label>
                        <input
                          type="month"
                          value={edu.startDate}
                          onChange={(e) =>
                            updateEducation(edu.id, 'startDate', e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          End
                        </label>
                        <input
                          type="month"
                          value={edu.endDate}
                          onChange={(e) =>
                            updateEducation(edu.id, 'endDate', e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : (
        /* Preview Mode */
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
            {/* Preview Header */}
            <div className="border-b border-gray-200 pb-6 mb-6">
              <h1 className="text-3xl font-bold text-gray-900">
                {personalInfo.fullName || 'Your Name'}
              </h1>
              <div className="flex flex-wrap gap-4 mt-2 text-gray-600">
                {personalInfo.email && <span>{personalInfo.email}</span>}
                {personalInfo.phone && <span>{personalInfo.phone}</span>}
                {personalInfo.location && <span>{personalInfo.location}</span>}
              </div>
              {(personalInfo.portfolioUrl || personalInfo.linkedinUrl) && (
                <div className="flex gap-4 mt-2 text-primary-600">
                  {personalInfo.portfolioUrl && (
                    <span>{personalInfo.portfolioUrl}</span>
                  )}
                  {personalInfo.linkedinUrl && (
                    <span>{personalInfo.linkedinUrl}</span>
                  )}
                </div>
              )}
            </div>

            {/* Summary */}
            {personalInfo.summary && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                  Summary
                </h2>
                <p className="text-gray-600">{personalInfo.summary}</p>
              </div>
            )}

            {/* Skills */}
            {skills.length > 0 && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                  Skills
                </h2>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill) => (
                    <span
                      key={skill}
                      className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Experience */}
            {experiences.some((e) => e.company || e.title) && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Experience
                </h2>
                <div className="space-y-4">
                  {experiences
                    .filter((e) => e.company || e.title)
                    .map((exp) => (
                      <div key={exp.id}>
                        <div className="flex justify-between">
                          <div>
                            <h3 className="font-medium text-gray-900">
                              {exp.title}
                            </h3>
                            <p className="text-gray-600">{exp.company}</p>
                          </div>
                          <span className="text-sm text-gray-500">
                            {exp.startDate} - {exp.isCurrent ? 'Present' : exp.endDate}
                          </span>
                        </div>
                        {exp.highlights.filter(Boolean).length > 0 && (
                          <ul className="mt-2 space-y-1">
                            {exp.highlights.filter(Boolean).map((h, i) => (
                              <li key={i} className="text-gray-600 text-sm flex">
                                <span className="mr-2">•</span>
                                {h}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Education */}
            {education.some((e) => e.institution || e.degree) && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Education
                </h2>
                <div className="space-y-4">
                  {education
                    .filter((e) => e.institution || e.degree)
                    .map((edu) => (
                      <div key={edu.id} className="flex justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {edu.degree}
                            {edu.fieldOfStudy && ` in ${edu.fieldOfStudy}`}
                          </h3>
                          <p className="text-gray-600">{edu.institution}</p>
                        </div>
                        <span className="text-sm text-gray-500">
                          {edu.startDate} - {edu.endDate}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
