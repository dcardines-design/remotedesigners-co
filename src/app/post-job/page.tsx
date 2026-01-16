'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Input, Select, CheckboxIcon, Button } from '@/components/ui'
import { SKILLS_BY_CATEGORY, ALL_SKILLS } from '@/lib/skills'
import { createBrowserSupabaseClient } from '@/lib/supabase-browser'

const JOB_TYPES = ['full-time', 'part-time', 'contract', 'freelance', 'internship']

const SALARY_RANGES = [
  { value: '', label: 'Prefer not to disclose', min: '', max: '' },
  { value: '0-25', label: '$0 - $25k USD', min: '0', max: '25000' },
  { value: '25-40', label: '$25k - $40k USD', min: '25000', max: '40000' },
  { value: '40-50', label: '$40k - $50k USD', min: '40000', max: '50000' },
  { value: '50-75', label: '$50k - $75k USD', min: '50000', max: '75000' },
  { value: '75-100', label: '$75k - $100k USD', min: '75000', max: '100000' },
  { value: '100-125', label: '$100k - $125k USD', min: '100000', max: '125000' },
  { value: '125-150', label: '$125k - $150k USD', min: '125000', max: '150000' },
  { value: '150-200', label: '$150k - $200k USD', min: '150000', max: '200000' },
  { value: '200-250', label: '$200k - $250k USD', min: '200000', max: '250000' },
  { value: '250+', label: '$250k+ USD', min: '250000', max: '' },
]

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

const STORAGE_KEY = 'post-job-draft'

export default function PostJobPage() {
  const [loading, setLoading] = useState(false)
  const [logoError, setLogoError] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [customSkill, setCustomSkill] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isHydrated, setIsHydrated] = useState(false)
  const [form, setForm] = useState({
    title: '',
    company: '',
    company_logo: '',
    location: 'Remote',
    region: '',
    salary_range: '',
    salary_min: '',
    salary_max: '',
    description: '',
    job_type: 'full-time',
    experience_level: 'mid',
    skills: [] as string[],
    apply_url: '',
    poster_email: '',
    is_featured: false,
    email_blast: false,
    sticky_24h: false,
    sticky_7d: false,
    rainbow_border: false,
    extended_duration: false,
  })

  // Load saved form data from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setForm(prev => ({ ...prev, ...parsed }))
      } catch (e) {
        console.error('Failed to parse saved form data:', e)
      }
    }
    setIsHydrated(true)
  }, [])

  // Save form data to localStorage whenever it changes
  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(form))
    }
  }, [form, isHydrated])

  // Get current user ID and pre-fill email
  useEffect(() => {
    const supabase = createBrowserSupabaseClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id || null)
      if (user?.email && !form.poster_email) {
        setForm(prev => ({ ...prev, poster_email: user.email || '' }))
      }
    })
  }, [])

  const calculateTotal = () => {
    let total = 99
    if (form.is_featured) total += 50
    // if (form.email_blast) total += 49 // Hidden for now
    if (form.sticky_24h) total += 79
    if (form.sticky_7d) total += 149
    if (form.rainbow_border) total += 39
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

  const addCustomSkill = () => {
    const skill = customSkill.trim()
    if (skill && !form.skills.includes(skill)) {
      setForm(prev => ({ ...prev, skills: [...prev.skills, skill] }))
      setCustomSkill('')
    }
  }

  const handleCustomSkillKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addCustomSkill()
    }
  }

  // ALL_SKILLS imported from @/lib/skills for checking custom skills

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
          user_id: userId,
        }),
      })

      const data = await response.json()

      if (data.url) {
        localStorage.removeItem(STORAGE_KEY)
        window.location.href = data.url
      } else {
        alert(data.error || 'Failed to create checkout session')
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

  // Handle logo upload
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file')
      return
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('Image must be less than 2MB')
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload-logo', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed')
      }

      setForm({ ...form, company_logo: data.url })
      setLogoError(false)
    } catch (error) {
      console.error('Upload error:', error)
      alert('Failed to upload logo. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const removeLogo = () => {
    setForm({ ...form, company_logo: '' })
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const salaryRange = SALARY_RANGES.find(r => r.value === form.salary_range)
  const salary = salaryRange?.value ? salaryRange.label : null

  // Show loading skeleton until hydration completes to prevent mismatch
  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="mb-8">
            <div className="h-4 w-24 bg-neutral-200 rounded mb-4" />
            <div className="h-10 w-48 bg-neutral-200 rounded mb-2" />
            <div className="h-4 w-64 bg-neutral-200 rounded" />
          </div>
          <div className="flex gap-8">
            <div className="flex-1 max-w-xl space-y-5">
              <div className="bg-white rounded-2xl border border-neutral-200 p-6 h-[400px] animate-pulse" />
              <div className="bg-white rounded-2xl border border-neutral-200 p-6 h-[200px] animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    )
  }

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
          <div className="flex-1 max-w-xl">
            <form onSubmit={handleSubmit} className="space-y-5">
          {/* Job Details */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-6 space-y-5">
            <h2 className="text-lg font-medium text-neutral-900">Job Details</h2>

            {/* Company Logo */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Company Logo
              </label>
              {form.company_logo ? (
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-lg border border-neutral-200 overflow-hidden bg-white flex items-center justify-center">
                    <img
                      src={form.company_logo}
                      alt="Logo preview"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={removeLogo}
                    className="text-sm text-red-500 hover:text-red-600 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <label className={`flex flex-col items-center justify-center w-16 h-16 border border-neutral-200 border-dashed rounded-lg cursor-pointer hover:border-neutral-300 hover:bg-neutral-50 transition-all ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                  {uploading ? (
                    <span className="text-[10px] text-neutral-400">...</span>
                  ) : (
                    <svg className="w-5 h-5 text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                    </svg>
                  )}
                </label>
              )}
              <p className="mt-1.5 text-xs text-neutral-400">Square image recommended. Max 2MB.</p>
            </div>

            <Input
              label="Job Title *"
              type="text"
              required
              placeholder="e.g. Senior Product Designer"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
            />

            <Input
              label="Company Name *"
              type="text"
              required
              placeholder="e.g. Acme Inc"
              value={form.company}
              onChange={e => handleCompanyChange(e.target.value)}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Location *"
                type="text"
                required
                placeholder="e.g. Remote, San Francisco"
                value={form.location}
                onChange={e => setForm({ ...form, location: e.target.value })}
              />
              <Select
                label="Region"
                value={form.region || ''}
                onChange={(value) => setForm({ ...form, region: value })}
                options={[
                  { value: '', label: 'Select...' },
                  { value: 'worldwide', label: 'Worldwide' },
                  { value: 'north-america', label: 'North America' },
                  { value: 'europe', label: 'Europe' },
                  { value: 'asia', label: 'Asia' },
                  { value: 'latin-america', label: 'Latin America' },
                  { value: 'africa', label: 'Africa' },
                  { value: 'oceania', label: 'Oceania' },
                  { value: 'us-only', label: 'US Only' },
                  { value: 'eu-only', label: 'EU Only' },
                  { value: 'uk-only', label: 'UK Only' },
                ]}
              />
            </div>

            <Select
              label="Salary Range (USD/year)"
              value={form.salary_range}
              onChange={(value) => {
                const range = SALARY_RANGES.find(r => r.value === value)
                setForm({
                  ...form,
                  salary_range: value,
                  salary_min: range?.min || '',
                  salary_max: range?.max || ''
                })
              }}
              options={SALARY_RANGES.map(range => ({ value: range.value, label: range.label }))}
            />

            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Job Type *"
                value={form.job_type}
                onChange={(value) => setForm({ ...form, job_type: value })}
                options={JOB_TYPES.map(type => ({ value: type, label: toTitleCase(type) }))}
                required
              />
              <Select
                label="Experience Level *"
                value={form.experience_level}
                onChange={(value) => setForm({ ...form, experience_level: value })}
                options={EXPERIENCE_LEVELS.map(level => ({ value: level, label: toTitleCase(level) }))}
                required
              />
            </div>

            <Input
              label="Application URL *"
              type="url"
              required
              placeholder="https://yourcompany.com/careers/apply"
              value={form.apply_url}
              onChange={e => setForm({ ...form, apply_url: e.target.value })}
            />

            <Input
              label="Your Email *"
              type="email"
              required
              placeholder="you@company.com"
              value={form.poster_email}
              onChange={e => setForm({ ...form, poster_email: e.target.value })}
            />
            <p className="text-xs text-neutral-400 -mt-3">We'll send you a receipt and you can manage your posting from your account</p>
          </div>

          {/* Description */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-6 space-y-4">
            <h2 className="text-lg font-medium text-neutral-900">
              Job Description<span className="text-red-500"> *</span>
            </h2>
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
          <div className="bg-white rounded-2xl border border-neutral-200 p-6 space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-medium text-neutral-900">Skills</h2>
                <p className="text-sm text-neutral-500">Select relevant skills for this role</p>
              </div>
              {form.skills.length > 0 && (
                <button
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, skills: [] }))}
                  className="text-xs text-neutral-400 hover:text-neutral-600 transition-colors"
                >
                  Clear ({form.skills.length})
                </button>
              )}
            </div>

            {/* Skills by Category */}
            {Object.entries(SKILLS_BY_CATEGORY).map(([category, skills]) => (
              <div key={category}>
                <p className="text-[10px] text-neutral-400 uppercase tracking-widest mb-2">{category}</p>
                <div className="flex flex-wrap gap-2">
                  {skills.map(skill => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => toggleSkill(skill)}
                      className={`px-2.5 py-1 text-xs rounded border transition-all ${
                        form.skills.includes(skill)
                          ? 'bg-[#2a2a2a] text-white border-[#2a2a2a]'
                          : 'bg-white text-neutral-600 border-neutral-200 hover:shadow-[0px_2px_0px_0px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none'
                      }`}
                    >
                      {skill}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {/* Custom Skills */}
            <div className="border-t border-neutral-100 pt-5">
              <p className="text-[10px] text-neutral-400 uppercase tracking-widest mb-2">Custom Skills</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customSkill}
                  onChange={(e) => setCustomSkill(e.target.value)}
                  onKeyDown={handleCustomSkillKeyDown}
                  placeholder="Type a skill and press Enter"
                  className={`${inputStyles} flex-1`}
                />
                <button
                  type="button"
                  onClick={addCustomSkill}
                  disabled={!customSkill.trim()}
                  className="px-6 py-2.5 bg-white text-neutral-900 font-medium rounded-lg border border-neutral-200 shadow-[0px_2px_0px_0px_rgba(0,0,0,0.05)] hover:bg-neutral-50 hover:translate-y-[1px] hover:shadow-[0px_1px_0px_0px_rgba(0,0,0,0.05)] active:translate-y-[2px] active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  Add
                </button>
              </div>
              {/* Show custom skills that have been added */}
              {form.skills.filter(s => !ALL_SKILLS.includes(s)).length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {form.skills.filter(s => !ALL_SKILLS.includes(s)).map(skill => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => toggleSkill(skill)}
                      className="px-2.5 py-1 text-xs rounded border bg-[#2a2a2a] text-white border-[#2a2a2a] transition-all"
                    >
                      {skill} ×
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Upsells */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-6 space-y-4">
            <div>
              <h2 className="text-lg font-medium text-neutral-900">Boost Your Listing</h2>
              <p className="text-sm text-neutral-500">Optional add-ons to get more visibility</p>
            </div>

            <div className="space-y-3">
              {/* Featured */}
              <label className={`flex items-start gap-4 p-4 rounded-lg border cursor-pointer transition-all ${
                form.is_featured
                  ? 'border-amber-400 bg-amber-50 shadow-[0px_4px_0px_0px_rgba(251,191,36,0.3)]'
                  : 'border-neutral-200 bg-white shadow-[0px_4px_0px_0px_rgba(0,0,0,0.05)] hover:shadow-[0px_2px_0px_0px_rgba(0,0,0,0.05)] hover:translate-y-[2px]'
              }`}>
                <input
                  type="checkbox"
                  checked={form.is_featured}
                  onChange={e => setForm({ ...form, is_featured: e.target.checked })}
                  className="sr-only"
                />
                <CheckboxIcon checked={form.is_featured} />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-neutral-900">Featured Listing</span>
                    <span className="px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 rounded-full">
                      +$50
                    </span>
                  </div>
                  <p className="text-sm text-neutral-500 mt-0.5">
                    Gold highlight + "Featured" badge, stands out in listings
                  </p>
                </div>
              </label>

              {/* Sticky 24h */}
              <label className={`flex items-start gap-4 p-4 rounded-lg border cursor-pointer transition-all ${
                form.sticky_24h
                  ? 'border-blue-400 bg-blue-50 shadow-[0px_4px_0px_0px_rgba(96,165,250,0.3)]'
                  : 'border-neutral-200 bg-white shadow-[0px_4px_0px_0px_rgba(0,0,0,0.05)] hover:shadow-[0px_2px_0px_0px_rgba(0,0,0,0.05)] hover:translate-y-[2px]'
              }`}>
                <input
                  type="checkbox"
                  checked={form.sticky_24h}
                  onChange={e => setForm({ ...form, sticky_24h: e.target.checked, sticky_7d: false })}
                  className="sr-only"
                />
                <CheckboxIcon checked={form.sticky_24h} />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-neutral-900">Sticky Post 24h</span>
                    <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                      +$79
                    </span>
                    <span className="px-2 py-0.5 text-[10px] font-medium tracking-wider bg-blue-50 text-blue-600 rounded-full border border-blue-200">
                      2X MORE VIEWS
                    </span>
                  </div>
                  <p className="text-sm text-neutral-500 mt-0.5">
                    Pinned to top of homepage for 24 hours
                  </p>
                </div>
              </label>

              {/* Sticky 7 Days */}
              <label className={`flex items-start gap-4 p-4 rounded-lg border cursor-pointer transition-all ${
                form.sticky_7d
                  ? 'border-pink-400 bg-pink-50 shadow-[0px_4px_0px_0px_rgba(236,72,153,0.3)]'
                  : 'border-neutral-200 bg-white shadow-[0px_4px_0px_0px_rgba(0,0,0,0.05)] hover:shadow-[0px_2px_0px_0px_rgba(0,0,0,0.05)] hover:translate-y-[2px]'
              }`}>
                <input
                  type="checkbox"
                  checked={form.sticky_7d}
                  onChange={e => setForm({ ...form, sticky_7d: e.target.checked, sticky_24h: false })}
                  className="sr-only"
                />
                <CheckboxIcon checked={form.sticky_7d} />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-neutral-900">Sticky Post 7 Days</span>
                    <span className="px-2 py-0.5 text-xs font-medium bg-pink-100 text-pink-700 rounded-full">
                      +$149
                    </span>
                    <span className="px-2 py-0.5 text-[10px] font-medium tracking-wider bg-pink-50 text-pink-600 rounded-full border border-pink-200">
                      6X MORE VIEWS
                    </span>
                  </div>
                  <p className="text-sm text-neutral-500 mt-0.5">
                    Pinned to top of homepage for 1 entire week
                  </p>
                </div>
              </label>

              {/* Rainbow Border */}
              <label className={`flex items-start gap-4 p-4 rounded-lg border cursor-pointer transition-all ${
                form.rainbow_border
                  ? 'border-transparent bg-gradient-to-r from-pink-50 via-purple-50 to-blue-50 shadow-[0px_4px_0px_0px_rgba(168,85,247,0.2)]'
                  : 'border-neutral-200 bg-white shadow-[0px_4px_0px_0px_rgba(0,0,0,0.05)] hover:shadow-[0px_2px_0px_0px_rgba(0,0,0,0.05)] hover:translate-y-[2px]'
              }`} style={form.rainbow_border ? { border: '1px solid transparent', backgroundImage: 'linear-gradient(white, white), linear-gradient(135deg, #ec4899, #8b5cf6, #3b82f6, #10b981)', backgroundOrigin: 'border-box', backgroundClip: 'padding-box, border-box' } : {}}>
                <input
                  type="checkbox"
                  checked={form.rainbow_border}
                  onChange={e => setForm({ ...form, rainbow_border: e.target.checked })}
                  className="sr-only"
                />
                <CheckboxIcon checked={form.rainbow_border} />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-neutral-900">Rainbow Border</span>
                    <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 rounded-full">
                      +$39
                    </span>
                    <span className="px-2 py-0.5 text-[10px] font-medium tracking-wider rounded-full border border-purple-200 bg-purple-50">
                      <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(90deg, #f97316, #ec4899, #8b5cf6, #06b6d4)' }}>
                        EYE-CATCHING
                      </span>
                    </span>
                  </div>
                  <p className="text-sm text-neutral-500 mt-0.5">
                    Animated rainbow gradient border that stands out
                  </p>
                </div>
              </label>

              {/* Extended Duration */}
              <label className={`flex items-start gap-4 p-4 rounded-lg border cursor-pointer transition-all ${
                form.extended_duration
                  ? 'border-green-400 bg-green-50 shadow-[0px_4px_0px_0px_rgba(74,222,128,0.3)]'
                  : 'border-neutral-200 bg-white shadow-[0px_4px_0px_0px_rgba(0,0,0,0.05)] hover:shadow-[0px_2px_0px_0px_rgba(0,0,0,0.05)] hover:translate-y-[2px]'
              }`}>
                <input
                  type="checkbox"
                  checked={form.extended_duration}
                  onChange={e => setForm({ ...form, extended_duration: e.target.checked })}
                  className="sr-only"
                />
                <CheckboxIcon checked={form.extended_duration} />
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
              <span className="text-neutral-400">Base Posting (30 Days)</span>
              <span>$99</span>
            </div>
            {form.is_featured && (
              <div className="flex items-center justify-between mb-4">
                <span className="text-neutral-400">Featured Listing</span>
                <span>$50</span>
              </div>
            )}
            {form.sticky_24h && (
              <div className="flex items-center justify-between mb-4">
                <span className="text-neutral-400">Sticky Post 24h</span>
                <span>$79</span>
              </div>
            )}
            {form.sticky_7d && (
              <div className="flex items-center justify-between mb-4">
                <span className="text-neutral-400">Sticky Post 7 Days</span>
                <span>$149</span>
              </div>
            )}
            {form.rainbow_border && (
              <div className="flex items-center justify-between mb-4">
                <span className="text-neutral-400">Rainbow Border</span>
                <span>$39</span>
              </div>
            )}
            {form.extended_duration && (
              <div className="flex items-center justify-between mb-4">
                <span className="text-neutral-400">Extended Duration</span>
                <span>$49</span>
              </div>
            )}
            <div className="border-t border-neutral-700 pt-4 mb-6">
              <div className="flex items-center justify-between text-lg font-semibold">
                <span>Total</span>
                <span>${calculateTotal()}</span>
              </div>
            </div>
            <Button
              type="submit"
              disabled={loading}
              variant="secondary"
              size="lg"
              fullWidth
            >
              {loading ? 'Processing...' : `Post Job - $${calculateTotal()}`}
            </Button>
          </div>
        </form>
      </div>

      {/* Preview Column */}
      <div className="flex-1 max-w-md hidden lg:block">
        <div className="sticky top-24">
          <p className="text-sm text-neutral-500 mb-3">Preview</p>

          {/* Job Card Preview */}
          <div
            className={`border rounded-xl p-5 relative transition-all ${
              form.is_featured
                ? 'bg-amber-50 border-amber-200'
                : 'bg-white border-neutral-200'
            }`}
          >
            {/* Left border indicator */}
            <div
              className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${
                form.rainbow_border
                  ? ''
                  : form.is_featured
                    ? 'bg-amber-400'
                    : 'bg-green-500'
              }`}
              style={form.rainbow_border ? {
                background: 'linear-gradient(180deg, #ec4899 0%, #8b5cf6 20%, #3b82f6 40%, #10b981 60%, #eab308 80%, #ec4899 100%)',
                backgroundSize: '100% 300%',
                animation: 'rainbowFlow 2s linear infinite'
              } : {}}
            />

            <div className="flex gap-4 pl-1">
              {/* Company Avatar */}
              <div className="w-12 h-12 rounded-full bg-white border border-neutral-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {form.company_logo ? (
                  <img
                    src={form.company_logo}
                    alt={form.company || 'Company'}
                    className="w-full h-full object-cover"
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
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {(form.sticky_24h || form.sticky_7d) && (
                      <svg className={`w-4 h-4 ${form.sticky_7d ? 'text-purple-500' : 'text-blue-500'}`} fill="currentColor" viewBox="0 0 24 24">
                        <path d="M16 4l4 4-1.5 1.5-1-1L14 12l1 5-3 3-2.5-5L5 19.5 4.5 19l4.5-4.5-5-2.5 3-3 5 1 3.5-3.5-1-1L16 4z"/>
                      </svg>
                    )}
                    <span className="bg-green-500 text-white text-[10px] font-medium tracking-wider px-2 py-0.5 rounded">
                      NEW
                    </span>
                  </div>
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
                      Remote
                    </span>
                  )}
                  {form.region && (
                    <span className="bg-white text-neutral-600 text-[11px] px-2 py-0.5 rounded border border-neutral-200">
                      {form.region === 'worldwide' ? '🌍 Worldwide' :
                       form.region === 'north-america' ? '🌎 North America' :
                       form.region === 'europe' ? '🇪🇺 Europe' :
                       form.region === 'asia' ? '🌏 Asia' :
                       form.region === 'latin-america' ? '🌎 Latin America' :
                       form.region === 'africa' ? '🌍 Africa' :
                       form.region === 'oceania' ? '🌏 Oceania' :
                       form.region === 'us-only' ? '🇺🇸 US Only' :
                       form.region === 'eu-only' ? '🇪🇺 EU Only' :
                       form.region === 'uk-only' ? '🇬🇧 UK Only' :
                       form.region}
                    </span>
                  )}
                  {form.skills.slice(0, 3).map(skill => (
                    <span key={skill} className="bg-white text-neutral-600 text-[11px] px-2 py-0.5 rounded border border-neutral-200">
                      {skill}
                    </span>
                  ))}
                  {form.skills.length > 3 && (
                    <div className="relative group/chips inline-flex">
                      <span className="bg-white text-neutral-400 text-[11px] px-2 py-0.5 rounded border border-neutral-200 cursor-default group-hover/chips:border-neutral-300 group-hover/chips:text-neutral-500 transition-all">
                        +{form.skills.length - 3}
                      </span>
                      <div className="absolute left-0 bottom-full mb-1.5 z-50 opacity-0 invisible group-hover/chips:opacity-100 group-hover/chips:visible transition-all duration-150">
                        <div className="bg-neutral-100 border border-neutral-200 rounded-lg shadow-[0px_4px_0px_0px_rgba(0,0,0,0.08)] p-2 flex flex-wrap gap-1.5 min-w-[200px] max-w-[280px]">
                          {form.skills.slice(3).map(skill => (
                            <span
                              key={skill}
                              className="bg-white text-neutral-500 text-[10px] px-2 py-0.5 rounded border border-neutral-200"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Tips */}
          <div className="mt-4 p-4 bg-neutral-100 rounded-xl">
            <p className="text-xs font-medium text-neutral-700 mb-2 flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 shrink-0 relative -top-px" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7z" />
              </svg>
              Tips for a great listing
            </p>
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
