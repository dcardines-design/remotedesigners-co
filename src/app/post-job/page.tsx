'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Input } from '@/components/ui'

const JOB_TYPES = ['full-time', 'part-time', 'contract', 'freelance', 'internship']

// Shared input styling to match our Input component
const inputStyles = `
  w-full px-4 py-2.5
  border border-neutral-200 rounded-lg
  bg-white text-neutral-900
  placeholder:text-neutral-400
  hover:border-neutral-300 hover:shadow-[0px_2px_0px_0px_rgba(0,0,0,0.04)]
  focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400
  transition-all
`
const EXPERIENCE_LEVELS = ['entry', 'mid', 'senior', 'lead', 'executive']
const COMMON_SKILLS = [
  'Figma', 'Sketch', 'Adobe XD', 'Photoshop', 'Illustrator',
  'UI Design', 'UX Design', 'Product Design', 'Brand Design',
  'Design Systems', 'Prototyping', 'User Research', 'Wireframing',
  'Motion Design', 'Interaction Design', 'Visual Design',
]

function toTitleCase(str: string) {
  return str.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function formatSalary(min?: string, max?: string) {
  if (!min && !max) return null
  const minNum = min ? parseInt(min) : null
  const maxNum = max ? parseInt(max) : null

  if (minNum && maxNum) {
    return `$${Math.round(minNum / 1000)}k - $${Math.round(maxNum / 1000)}k`
  } else if (minNum) {
    return `$${Math.round(minNum / 1000)}k+`
  } else if (maxNum) {
    return `Up to $${Math.round(maxNum / 1000)}k`
  }
  return null
}

function getCompanyLogoUrl(company: string) {
  const domain = company.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com'
  return `https://logo.clearbit.com/${domain}`
}

function getInitials(company: string) {
  return company.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

export default function PostJobPage() {
  const [loading, setLoading] = useState(false)
  const [logoError, setLogoError] = useState(false)
  const [form, setForm] = useState({
    title: '',
    company: '',
    company_logo: '',
    location: 'Remote',
    salary_min: '',
    salary_max: '',
    description: '',
    job_type: 'full-time',
    experience_level: 'mid',
    skills: [] as string[],
    apply_url: '',
    is_featured: false,
    social_boost: false,
    extended_duration: false,
  })

  const calculateTotal = () => {
    let total = 99
    if (form.is_featured) total += 50
    if (form.social_boost) total += 29
    if (form.extended_duration) total += 49
    return total
  }

  const toggleSkill = (skill: string) => {
    setForm(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          salary_min: form.salary_min ? parseInt(form.salary_min) : undefined,
          salary_max: form.salary_max ? parseInt(form.salary_max) : undefined,
        }),
      })

      const data = await response.json()

      if (data.url) {
        window.location.href = data.url
      } else {
        alert('Failed to create checkout session')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  // Reset logo error when company changes
  const handleCompanyChange = (value: string) => {
    setLogoError(false)
    setForm({ ...form, company: value })
  }

  const salary = formatSalary(form.salary_min, form.salary_max)

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-700 transition-colors mb-4"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to jobs
          </Link>
          <h1 className="text-4xl font-semibold text-neutral-900">Post a Job</h1>
          <p className="text-neutral-500 mt-2">
            Reach thousands of remote designers looking for their next role
          </p>
        </div>

        <div className="flex gap-8">
          {/* Form Column */}
          <div className="flex-1 max-w-2xl">
            <form onSubmit={handleSubmit} className="space-y-8">
          {/* Job Details */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-6 space-y-5">
            <h2 className="text-lg font-medium text-neutral-900">Job Details</h2>

            <Input
              label="Job Title *"
              type="text"
              required
              placeholder="e.g. Senior Product Designer"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Company Name *"
                type="text"
                required
                placeholder="e.g. Acme Inc"
                value={form.company}
                onChange={e => handleCompanyChange(e.target.value)}
              />
              <Input
                label="Company Logo URL"
                type="url"
                placeholder="https://..."
                value={form.company_logo}
                onChange={e => setForm({ ...form, company_logo: e.target.value })}
              />
            </div>

            <Input
              label="Location *"
              type="text"
              required
              placeholder="e.g. Remote (US) or Remote (Worldwide)"
              value={form.location}
              onChange={e => setForm({ ...form, location: e.target.value })}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Salary Min (USD/year)"
                type="number"
                placeholder="e.g. 80000"
                value={form.salary_min}
                onChange={e => setForm({ ...form, salary_min: e.target.value })}
              />
              <Input
                label="Salary Max (USD/year)"
                type="number"
                placeholder="e.g. 120000"
                value={form.salary_max}
                onChange={e => setForm({ ...form, salary_max: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Job Type<span className="text-red-500"> *</span>
                </label>
                <select
                  required
                  value={form.job_type}
                  onChange={e => setForm({ ...form, job_type: e.target.value })}
                  className={inputStyles}
                >
                  {JOB_TYPES.map(type => (
                    <option key={type} value={type}>
                      {toTitleCase(type)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Experience Level<span className="text-red-500"> *</span>
                </label>
                <select
                  required
                  value={form.experience_level}
                  onChange={e => setForm({ ...form, experience_level: e.target.value })}
                  className={inputStyles}
                >
                  {EXPERIENCE_LEVELS.map(level => (
                    <option key={level} value={level}>
                      {toTitleCase(level)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <Input
              label="Application URL *"
              type="url"
              required
              placeholder="https://yourcompany.com/careers/apply"
              value={form.apply_url}
              onChange={e => setForm({ ...form, apply_url: e.target.value })}
            />
          </div>

          {/* Description */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-6 space-y-4">
            <label className="block text-sm font-medium text-neutral-700">
              Job Description<span className="text-red-500"> *</span>
            </label>
            <textarea
              required
              rows={10}
              placeholder="Describe the role, responsibilities, requirements, and what makes your company great..."
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              className={`${inputStyles} resize-none`}
            />
          </div>

          {/* Skills */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-6 space-y-4">
            <h2 className="text-lg font-medium text-neutral-900">Skills</h2>
            <p className="text-sm text-neutral-500">Select relevant skills for this role</p>
            <div className="flex flex-wrap gap-2">
              {COMMON_SKILLS.map(skill => (
                <button
                  key={skill}
                  type="button"
                  onClick={() => toggleSkill(skill)}
                  className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                    form.skills.includes(skill)
                      ? 'bg-neutral-900 text-white'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                  }`}
                >
                  {skill}
                </button>
              ))}
            </div>
          </div>

          {/* Upsells */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-6 space-y-4">
            <h2 className="text-lg font-medium text-neutral-900">Boost Your Listing</h2>
            <p className="text-sm text-neutral-500">Optional add-ons to get more visibility</p>

            <div className="space-y-3">
              {/* Featured */}
              <label className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                form.is_featured ? 'border-amber-400 bg-amber-50' : 'border-neutral-200 hover:border-neutral-300'
              }`}>
                <input
                  type="checkbox"
                  checked={form.is_featured}
                  onChange={e => setForm({ ...form, is_featured: e.target.checked })}
                  className="mt-1 w-5 h-5 rounded border-neutral-300 text-amber-500 focus:ring-amber-500"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-neutral-900">Featured Listing</span>
                    <span className="px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 rounded-full">
                      +$50
                    </span>
                  </div>
                  <p className="text-sm text-neutral-500 mt-0.5">
                    Highlighted with a golden badge, pinned to top of search results
                  </p>
                </div>
              </label>

              {/* Social Boost */}
              <label className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                form.social_boost ? 'border-blue-400 bg-blue-50' : 'border-neutral-200 hover:border-neutral-300'
              }`}>
                <input
                  type="checkbox"
                  checked={form.social_boost}
                  onChange={e => setForm({ ...form, social_boost: e.target.checked })}
                  className="mt-1 w-5 h-5 rounded border-neutral-300 text-blue-500 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-neutral-900">Social Boost</span>
                    <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                      +$29
                    </span>
                  </div>
                  <p className="text-sm text-neutral-500 mt-0.5">
                    Shared on our Twitter/X and included in our newsletter
                  </p>
                </div>
              </label>

              {/* Extended Duration */}
              <label className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                form.extended_duration ? 'border-green-400 bg-green-50' : 'border-neutral-200 hover:border-neutral-300'
              }`}>
                <input
                  type="checkbox"
                  checked={form.extended_duration}
                  onChange={e => setForm({ ...form, extended_duration: e.target.checked })}
                  className="mt-1 w-5 h-5 rounded border-neutral-300 text-green-500 focus:ring-green-500"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-neutral-900">Extended Duration</span>
                    <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                      +$49
                    </span>
                  </div>
                  <p className="text-sm text-neutral-500 mt-0.5">
                    Keep your listing live for 60 days instead of 30
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Order Summary & Submit */}
          <div className="bg-neutral-900 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <span className="text-neutral-400">Base posting (30 days)</span>
              <span>$99</span>
            </div>
            {form.is_featured && (
              <div className="flex items-center justify-between mb-4">
                <span className="text-neutral-400">Featured listing</span>
                <span>$50</span>
              </div>
            )}
            {form.social_boost && (
              <div className="flex items-center justify-between mb-4">
                <span className="text-neutral-400">Social boost</span>
                <span>$29</span>
              </div>
            )}
            {form.extended_duration && (
              <div className="flex items-center justify-between mb-4">
                <span className="text-neutral-400">Extended duration</span>
                <span>$49</span>
              </div>
            )}
            <div className="border-t border-neutral-700 pt-4 mb-6">
              <div className="flex items-center justify-between text-lg font-semibold">
                <span>Total</span>
                <span>${calculateTotal()}</span>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-white text-neutral-900 font-semibold rounded-xl hover:bg-neutral-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : `Post Job - $${calculateTotal()}`}
            </button>
          </div>
        </form>
      </div>

      {/* Preview Column */}
      <div className="w-80 flex-shrink-0 hidden lg:block">
        <div className="sticky top-8">
          <p className="text-sm text-neutral-500 mb-3">Preview</p>

          {/* Job Card Preview */}
          <div className={`border rounded-xl p-5 relative transition-all ${
            form.is_featured
              ? 'bg-amber-50 border-amber-200'
              : 'bg-white border-neutral-200'
          }`}>
            {/* Left border indicator */}
            <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${
              form.is_featured ? 'bg-amber-400' : 'bg-green-500'
            }`} />

            <div className="flex gap-4 pl-3">
              {/* Company Avatar */}
              <div className="w-12 h-12 rounded-full bg-white border border-neutral-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {form.company_logo ? (
                  <img
                    src={form.company_logo}
                    alt={form.company || 'Company'}
                    className="w-full h-full object-contain"
                    onError={() => setLogoError(true)}
                  />
                ) : form.company && !logoError ? (
                  <img
                    src={getCompanyLogoUrl(form.company)}
                    alt={form.company}
                    className="w-full h-full object-contain"
                    onError={() => setLogoError(true)}
                  />
                ) : (
                  <span className="text-sm font-medium text-neutral-400">
                    {form.company ? getInitials(form.company) : '?'}
                  </span>
                )}
              </div>

              {/* Job Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="text-base font-normal text-neutral-900 truncate">
                    {form.title || 'Job Title'}
                  </h3>
                  <span className="bg-green-500 text-white text-[10px] font-medium tracking-wider px-2 py-0.5 rounded flex-shrink-0">
                    NEW
                  </span>
                </div>

                <p className="text-sm text-neutral-500 mb-3 truncate">
                  {form.company || 'Company Name'} · {form.location || 'Remote'}
                </p>

                <div className="flex flex-wrap gap-1.5">
                  {form.is_featured && (
                    <span className="bg-yellow-400 text-neutral-900 text-[11px] font-medium px-2 py-0.5 rounded border border-yellow-500">
                      Featured
                    </span>
                  )}
                  {form.job_type && (
                    <span className="bg-white text-neutral-600 text-[11px] px-2 py-0.5 rounded border border-neutral-200">
                      {toTitleCase(form.job_type)}
                    </span>
                  )}
                  {form.experience_level && (
                    <span className="bg-white text-neutral-600 text-[11px] px-2 py-0.5 rounded border border-neutral-200">
                      {toTitleCase(form.experience_level)}
                    </span>
                  )}
                  {salary && (
                    <span className="bg-white text-neutral-600 text-[11px] px-2 py-0.5 rounded border border-neutral-200">
                      {salary}
                    </span>
                  )}
                  {form.location?.toLowerCase().includes('remote') && (
                    <span className="bg-white text-neutral-600 text-[11px] px-2 py-0.5 rounded border border-neutral-200">
                      🌍 Remote
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Skills Preview */}
          {form.skills.length > 0 && (
            <div className="mt-4 p-4 bg-white border border-neutral-200 rounded-xl">
              <p className="text-xs text-neutral-500 mb-2">Skills</p>
              <div className="flex flex-wrap gap-1.5">
                {form.skills.slice(0, 5).map(skill => (
                  <span key={skill} className="bg-neutral-100 text-neutral-700 text-[11px] px-2 py-0.5 rounded">
                    {skill}
                  </span>
                ))}
                {form.skills.length > 5 && (
                  <span className="text-neutral-400 text-[11px] px-2 py-0.5">
                    +{form.skills.length - 5} more
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Tips */}
          <div className="mt-4 p-4 bg-neutral-100 rounded-xl">
            <p className="text-xs font-medium text-neutral-700 mb-2">Tips for a great listing</p>
            <ul className="text-xs text-neutral-500 space-y-1">
              <li>• Include salary range to get 3x more applicants</li>
              <li>• Add relevant skills for better matching</li>
              <li>• Featured listings get 5x more visibility</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
  )
}
