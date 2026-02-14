'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Input, Button, Checkbox, Select } from '@/components/ui'
import { Plus, Trash2, Sparkles, Download, Eye, GripVertical, FileText, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, Search, X, Upload, Palette } from 'lucide-react'
import { toast } from 'sonner'
import { createBrowserSupabaseClient } from '@/lib/supabase-browser'
import { isCompMember } from '@/lib/admin'
import { useSignupModal } from '@/context/signup-modal-context'
import type { User } from '@supabase/supabase-js'

interface Experience {
  id: string
  company: string
  title: string
  location: string
  startDate: string
  endDate: string
  isCurrent: boolean
  bullets: string[]
}

interface Education {
  id: string
  institution: string
  degree: string
  fieldOfStudy: string
  location: string
  graduationDate: string
  gpa?: string
}

interface Project {
  id: string
  name: string
  description: string
  technologies: string
  link?: string
}

type ActiveSection = 'contact' | 'summary' | 'experience' | 'education' | 'skills' | 'projects'
type ResumeTemplate = 'classic' | 'modern' | 'minimal'

const ATS_TIPS = {
  contact: 'Use a professional email. Include city/state only - full address not needed.',
  summary: 'Keep it 2-3 sentences. Include your job title, years of experience, and key skills.',
  experience: 'Start bullets with strong action verbs. Quantify achievements with numbers.',
  education: 'Include GPA if 3.5+. Add relevant coursework for entry-level positions.',
  skills: 'Match skills to job posting keywords. Avoid rating your skills.',
  projects: 'Include links to live projects or portfolios. Focus on impact and technologies used.',
}

const DESIGN_SKILLS = [
  // Design Tools
  'Figma', 'Sketch', 'Adobe XD', 'Adobe Photoshop', 'Adobe Illustrator', 'Adobe InDesign',
  'Adobe After Effects', 'Adobe Premiere Pro', 'Adobe Lightroom', 'Adobe Creative Suite',
  'InVision', 'Framer', 'Principle', 'Zeplin', 'Abstract', 'Miro', 'FigJam', 'Whimsical',
  'Canva', 'Procreate', 'Blender', 'Cinema 4D', 'Spline', 'Rive', 'Lottie',
  // Design Disciplines
  'UI Design', 'UX Design', 'Product Design', 'Visual Design', 'Interaction Design',
  'Motion Design', 'Graphic Design', 'Brand Design', 'Web Design', 'Mobile Design',
  'Icon Design', 'Illustration', 'Typography', 'Color Theory', 'Layout Design',
  // UX Methods
  'User Research', 'Usability Testing', 'A/B Testing', 'User Interviews', 'Surveys',
  'Heuristic Evaluation', 'Card Sorting', 'Tree Testing', 'Journey Mapping',
  'Persona Development', 'Competitive Analysis', 'Accessibility Audits',
  // Core Skills
  'Prototyping', 'Wireframing', 'Design Systems', 'Component Libraries', 'Style Guides',
  'Responsive Design', 'Design Tokens', 'Atomic Design', 'Information Architecture',
  'User Flows', 'Storyboarding', 'Design Thinking', 'Human-Centered Design',
  // Development
  'HTML', 'CSS', 'JavaScript', 'TypeScript', 'React', 'Vue', 'Angular', 'Swift', 'SwiftUI',
  'Tailwind CSS', 'SASS/SCSS', 'Git', 'Webflow', 'Framer Sites', 'WordPress',
  // Collaboration & Process
  'Agile/Scrum', 'Design Sprints', 'Cross-functional Collaboration', 'Stakeholder Management',
  'Design Critiques', 'Mentoring', 'Design QA', 'Handoff Documentation',
  'Project Management', 'Jira', 'Notion', 'Confluence', 'Asana', 'Linear',
  // Analytics & Data
  'Google Analytics', 'Hotjar', 'Mixpanel', 'Amplitude', 'Data-Driven Design',
  'Conversion Optimization', 'Funnel Analysis',
  // Accessibility
  'WCAG Compliance', 'Accessibility Design', 'Screen Reader Testing', 'Inclusive Design',
  // Soft Skills
  'Presentation Skills', 'Workshop Facilitation', 'Client Communication', 'Strategic Thinking',
  'Problem Solving', 'Attention to Detail', 'Time Management', 'Leadership',
]

const ACTION_VERBS = new Set([
  'led', 'designed', 'built', 'created', 'managed', 'developed', 'implemented',
  'launched', 'delivered', 'improved', 'increased', 'reduced', 'achieved',
  'established', 'streamlined', 'optimized', 'transformed', 'orchestrated',
  'spearheaded', 'pioneered', 'architected', 'collaborated', 'mentored',
  'negotiated', 'resolved', 'automated', 'migrated', 'scaled', 'refactored',
  'analyzed', 'researched', 'facilitated', 'coordinated', 'drove', 'owned',
  'shipped', 'iterated', 'prototyped', 'conducted', 'presented', 'defined',
])

const STORAGE_KEY = 'resume-builder-data'

const defaultPersonalInfo = {
  fullName: '',
  email: '',
  phone: '',
  location: '',
  linkedin: '',
  portfolio: '',
  summary: '',
}

const defaultExperience: Experience = {
  id: '1',
  company: '',
  title: '',
  location: '',
  startDate: '',
  endDate: '',
  isCurrent: false,
  bullets: [''],
}

const defaultEducation: Education = {
  id: '1',
  institution: '',
  degree: '',
  fieldOfStudy: '',
  location: '',
  graduationDate: '',
  gpa: '',
}

const defaultProject: Project = {
  id: '1',
  name: '',
  description: '',
  technologies: '',
  link: '',
}

export default function ResumeBuilderPage() {
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit')
  const [activeSection, setActiveSection] = useState<ActiveSection | null>('contact')
  const [isEnhancing, setIsEnhancing] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [hydrated, setHydrated] = useState(false)
  const resumeRef = useRef<HTMLDivElement>(null)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const skillInputRef = useRef<HTMLInputElement>(null)
  const skillDropdownRef = useRef<HTMLDivElement>(null)
  const [skillsDropdownOpen, setSkillsDropdownOpen] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Experience/Education accordion - only one open at a time
  const [openExperienceId, setOpenExperienceId] = useState<string | null>('1')
  const [openEducationId, setOpenEducationId] = useState<string | null>('1')

  // Subscription gating
  const [user, setUser] = useState<User | null>(null)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const { openSignupModal } = useSignupModal()

  // Form state
  const [personalInfo, setPersonalInfo] = useState(defaultPersonalInfo)
  const [skills, setSkills] = useState<string[]>([])
  const [newSkill, setNewSkill] = useState('')
  const [experiences, setExperiences] = useState<Experience[]>([defaultExperience])
  const [education, setEducation] = useState<Education[]>([defaultEducation])
  const [projects, setProjects] = useState<Project[]>([defaultProject])
  const [selectedTemplate, setSelectedTemplate] = useState<ResumeTemplate>('classic')
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false)
  const templatePickerRef = useRef<HTMLDivElement>(null)
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [pageHeight, setPageHeight] = useState(0)

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const data = JSON.parse(saved)
        if (data.personalInfo) setPersonalInfo(data.personalInfo)
        if (data.skills?.length) setSkills(data.skills)
        if (data.experiences?.length) setExperiences(data.experiences)
        if (data.education?.length) setEducation(data.education)
        if (data.projects?.length) setProjects(data.projects)
        if (data.template) setSelectedTemplate(data.template)
      }
    } catch {}
    setHydrated(true)
  }, [])

  // Check auth + subscription status
  useEffect(() => {
    const checkSubscription = async () => {
      const supabase = createBrowserSupabaseClient()
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      if (!user) {
        setIsSubscribed(false)
        return
      }

      if (isCompMember(user.email)) {
        setIsSubscribed(true)
        return
      }

      const { data } = await supabase
        .from('subscriptions')
        .select('status')
        .eq('user_id', user.id)
        .single()

      setIsSubscribed(data?.status === 'active')
    }
    checkSubscription()
  }, [])

  // Autosave to localStorage (debounced 500ms)
  useEffect(() => {
    if (!hydrated) return
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    saveTimeoutRef.current = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          personalInfo,
          skills,
          experiences,
          education,
          projects,
          template: selectedTemplate,
        }))
      } catch {}
    }, 500)
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    }
  }, [hydrated, personalInfo, skills, experiences, education, projects, selectedTemplate])

  // Close skills dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (skillDropdownRef.current && !skillDropdownRef.current.contains(e.target as Node)) {
        setSkillsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close template picker on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (templatePickerRef.current && !templatePickerRef.current.contains(e.target as Node)) {
        setTemplatePickerOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Measure resume content to calculate page breaks
  useEffect(() => {
    const el = resumeRef.current
    if (!el) return
    const measure = () => {
      const w = el.offsetWidth
      const h = el.scrollHeight
      if (w > 0 && h > 0) {
        const ph = w * (10 / 7.5) // letter content area ratio
        setPageHeight(ph)
        const pages = Math.max(1, Math.ceil(h / ph))
        setTotalPages(pages)
        setCurrentPage(prev => Math.min(prev, pages - 1))
      }
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  })

  // Reset to first page when template changes
  useEffect(() => {
    setCurrentPage(0)
  }, [selectedTemplate])

  const filteredSkillOptions = DESIGN_SKILLS.filter(s =>
    !skills.includes(s) &&
    s.toLowerCase().includes(newSkill.toLowerCase())
  )

  // Skill handlers
  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()])
      setNewSkill('')
      setSkillsDropdownOpen(false)
    }
  }

  const selectSkill = (skill: string) => {
    if (!skills.includes(skill)) {
      setSkills([...skills, skill])
    }
    setNewSkill('')
    setSkillsDropdownOpen(false)
    skillInputRef.current?.focus()
  }

  const removeSkill = (skill: string) => {
    setSkills(skills.filter((s) => s !== skill))
  }

  // Experience handlers
  const addExperience = () => {
    const newId = Date.now().toString()
    setExperiences([
      ...experiences,
      {
        id: newId,
        company: '',
        title: '',
        location: '',
        startDate: '',
        endDate: '',
        isCurrent: false,
        bullets: [''],
      },
    ])
    return newId
  }

  const removeExperience = (id: string) => {
    if (experiences.length > 1) {
      setExperiences(experiences.filter((e) => e.id !== id))
    }
  }

  const updateExperience = (id: string, field: keyof Experience, value: any) => {
    setExperiences(
      experiences.map((e) => (e.id === id ? { ...e, [field]: value } : e))
    )
  }

  const addBullet = (expId: string) => {
    setExperiences(
      experiences.map((e) =>
        e.id === expId ? { ...e, bullets: [...e.bullets, ''] } : e
      )
    )
  }

  const updateBullet = (expId: string, index: number, value: string) => {
    setExperiences(
      experiences.map((e) =>
        e.id === expId
          ? { ...e, bullets: e.bullets.map((b, i) => (i === index ? value : b)) }
          : e
      )
    )
  }

  const removeBullet = (expId: string, index: number) => {
    setExperiences(
      experiences.map((e) =>
        e.id === expId
          ? { ...e, bullets: e.bullets.filter((_, i) => i !== index) }
          : e
      )
    )
  }

  const enhanceBullet = async (expId: string, index: number) => {
    const exp = experiences.find((e) => e.id === expId)
    if (!exp || !exp.bullets[index]) return

    if (!isSubscribed) {
      setShowUpgradeModal(true)
      return
    }

    setIsEnhancing(`${expId}-${index}`)

    try {
      const response = await fetch('/api/ai/enhance-bullet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bulletPoint: exp.bullets[index],
          jobTitle: exp.title,
          company: exp.company,
        }),
      })

      if (response.ok) {
        const { enhanced } = await response.json()
        updateBullet(expId, index, enhanced)
        toast.success('Bullet point enhanced!')
      } else {
        toast.error('Failed to enhance. Try again.')
      }
    } catch (error) {
      toast.error('Failed to enhance. Try again.')
    } finally {
      setIsEnhancing(null)
    }
  }

  // Education handlers
  const addEducation = () => {
    const newId = Date.now().toString()
    setEducation([
      ...education,
      {
        id: newId,
        institution: '',
        degree: '',
        fieldOfStudy: '',
        location: '',
        graduationDate: '',
        gpa: '',
      },
    ])
    return newId
  }

  const removeEducation = (id: string) => {
    if (education.length > 1) {
      setEducation(education.filter((e) => e.id !== id))
    }
  }

  const updateEducation = (id: string, field: keyof Education, value: string) => {
    setEducation(
      education.map((e) => (e.id === id ? { ...e, [field]: value } : e))
    )
  }

  // Project handlers
  const addProject = () => {
    setProjects([
      ...projects,
      {
        id: Date.now().toString(),
        name: '',
        description: '',
        technologies: '',
        link: '',
      },
    ])
  }

  const removeProject = (id: string) => {
    if (projects.length > 1) {
      setProjects(projects.filter((p) => p.id !== id))
    }
  }

  const updateProject = (id: string, field: keyof Project, value: string) => {
    setProjects(
      projects.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    )
  }

  // Format date for display
  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    const [year, month] = dateStr.split('-')
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return `${months[parseInt(month) - 1]} ${year}`
  }

  // Export to PDF (direct download)
  const exportPDF = async () => {
    const el = resumeRef.current
    if (!el) return
    const html2pdf = (await import('html2pdf.js')).default
    const filename = personalInfo.fullName.trim()
      ? `${personalInfo.fullName.trim().replace(/\s+/g, '_')}_Resume.pdf`
      : 'Resume.pdf'
    html2pdf()
      .set({
        margin: [0.5, 0.5, 0.5, 0.5],
        filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
      })
      .from(el)
      .save()
  }

  // Handle resume upload
  const handleResumeUpload = async (file: File) => {
    if (!isSubscribed) {
      setShowUploadModal(false)
      setShowUpgradeModal(true)
      return
    }

    // Validate file type
    const validTypes = ['application/pdf', 'text/plain']
    if (!validTypes.includes(file.type) && !file.name.endsWith('.pdf') && !file.name.endsWith('.txt')) {
      setUploadError('Please upload a PDF or TXT file.')
      return
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File is too large. Maximum size is 5MB.')
      return
    }

    setIsUploading(true)
    setUploadError(null)

    try {
      const formData = new FormData()
      formData.append('resume', file)

      const response = await fetch('/api/resume/parse', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        setUploadError(result.error || 'Failed to parse resume. Please try again.')
        return
      }

      const data = result.data

      // Map into form state
      setPersonalInfo({
        fullName: data.fullName || '',
        email: data.email || '',
        phone: data.phone || '',
        location: data.location || '',
        linkedin: data.linkedinUrl || '',
        portfolio: data.portfolioUrl || '',
        summary: data.summary || '',
      })

      if (data.skills?.length) {
        setSkills(data.skills)
      }

      if (data.experiences?.length) {
        setExperiences(data.experiences.map((exp: any, i: number) => ({
          id: Date.now().toString() + i,
          company: exp.company || '',
          title: exp.title || '',
          location: exp.location || '',
          startDate: exp.startDate || '',
          endDate: exp.endDate || '',
          isCurrent: exp.isCurrent || false,
          bullets: exp.highlights?.length ? exp.highlights : [''],
        })))
      }

      if (data.education?.length) {
        setEducation(data.education.map((edu: any, i: number) => ({
          id: Date.now().toString() + i,
          institution: edu.institution || '',
          degree: edu.degree || '',
          fieldOfStudy: edu.fieldOfStudy || '',
          location: '',
          graduationDate: edu.endDate || '',
          gpa: edu.gpa || '',
        })))
      }

      setShowUploadModal(false)
      toast.success('Resume imported successfully!')
    } catch {
      setUploadError('Something went wrong. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  // Calculate completion percentage
  const getCompletionPercentage = () => {
    let completed = 0
    let total = 6
    if (personalInfo.fullName && personalInfo.email) completed++
    if (personalInfo.summary) completed++
    if (experiences.some(e => e.company && e.title)) completed++
    if (education.some(e => e.institution && e.degree)) completed++
    if (skills.length >= 3) completed++
    if (projects.some(p => p.name && p.description)) completed++
    return Math.round((completed / total) * 100)
  }

  // Resume score calculation
  const getResumeScore = () => {
    const items: { label: string; points: number; maxPoints: number; suggestion?: string; section: ActiveSection }[] = []

    // Contact info (15 pts)
    const hasName = !!personalInfo.fullName.trim()
    const hasEmail = !!personalInfo.email.trim()
    const hasPhone = !!personalInfo.phone.trim()
    const hasLocation = !!personalInfo.location.trim()
    items.push({ label: 'Full name', points: hasName ? 5 : 0, maxPoints: 5, suggestion: hasName ? undefined : 'Add your full name', section: 'contact' })
    items.push({ label: 'Email address', points: hasEmail ? 5 : 0, maxPoints: 5, suggestion: hasEmail ? undefined : 'Add your email', section: 'contact' })
    items.push({ label: 'Phone number', points: hasPhone ? 3 : 0, maxPoints: 3, suggestion: hasPhone ? undefined : 'Add a phone number', section: 'contact' })
    items.push({ label: 'Location', points: hasLocation ? 2 : 0, maxPoints: 2, suggestion: hasLocation ? undefined : 'Add your city/state', section: 'contact' })

    // Summary (15 pts)
    const summary = personalInfo.summary.trim()
    const hasSummary = summary.length > 0
    const idealLength = summary.length >= 100 && summary.length <= 300
    const summaryHasKeywords = hasSummary && experiences.some(e => {
      const title = e.title.trim().toLowerCase()
      return title && summary.toLowerCase().includes(title.split(' ')[0])
    })
    items.push({ label: 'Summary present', points: hasSummary ? 5 : 0, maxPoints: 5, suggestion: hasSummary ? undefined : 'Write a professional summary', section: 'summary' })
    items.push({ label: 'Summary length (100-300 chars)', points: !hasSummary ? 0 : idealLength ? 5 : 2, maxPoints: 5, suggestion: !hasSummary ? 'Add a summary first' : idealLength ? undefined : summary.length < 100 ? 'Make your summary a bit longer' : 'Trim your summary to under 300 characters', section: 'summary' })
    items.push({ label: 'Summary includes role keywords', points: summaryHasKeywords ? 5 : 0, maxPoints: 5, suggestion: summaryHasKeywords ? undefined : 'Mention your job title in the summary', section: 'summary' })

    // Experience (30 pts)
    const filledExps = experiences.filter(e => e.company.trim() && e.title.trim())
    const hasOneRole = filledExps.length >= 1
    const hasTwoRoles = filledExps.length >= 2
    const allBullets = filledExps.flatMap(e => e.bullets.filter(b => b.trim()))
    const hasBullets = allBullets.length > 0
    const hasThreePlusPerRole = filledExps.length > 0 && filledExps.every(e => e.bullets.filter(b => b.trim()).length >= 3)
    const bulletsUseVerbs = allBullets.length > 0 && allBullets.some(b => {
      const firstWord = b.trim().split(/\s+/)[0]?.toLowerCase()
      return ACTION_VERBS.has(firstWord)
    })
    items.push({ label: 'At least 1 role', points: hasOneRole ? 10 : 0, maxPoints: 10, suggestion: hasOneRole ? undefined : 'Add a work experience', section: 'experience' })
    items.push({ label: '2+ roles', points: hasTwoRoles ? 5 : 0, maxPoints: 5, suggestion: hasTwoRoles ? undefined : 'Add another position for a stronger profile', section: 'experience' })
    items.push({ label: 'Bullet points present', points: hasBullets ? 5 : 0, maxPoints: 5, suggestion: hasBullets ? undefined : 'Add bullet points to your roles', section: 'experience' })
    items.push({ label: '3+ bullets per role', points: hasThreePlusPerRole ? 5 : 0, maxPoints: 5, suggestion: hasThreePlusPerRole ? undefined : 'Add at least 3 bullets per role', section: 'experience' })
    items.push({ label: 'Bullets use action verbs', points: bulletsUseVerbs ? 5 : 0, maxPoints: 5, suggestion: bulletsUseVerbs ? undefined : 'Start bullets with verbs like Led, Designed, Built', section: 'experience' })

    // Education (10 pts)
    const filledEdu = education.filter(e => e.institution.trim() || e.degree.trim())
    const hasOneEdu = filledEdu.length >= 1
    const hasDegreeAndInstitution = filledEdu.some(e => e.institution.trim() && e.degree.trim())
    items.push({ label: 'At least 1 education entry', points: hasOneEdu ? 5 : 0, maxPoints: 5, suggestion: hasOneEdu ? undefined : 'Add your education', section: 'education' })
    items.push({ label: 'Degree + institution', points: hasDegreeAndInstitution ? 5 : 0, maxPoints: 5, suggestion: hasDegreeAndInstitution ? undefined : 'Include both degree and school name', section: 'education' })

    // Skills (15 pts)
    const skillCount = skills.length
    const skillPoints = skillCount >= 8 ? 15 : skillCount >= 5 ? 10 : skillCount >= 1 ? 5 : 0
    const skillSuggestion = skillCount >= 8 ? undefined : skillCount >= 5 ? 'Add 8+ skills for maximum score' : skillCount >= 1 ? 'Add at least 5 skills' : 'Add your skills'
    items.push({ label: `Skills (${skillCount} added)`, points: skillPoints, maxPoints: 15, suggestion: skillSuggestion, section: 'skills' as ActiveSection })

    // Projects (15 pts)
    const filledProjects = projects.filter(p => p.name.trim())
    const hasOneProject = filledProjects.length >= 1
    const hasProjectDesc = filledProjects.some(p => p.description.trim())
    const hasProjectTech = filledProjects.some(p => p.technologies.trim())
    items.push({ label: 'At least 1 project', points: hasOneProject ? 5 : 0, maxPoints: 5, suggestion: hasOneProject ? undefined : 'Add a project', section: 'projects' })
    items.push({ label: 'Project description', points: hasProjectDesc ? 5 : 0, maxPoints: 5, suggestion: hasProjectDesc ? undefined : 'Add a description to your project', section: 'projects' })
    items.push({ label: 'Project technologies', points: hasProjectTech ? 5 : 0, maxPoints: 5, suggestion: hasProjectTech ? undefined : 'List technologies used in your project', section: 'projects' })

    const total = items.reduce((sum, item) => sum + item.points, 0)
    return { total, items }
  }

  const [scoreExpanded, setScoreExpanded] = useState(false)

  const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  const MonthYearPicker = ({ label, value, onChange, disabled }: { label: string; value: string; onChange: (val: string) => void; disabled?: boolean }) => {
    const [isOpen, setIsOpen] = useState(false)
    const ref = useRef<HTMLDivElement>(null)
    const currentYear = new Date().getFullYear()

    const selectedYear = value ? parseInt(value.split('-')[0]) : null
    const selectedMonth = value ? parseInt(value.split('-')[1]) : null
    const [viewYear, setViewYear] = useState(selectedYear || currentYear)

    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false)
      }
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const displayValue = selectedMonth && selectedYear
      ? `${MONTH_LABELS[selectedMonth - 1]} ${selectedYear}`
      : null

    const handleSelect = (monthIndex: number) => {
      const m = String(monthIndex + 1).padStart(2, '0')
      onChange(`${viewYear}-${m}`)
      setIsOpen(false)
    }

    return (
      <div className="w-full" ref={ref}>
        {label && (
          <label className="block text-sm font-medium text-neutral-700 mb-2">{label}</label>
        )}
        <div className="relative">
          <button
            type="button"
            disabled={disabled}
            onClick={() => !disabled && setIsOpen(!isOpen)}
            className="w-full bg-white border border-neutral-200 rounded-lg px-4 py-2.5 text-left hover:border-neutral-300 hover:shadow-[0px_2px_0px_0px_rgba(0,0,0,0.04)] transition-all focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400 flex items-center justify-between disabled:bg-neutral-50 disabled:text-neutral-400 disabled:cursor-not-allowed disabled:hover:border-neutral-200 disabled:hover:shadow-none"
          >
            <span className={displayValue ? 'text-neutral-900 text-sm' : 'text-neutral-400 text-sm'}>
              {displayValue || 'Select date'}
            </span>
            <svg className={`w-4 h-4 text-neutral-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {isOpen && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-[0px_4px_0px_0px_rgba(0,0,0,0.08)] p-3">
              {/* Year nav */}
              <div className="flex items-center justify-between mb-2">
                <button type="button" onClick={() => setViewYear(viewYear - 1)} className="p-1 rounded hover:bg-neutral-100 transition-colors text-neutral-500">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <span className="text-sm font-medium text-neutral-900">{viewYear}</span>
                <button type="button" onClick={() => setViewYear(viewYear + 1)} disabled={viewYear >= currentYear} className="p-1 rounded hover:bg-neutral-100 transition-colors text-neutral-500 disabled:opacity-30 disabled:cursor-not-allowed">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>
              {/* Month grid */}
              <div className="grid grid-cols-3 gap-1">
                {MONTH_LABELS.map((m, i) => {
                  const isSelected = selectedYear === viewYear && selectedMonth === i + 1
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => handleSelect(i)}
                      className={`py-1.5 rounded-md text-xs font-medium transition-colors ${
                        isSelected
                          ? 'bg-neutral-900 text-white'
                          : 'text-neutral-600 hover:bg-neutral-100'
                      }`}
                    >
                      {m}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  const ResumeScoreCard = () => {
    const { total, items } = getResumeScore()
    const color = total < 40 ? '#ef4444' : total < 70 ? '#f97316' : '#22c55e'
    const suggestions = items.filter(i => i.suggestion)
    const completed = items.filter(i => !i.suggestion)

    const radius = 28
    const circumference = 2 * Math.PI * radius
    const offset = circumference - (total / 100) * circumference

    return (
      <div className="bg-white rounded-xl border border-neutral-200 p-5 mb-3">
        <div className="flex items-center gap-4">
          {/* Circular gauge */}
          <div className="relative shrink-0">
            <svg width="64" height="64" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r={radius} fill="none" stroke="#f5f5f5" strokeWidth="5" />
              <circle
                cx="32" cy="32" r={radius} fill="none"
                stroke={color} strokeWidth="5" strokeLinecap="round"
                strokeDasharray={circumference} strokeDashoffset={offset}
                transform="rotate(-90 32 32)"
                style={{ transition: 'stroke-dashoffset 0.6s ease, stroke 0.3s ease' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-lg font-bold text-neutral-900" style={{ lineHeight: 1 }}>{total}</span>
              <span className="text-[9px] text-neutral-400 mt-0.5">/ 100</span>
            </div>
          </div>
          {/* Label */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-neutral-900">Resume Score</p>
            <p className="text-xs text-neutral-500 mt-0.5">
              {total < 40 ? 'Needs work — fill in more sections' : total < 70 ? 'Getting there — keep adding details' : total < 100 ? 'Strong resume — a few tweaks left' : 'Perfect score!'}
            </p>
            {suggestions.length > 0 && (
              <button
                onClick={() => setScoreExpanded(!scoreExpanded)}
                className="text-xs text-neutral-500 hover:text-neutral-700 mt-1.5 flex items-center gap-1 transition-colors"
              >
                {suggestions.length} suggestion{suggestions.length !== 1 ? 's' : ''}
                <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${scoreExpanded ? 'rotate-180' : ''}`} />
              </button>
            )}
          </div>
        </div>

        {/* Expandable checklist */}
        {scoreExpanded && (
          <div className="mt-4 pt-3 border-t border-neutral-100 space-y-1.5">
            {suggestions.map((item, i) => (
              <button key={i} className="flex items-center gap-2 w-full text-left group" onClick={() => setActiveSection(item.section)}>
                <div className="w-4 h-4 rounded-full border-2 border-neutral-200 shrink-0" />
                <span className="text-xs text-neutral-600 group-hover:underline">{item.suggestion}</span>
              </button>
            ))}
            {completed.map((item, i) => (
              <div key={`done-${i}`} className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                <span className="text-xs text-neutral-400 line-through">{item.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  const SECTION_ORDER: ActiveSection[] = ['contact', 'summary', 'experience', 'education', 'skills', 'projects']

  const sections: { id: ActiveSection; label: string }[] = [
    { id: 'contact', label: 'Contact Information' },
    { id: 'summary', label: 'Professional Summary' },
    { id: 'experience', label: 'Work Experience' },
    { id: 'education', label: 'Education' },
    { id: 'skills', label: 'Skills' },
    { id: 'projects', label: 'Projects' },
  ]

  const goToNextSection = () => {
    if (!activeSection) return
    const idx = SECTION_ORDER.indexOf(activeSection)
    if (idx < SECTION_ORDER.length - 1) setActiveSection(SECTION_ORDER[idx + 1])
  }

  // Summary for collapsed accordion headers
  const getSectionSummary = (id: ActiveSection): string => {
    switch (id) {
      case 'contact':
        return personalInfo.fullName || personalInfo.email ? [personalInfo.fullName, personalInfo.email].filter(Boolean).join(' · ') : ''
      case 'summary':
        return personalInfo.summary ? personalInfo.summary.slice(0, 60) + (personalInfo.summary.length > 60 ? '...' : '') : ''
      case 'experience':
        const filledExp = experiences.filter(e => e.title || e.company)
        return filledExp.length ? filledExp.map(e => [e.title, e.company].filter(Boolean).join(' at ')).join(', ') : ''
      case 'education':
        const filledEdu = education.filter(e => e.institution || e.degree)
        return filledEdu.length ? filledEdu.map(e => [e.degree, e.institution].filter(Boolean).join(', ')).join('; ') : ''
      case 'skills':
        return skills.length ? skills.slice(0, 4).join(', ') + (skills.length > 4 ? ` +${skills.length - 4}` : '') : ''
      case 'projects':
        const filledProj = projects.filter(p => p.name)
        return filledProj.length ? filledProj.map(p => p.name).join(', ') : ''
      default:
        return ''
    }
  }

  // Resume preview component (reused in both layouts)
  const ResumePreview = () => {
    const t = selectedTemplate

    const fontStyle = t === 'classic'
      ? { fontFamily: 'Georgia, serif' }
      : { fontFamily: 'system-ui, -apple-system, sans-serif' }

    const padding = t === 'minimal' ? 'p-6 md:p-8' : 'p-8 md:p-12'
    const sectionMb = t === 'modern' ? 'mb-8' : t === 'minimal' ? 'mb-4' : 'mb-6'

    const sectionHeading = (label: string) => {
      if (t === 'modern') {
        return (
          <h2 className="text-sm font-bold text-blue-600 uppercase tracking-wider pl-3 border-l-4 border-blue-600 mb-4">{label}</h2>
        )
      }
      if (t === 'minimal') {
        return (
          <h2 className="text-sm font-bold text-neutral-900 mt-6 mb-2">{label}</h2>
        )
      }
      return (
        <h2 className="text-sm font-bold text-neutral-900 uppercase tracking-wider border-b border-neutral-300 pb-1 mb-3">{label}</h2>
      )
    }

    const bulletChar = t === 'minimal' ? '\u2013' : '\u2022'

    const resumeBody = (
      <div className={padding}>
        {/* Header */}
        {t === 'modern' ? (
          <div className="pb-6 mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-neutral-900 mb-1">
              {personalInfo.fullName || 'Your Name'}
            </h1>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-neutral-600">
              {personalInfo.email && <span>{personalInfo.email}</span>}
              {personalInfo.phone && <span>{personalInfo.phone}</span>}
              {personalInfo.location && <span>{personalInfo.location}</span>}
            </div>
            {(personalInfo.linkedin || personalInfo.portfolio) && (
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-neutral-500 mt-1">
                {personalInfo.linkedin && <span>{personalInfo.linkedin}</span>}
                {personalInfo.portfolio && <span>{personalInfo.portfolio}</span>}
              </div>
            )}
          </div>
        ) : t === 'minimal' ? (
          <div className="text-center pb-4 mb-4">
            <h1 className="text-xl md:text-2xl font-bold text-neutral-900 uppercase tracking-wider mb-1" style={{ lineHeight: 1.2 }}>
              {personalInfo.fullName || 'Your Name'}
            </h1>
            <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-xs text-neutral-600">
              {personalInfo.email && <span>{personalInfo.email}</span>}
              {personalInfo.phone && <span>{personalInfo.phone}</span>}
              {personalInfo.location && <span>{personalInfo.location}</span>}
            </div>
            {(personalInfo.linkedin || personalInfo.portfolio) && (
              <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-xs text-neutral-500 mt-0.5">
                {personalInfo.linkedin && <span>{personalInfo.linkedin}</span>}
                {personalInfo.portfolio && <span>{personalInfo.portfolio}</span>}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center border-b border-neutral-200 pb-6 mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-neutral-900 mb-2">
              {personalInfo.fullName || 'Your Name'}
            </h1>
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-sm text-neutral-600">
              {personalInfo.email && <span>{personalInfo.email}</span>}
              {personalInfo.phone && <span>{personalInfo.phone}</span>}
              {personalInfo.location && <span>{personalInfo.location}</span>}
            </div>
            {(personalInfo.linkedin || personalInfo.portfolio) && (
              <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-sm text-neutral-500 mt-1">
                {personalInfo.linkedin && <span>{personalInfo.linkedin}</span>}
                {personalInfo.portfolio && <span>{personalInfo.portfolio}</span>}
              </div>
            )}
          </div>
        )}

        {personalInfo.summary && (
          <section className={sectionMb}>
            {sectionHeading('Professional Summary')}
            <p className={`text-sm text-neutral-700 ${t === 'minimal' ? 'leading-snug' : 'leading-relaxed'}`}>{personalInfo.summary}</p>
          </section>
        )}

        {experiences.some((e) => e.company || e.title) && (
          <section className={sectionMb}>
            {sectionHeading('Experience')}
            <div className={t === 'minimal' ? 'space-y-3' : 'space-y-4'}>
              {experiences.filter((e) => e.company || e.title).map((exp) => (
                <div key={exp.id}>
                  <div className="flex flex-wrap justify-between items-start gap-2">
                    <div>
                      <h3 className="font-semibold text-neutral-900">{exp.title}</h3>
                      <p className="text-sm text-neutral-600">{exp.company}{exp.location && `, ${exp.location}`}</p>
                    </div>
                    <span className="text-sm text-neutral-500 whitespace-nowrap">
                      {formatDate(exp.startDate)} {'\u2013'} {exp.isCurrent ? 'Present' : formatDate(exp.endDate)}
                    </span>
                  </div>
                  {exp.bullets.filter(Boolean).length > 0 && (
                    <ul className={`mt-2 ${t === 'minimal' ? 'space-y-0.5' : 'space-y-1'}`}>
                      {exp.bullets.filter(Boolean).map((bullet, i) => (
                        <li key={i} className="text-sm text-neutral-700 flex">
                          <span className="mr-2 text-neutral-400">{bulletChar}</span>
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {education.some((e) => e.institution || e.degree) && (
          <section className={sectionMb}>
            {sectionHeading('Education')}
            <div className={t === 'minimal' ? 'space-y-2' : 'space-y-3'}>
              {education.filter((e) => e.institution || e.degree).map((edu) => (
                <div key={edu.id} className="flex flex-wrap justify-between items-start gap-2">
                  <div>
                    <h3 className="font-semibold text-neutral-900">{edu.degree}{edu.fieldOfStudy && ` in ${edu.fieldOfStudy}`}</h3>
                    <p className="text-sm text-neutral-600">{edu.institution}{edu.location && `, ${edu.location}`}{edu.gpa && ` \u00B7 GPA: ${edu.gpa}`}</p>
                  </div>
                  <span className="text-sm text-neutral-500">{formatDate(edu.graduationDate)}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {skills.length > 0 && (
          <section className={sectionMb}>
            {sectionHeading('Skills')}
            {t === 'modern' ? (
              <div className="flex flex-wrap gap-1.5">
                {skills.map((skill) => (
                  <span key={skill} className="px-2 py-0.5 bg-neutral-100 text-neutral-700 rounded text-xs font-medium">{skill}</span>
                ))}
              </div>
            ) : t === 'minimal' ? (
              <p className="text-sm text-neutral-700">{skills.join(', ')}</p>
            ) : (
              <p className="text-sm text-neutral-700">{skills.join(' \u00B7 ')}</p>
            )}
          </section>
        )}

        {projects.some((p) => p.name && p.description) && (
          <section>
            {sectionHeading('Projects')}
            <div className={t === 'minimal' ? 'space-y-2' : 'space-y-3'}>
              {projects.filter((p) => p.name && p.description).map((project) => (
                <div key={project.id}>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-neutral-900">{project.name}</h3>
                    {project.link && <span className="text-xs text-neutral-500">({project.link})</span>}
                  </div>
                  <p className="text-sm text-neutral-700 mt-1">{project.description}</p>
                  {project.technologies && <p className="text-xs text-neutral-500 mt-1">Technologies: {project.technologies}</p>}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    )

    return (
      <div className="relative">
        {/* Hidden full-content div for PDF export + measurement */}
        <div
          ref={resumeRef}
          className="bg-white"
          style={{ ...fontStyle, position: 'absolute', left: '-9999px', width: '100%' }}
          aria-hidden="true"
        >
          {resumeBody}
        </div>

        {/* Toolbar bar above the card */}
        <div className="flex items-center justify-between mb-2">
          {/* Style picker */}
          <div className="relative" ref={templatePickerRef}>
            <button
              onClick={() => setTemplatePickerOpen(!templatePickerOpen)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-neutral-600 bg-white border border-neutral-200 rounded-lg hover:border-neutral-300 hover:shadow-[0px_2px_0px_0px_rgba(0,0,0,0.04)] transition-all"
            >
              <Palette className="w-3 h-3" />
              Style
            </button>

            {templatePickerOpen && (
              <div className="absolute z-50 top-full left-0 mt-1.5 bg-white border border-neutral-200 rounded-xl shadow-[0px_4px_12px_rgba(0,0,0,0.08)] p-2 flex gap-2">
                {([
                  { id: 'classic' as ResumeTemplate, label: 'Classic', lines: (
                    <>
                      <div className="w-6 h-[3px] bg-neutral-400 mx-auto mb-1 rounded-full" />
                      <div className="w-8 h-[2px] bg-neutral-300 mx-auto mb-2 rounded-full" />
                      <div className="w-full h-[1px] bg-neutral-200 mb-1.5" />
                      <div className="w-full h-[2px] bg-neutral-300 mb-1 rounded-full" />
                      <div className="w-3/4 h-[2px] bg-neutral-200 mb-1 rounded-full" />
                      <div className="w-full h-[1px] bg-neutral-200 mb-1.5" />
                      <div className="w-full h-[2px] bg-neutral-300 mb-1 rounded-full" />
                      <div className="w-2/3 h-[2px] bg-neutral-200 rounded-full" />
                    </>
                  )},
                  { id: 'modern' as ResumeTemplate, label: 'Modern', lines: (
                    <>
                      <div className="w-7 h-[3px] bg-neutral-400 mb-1 rounded-full" />
                      <div className="w-5 h-[2px] bg-neutral-300 mb-2 rounded-full" />
                      <div className="flex items-center gap-1 mb-1.5">
                        <div className="w-[3px] h-2.5 bg-blue-400 rounded-full shrink-0" />
                        <div className="w-full h-[2px] bg-neutral-300 rounded-full" />
                      </div>
                      <div className="w-3/4 h-[2px] bg-neutral-200 mb-1 rounded-full ml-2" />
                      <div className="flex items-center gap-1 mb-1.5 mt-2">
                        <div className="w-[3px] h-2.5 bg-blue-400 rounded-full shrink-0" />
                        <div className="w-full h-[2px] bg-neutral-300 rounded-full" />
                      </div>
                      <div className="w-2/3 h-[2px] bg-neutral-200 rounded-full ml-2" />
                    </>
                  )},
                  { id: 'minimal' as ResumeTemplate, label: 'Minimal', lines: (
                    <>
                      <div className="w-8 h-[3px] bg-neutral-500 mx-auto mb-1 rounded-full" />
                      <div className="w-6 h-[2px] bg-neutral-300 mx-auto mb-2 rounded-full" />
                      <div className="w-full h-[2px] bg-neutral-400 mb-1 rounded-full" />
                      <div className="w-full h-[2px] bg-neutral-200 mb-0.5 rounded-full" />
                      <div className="w-3/4 h-[2px] bg-neutral-200 mb-1.5 rounded-full" />
                      <div className="w-full h-[2px] bg-neutral-400 mb-1 rounded-full" />
                      <div className="w-2/3 h-[2px] bg-neutral-200 rounded-full" />
                    </>
                  )},
                ]).map((tmpl) => (
                  <button
                    key={tmpl.id}
                    onClick={() => { setSelectedTemplate(tmpl.id); setTemplatePickerOpen(false) }}
                    className={`w-24 rounded-lg border-2 p-2 transition-all ${
                      selectedTemplate === tmpl.id
                        ? 'border-neutral-900 shadow-sm'
                        : 'border-neutral-200 hover:border-neutral-300'
                    }`}
                  >
                    <div className="bg-white rounded p-1.5 mb-1 aspect-[8.5/11] flex flex-col justify-start overflow-hidden">
                      {tmpl.lines}
                    </div>
                    <p className={`text-[10px] font-medium text-center ${
                      selectedTemplate === tmpl.id ? 'text-neutral-900' : 'text-neutral-500'
                    }`}>
                      {tmpl.label}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Page navigation */}
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                disabled={currentPage === 0}
                className="p-1 text-neutral-500 bg-white border border-neutral-200 rounded-md hover:border-neutral-300 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs font-medium text-neutral-500 tabular-nums px-0.5">
                {currentPage + 1} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={currentPage === totalPages - 1}
                className="p-1 text-neutral-500 bg-white border border-neutral-200 rounded-md hover:border-neutral-300 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Visible page card */}
        <div
          className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden"
          style={pageHeight > 0 ? { height: pageHeight } : undefined}
        >
          <div style={{ ...fontStyle, transform: currentPage > 0 && pageHeight > 0 ? `translateY(${-currentPage * pageHeight}px)` : undefined }}>
            {resumeBody}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <h1 className="text-lg font-medium text-neutral-900">Resume Builder</h1>
              <span className="text-xs text-neutral-400 bg-neutral-100 px-2 py-1 rounded-full">ATS-Optimized</span>
            </div>

            <div className="flex items-center gap-3">
              {/* Mobile-only tab toggle */}
              <div className="flex xl:hidden bg-neutral-100 rounded-lg p-1">
                <button
                  onClick={() => setActiveTab('edit')}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'edit' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}
                >
                  Edit
                </button>
                <button
                  onClick={() => setActiveTab('preview')}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-1.5 ${activeTab === 'preview' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}
                >
                  <Eye className="w-4 h-4" />
                  Preview
                </button>
              </div>

              <Button variant="secondary" size="sm" onClick={() => setShowUploadModal(true)}>
                <Upload className="w-4 h-4" />
                Upload Resume
              </Button>
              <Button variant="primary" size="sm" onClick={exportPDF}>
                <Download className="w-4 h-4" />
                Export PDF
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop: side-by-side layout */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Left column: Accordion form */}
          <div className={`flex-1 min-w-0 space-y-3 ${activeTab === 'preview' ? 'hidden xl:block' : ''}`}>
            {sections.map((section) => {
              const isOpen = activeSection === section.id
              const summary = getSectionSummary(section.id)

              return (
                <div key={section.id} className="bg-white rounded-xl border border-neutral-200">
                  {/* Accordion header */}
                  <button
                    onClick={() => setActiveSection(isOpen ? null : section.id)}
                    className={`w-full flex items-center justify-between px-6 py-4 text-left hover:bg-neutral-50 transition-colors ${isOpen ? 'rounded-t-xl' : 'rounded-xl'}`}
                  >
                    <div className="flex-1 min-w-0">
                      <span className={`text-sm font-medium ${isOpen ? 'text-neutral-900' : 'text-neutral-700'}`}>
                        {section.label}
                      </span>
                      {!isOpen && summary && (
                        <p className="text-xs text-neutral-400 mt-0.5 truncate">{summary}</p>
                      )}
                    </div>
                    <ChevronDown className={`w-4 h-4 text-neutral-400 shrink-0 ml-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Accordion content */}
                  {isOpen && (
                    <div className="px-6 pb-6 border-t border-neutral-100">
                      {/* Contact */}
                      {section.id === 'contact' && (
                        <div className="space-y-4 pt-4">
                          <div className="grid sm:grid-cols-2 gap-4">
                            <Input label="Full Name *" value={personalInfo.fullName} onChange={(e) => setPersonalInfo({ ...personalInfo, fullName: e.target.value })} placeholder="Jane Smith" />
                            <Input label="Email *" type="email" value={personalInfo.email} onChange={(e) => setPersonalInfo({ ...personalInfo, email: e.target.value })} placeholder="jane@email.com" />
                          </div>
                          <div className="grid sm:grid-cols-2 gap-4">
                            <Input label="Phone" type="tel" value={personalInfo.phone} onChange={(e) => setPersonalInfo({ ...personalInfo, phone: e.target.value })} placeholder="+1 (555) 123-4567" />
                            <Input label="Location" value={personalInfo.location} onChange={(e) => setPersonalInfo({ ...personalInfo, location: e.target.value })} placeholder="San Francisco, CA" />
                          </div>
                          <div className="grid sm:grid-cols-2 gap-4">
                            <Input label="LinkedIn" value={personalInfo.linkedin} onChange={(e) => setPersonalInfo({ ...personalInfo, linkedin: e.target.value })} placeholder="linkedin.com/in/janesmith" />
                            <Input label="Portfolio" value={personalInfo.portfolio} onChange={(e) => setPersonalInfo({ ...personalInfo, portfolio: e.target.value })} placeholder="janesmith.design" />
                          </div>
                        </div>
                      )}

                      {/* Summary */}
                      {section.id === 'summary' && (
                        <div className="space-y-4 pt-4">
                          <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-2">Summary</label>
                            <textarea
                              value={personalInfo.summary}
                              onChange={(e) => setPersonalInfo({ ...personalInfo, summary: e.target.value })}
                              rows={4}
                              className="w-full px-4 py-3 border border-neutral-200 rounded-lg bg-white text-neutral-900 placeholder:text-neutral-400 hover:border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400 transition-all resize-none"
                              placeholder="Product designer with 5+ years of experience creating user-centered digital experiences. Specialized in design systems and mobile interfaces."
                            />
                            <p className="mt-2 text-xs text-neutral-400">{personalInfo.summary.length}/300 characters recommended</p>
                          </div>
                        </div>
                      )}

                      {/* Experience */}
                      {section.id === 'experience' && (
                        <div className="pt-4">
                          <div className="space-y-3">
                            {experiences.map((exp, expIndex) => {
                              const isExpOpen = openExperienceId === exp.id
                              const hasContent = exp.title || exp.company
                              return (
                                <div key={exp.id} className="border border-neutral-200 rounded-lg">
                                  {/* Card header - always visible */}
                                  <button
                                    onClick={() => setOpenExperienceId(isExpOpen ? null : exp.id)}
                                    className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-neutral-50 transition-colors"
                                  >
                                    <div className="flex-1 min-w-0">
                                      {hasContent ? (
                                        <>
                                          <span className="text-sm font-medium text-neutral-900">{exp.title || 'Untitled Role'}</span>
                                          <p className="text-xs text-neutral-400 mt-0.5 truncate">
                                            {[exp.company, exp.location].filter(Boolean).join(' · ')}
                                            {exp.startDate && ` · ${formatDate(exp.startDate)} – ${exp.isCurrent ? 'Present' : formatDate(exp.endDate)}`}
                                          </p>
                                        </>
                                      ) : (
                                        <span className="text-sm text-neutral-400">Position {expIndex + 1}</span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2 ml-4">
                                      {experiences.length > 1 && (
                                        <span
                                          onClick={(e) => { e.stopPropagation(); removeExperience(exp.id) }}
                                          className="text-neutral-300 hover:text-red-500 transition-colors p-1"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </span>
                                      )}
                                      <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform duration-200 ${isExpOpen ? 'rotate-180' : ''}`} />
                                    </div>
                                  </button>

                                  {/* Card body - inputs */}
                                  {isExpOpen && (
                                    <div className="px-4 pb-4 border-t border-neutral-100 space-y-4 pt-4">
                                      <div className="grid sm:grid-cols-2 gap-4">
                                        <Input label="Job Title *" value={exp.title} onChange={(e) => updateExperience(exp.id, 'title', e.target.value)} placeholder="Senior Product Designer" />
                                        <Input label="Company *" value={exp.company} onChange={(e) => updateExperience(exp.id, 'company', e.target.value)} placeholder="Acme Inc." />
                                      </div>
                                      <div className="grid sm:grid-cols-3 gap-4">
                                        <Input label="Location" value={exp.location} onChange={(e) => updateExperience(exp.id, 'location', e.target.value)} placeholder="Remote" />
                                        <MonthYearPicker label="Start Date" value={exp.startDate} onChange={(val) => updateExperience(exp.id, 'startDate', val)} />
                                        <div>
                                          <MonthYearPicker label="End Date" value={exp.endDate} onChange={(val) => updateExperience(exp.id, 'endDate', val)} disabled={exp.isCurrent} />
                                          <label className="flex items-center gap-2 mt-2">
                                            <input type="checkbox" checked={exp.isCurrent} onChange={(e) => updateExperience(exp.id, 'isCurrent', e.target.checked)} className="rounded border-neutral-300" />
                                            <span className="text-xs text-neutral-500">Current role</span>
                                          </label>
                                        </div>
                                      </div>
                                      <div>
                                        <label className="block text-sm font-medium text-neutral-700 mb-2">Key Achievements</label>
                                        <div className="space-y-2">
                                          {exp.bullets.map((bullet, bIndex) => (
                                            <div key={bIndex} className="flex gap-2">
                                              <div className="flex-1 relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-300">&bull;</span>
                                                <input
                                                  type="text"
                                                  value={bullet}
                                                  onChange={(e) => updateBullet(exp.id, bIndex, e.target.value)}
                                                  className="w-full pl-7 pr-3 py-2.5 border border-neutral-200 rounded-lg bg-white text-neutral-900 placeholder:text-neutral-400 hover:border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400 transition-all text-sm"
                                                  placeholder="Led redesign of checkout flow, increasing conversions by 23%"
                                                />
                                              </div>
                                              <div className="relative group flex items-stretch">
                                                <button
                                                  onClick={() => enhanceBullet(exp.id, bIndex)}
                                                  disabled={isEnhancing === `${exp.id}-${bIndex}` || !bullet}
                                                  className="px-3 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                                                >
                                                  <Sparkles className={`w-4 h-4 ${isEnhancing === `${exp.id}-${bIndex}` ? 'animate-pulse' : ''}`} />
                                                </button>
                                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2.5 py-1 bg-neutral-900 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
                                                  Enhance with AI
                                                </div>
                                              </div>
                                              {exp.bullets.length > 1 && (
                                                <button onClick={() => removeBullet(exp.id, bIndex)} className="px-2 py-2 text-neutral-400 hover:text-red-500 transition-colors">
                                                  <Trash2 className="w-4 h-4" />
                                                </button>
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                        <button onClick={() => addBullet(exp.id)} className="mt-2 text-sm text-neutral-500 hover:text-neutral-700 transition-colors">+ Add bullet point</button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                          <Button variant="secondary" size="sm" onClick={() => {
                            const newId = addExperience()
                            setOpenExperienceId(newId)
                          }} className="mt-4">
                            <Plus className="w-4 h-4" />
                            Add Position
                          </Button>
                        </div>
                      )}

                      {/* Education */}
                      {section.id === 'education' && (
                        <div className="pt-4">
                          <div className="space-y-3">
                            {education.map((edu, eduIndex) => {
                              const isEduOpen = openEducationId === edu.id
                              const hasContent = edu.institution || edu.degree
                              return (
                                <div key={edu.id} className="border border-neutral-200 rounded-lg">
                                  {/* Card header */}
                                  <button
                                    onClick={() => setOpenEducationId(isEduOpen ? null : edu.id)}
                                    className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-neutral-50 transition-colors"
                                  >
                                    <div className="flex-1 min-w-0">
                                      {hasContent ? (
                                        <>
                                          <span className="text-sm font-medium text-neutral-900">{edu.degree || 'Untitled Degree'}{edu.fieldOfStudy && ` in ${edu.fieldOfStudy}`}</span>
                                          <p className="text-xs text-neutral-400 mt-0.5 truncate">
                                            {[edu.institution, edu.location].filter(Boolean).join(' · ')}
                                            {edu.graduationDate && ` · ${formatDate(edu.graduationDate)}`}
                                          </p>
                                        </>
                                      ) : (
                                        <span className="text-sm text-neutral-400">Education {eduIndex + 1}</span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2 ml-4">
                                      {education.length > 1 && (
                                        <span
                                          onClick={(e) => { e.stopPropagation(); removeEducation(edu.id) }}
                                          className="text-neutral-300 hover:text-red-500 transition-colors p-1"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </span>
                                      )}
                                      <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform duration-200 ${isEduOpen ? 'rotate-180' : ''}`} />
                                    </div>
                                  </button>

                                  {/* Card body */}
                                  {isEduOpen && (
                                    <div className="px-4 pb-4 border-t border-neutral-100 space-y-4 pt-4">
                                      <div className="grid sm:grid-cols-2 gap-4">
                                        <Input label="Institution *" value={edu.institution} onChange={(e) => updateEducation(edu.id, 'institution', e.target.value)} placeholder="Stanford University" />
                                        <Input label="Location" value={edu.location} onChange={(e) => updateEducation(edu.id, 'location', e.target.value)} placeholder="Stanford, CA" />
                                      </div>
                                      <div className="grid sm:grid-cols-2 gap-4">
                                        <Input label="Degree" value={edu.degree} onChange={(e) => updateEducation(edu.id, 'degree', e.target.value)} placeholder="Bachelor of Science" />
                                        <Input label="Field of Study" value={edu.fieldOfStudy} onChange={(e) => updateEducation(edu.id, 'fieldOfStudy', e.target.value)} placeholder="Human-Computer Interaction" />
                                      </div>
                                      <div className="grid sm:grid-cols-2 gap-4">
                                        <MonthYearPicker label="Graduation Date" value={edu.graduationDate} onChange={(val) => updateEducation(edu.id, 'graduationDate', val)} />
                                        <Input label="GPA (optional)" value={edu.gpa || ''} onChange={(e) => updateEducation(edu.id, 'gpa', e.target.value)} placeholder="3.8/4.0" hint="Include if 3.5 or higher" />
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                          <Button variant="secondary" size="sm" onClick={() => {
                            const newId = addEducation()
                            setOpenEducationId(newId)
                          }} className="mt-4">
                            <Plus className="w-4 h-4" />
                            Add Education
                          </Button>
                        </div>
                      )}

                      {/* Skills */}
                      {section.id === 'skills' && (
                        <div className="space-y-4 pt-4">
                          {/* Combobox search input */}
                          <div className="relative" ref={skillDropdownRef}>
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                              <input
                                ref={skillInputRef}
                                type="text"
                                value={newSkill}
                                onChange={(e) => {
                                  setNewSkill(e.target.value)
                                  setSkillsDropdownOpen(true)
                                }}
                                onFocus={() => setSkillsDropdownOpen(true)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault()
                                    if (filteredSkillOptions.length > 0) {
                                      selectSkill(filteredSkillOptions[0])
                                    } else if (newSkill.trim()) {
                                      addSkill()
                                    }
                                  }
                                }}
                                className="w-full pl-9 pr-9 py-2.5 border border-neutral-200 rounded-lg bg-white text-neutral-900 placeholder:text-neutral-400 hover:border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400 transition-all text-sm"
                                placeholder="Search skills (e.g., Figma, User Research, Prototyping)"
                              />
                              <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                              </svg>
                            </div>
                            {skillsDropdownOpen && filteredSkillOptions.length > 0 && (
                              <div className="absolute z-50 w-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-[0px_4px_0px_0px_rgba(0,0,0,0.08)] max-h-48 overflow-y-auto">
                                {filteredSkillOptions.slice(0, 20).map(skill => (
                                  <button
                                    key={skill}
                                    onClick={() => selectSkill(skill)}
                                    className="w-full px-3 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
                                  >
                                    {skill}
                                  </button>
                                ))}
                                {newSkill.trim() && !DESIGN_SKILLS.some(s => s.toLowerCase() === newSkill.trim().toLowerCase()) && (
                                  <button
                                    onClick={addSkill}
                                    className="w-full px-3 py-2 text-left text-sm text-neutral-500 hover:bg-neutral-50 transition-colors border-t border-neutral-100"
                                  >
                                    Add &quot;{newSkill.trim()}&quot;
                                  </button>
                                )}
                              </div>
                            )}
                            {skillsDropdownOpen && filteredSkillOptions.length === 0 && newSkill.trim() && (
                              <div className="absolute z-50 w-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-[0px_4px_0px_0px_rgba(0,0,0,0.08)]">
                                <button
                                  onClick={addSkill}
                                  className="w-full px-3 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
                                >
                                  Add &quot;{newSkill.trim()}&quot;
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Selected skills chips */}
                          {skills.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {skills.map((skill) => (
                                <button
                                  key={skill}
                                  onClick={() => removeSkill(skill)}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-neutral-900 text-white rounded-md text-xs font-medium hover:bg-neutral-700 transition-colors"
                                >
                                  {skill}
                                  <X className="w-3 h-3" />
                                </button>
                              ))}
                            </div>
                          )}

                          {skills.length === 0 && (
                            <div className="py-4 text-center">
                              <p className="text-sm text-neutral-400">Search and add skills that match the job you&apos;re applying for.</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Projects */}
                      {section.id === 'projects' && (
                        <div className="pt-4">
                          <div className="space-y-8">
                            {projects.map((project, projIndex) => (
                              <div key={project.id} className="relative">
                                {projIndex > 0 && <div className="absolute -top-4 left-0 right-0 border-t border-neutral-100" />}
                                <div className="space-y-4">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Project {projIndex + 1}</span>
                                    {projects.length > 1 && (
                                      <button onClick={() => removeProject(project.id)} className="text-neutral-400 hover:text-red-500 transition-colors">
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    )}
                                  </div>
                                  <div className="grid sm:grid-cols-2 gap-4">
                                    <Input label="Project Name" value={project.name} onChange={(e) => updateProject(project.id, 'name', e.target.value)} placeholder="Design System" />
                                    <Input label="Link" value={project.link || ''} onChange={(e) => updateProject(project.id, 'link', e.target.value)} placeholder="github.com/user/project" />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-2">Description</label>
                                    <textarea
                                      value={project.description}
                                      onChange={(e) => updateProject(project.id, 'description', e.target.value)}
                                      rows={2}
                                      className="w-full px-4 py-3 border border-neutral-200 rounded-lg bg-white text-neutral-900 placeholder:text-neutral-400 hover:border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400 transition-all resize-none text-sm"
                                      placeholder="Built a comprehensive design system with 50+ components"
                                    />
                                  </div>
                                  <Input label="Technologies" value={project.technologies} onChange={(e) => updateProject(project.id, 'technologies', e.target.value)} placeholder="Figma, React, Storybook" />
                                </div>
                              </div>
                            ))}
                          </div>
                          <Button variant="secondary" size="sm" onClick={addProject} className="mt-4">
                            <Plus className="w-4 h-4" />
                            Add Project
                          </Button>
                        </div>
                      )}

                      {/* Continue button */}
                      <div className="flex justify-end mt-6 pt-4 border-t border-neutral-100">
                        {SECTION_ORDER.indexOf(section.id) < SECTION_ORDER.length - 1 ? (
                          <Button variant="primary" size="sm" onClick={goToNextSection}>
                            Continue
                          </Button>
                        ) : (
                          <Button variant="primary" size="sm" onClick={exportPDF}>
                            <Download className="w-4 h-4" />
                            Export PDF
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Right column: Live preview (always visible on xl+, tab-toggled on mobile) */}
          <div className={`xl:block xl:w-[480px] xl:shrink-0 ${activeTab === 'preview' ? 'block' : 'hidden'}`}>
            <div className="xl:sticky xl:top-24">
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 flex items-start gap-2 mb-3">
                <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                <p className="text-xs text-blue-700 leading-relaxed">
                  <span className="font-medium text-blue-900">ATS Tip: </span>
                  {activeSection ? ATS_TIPS[activeSection] : ATS_TIPS.contact}
                </p>
              </div>
              <ResumeScoreCard />
              <ResumePreview />
              {/* Mobile-only action buttons */}
              <div className="flex justify-center gap-3 mt-4 xl:hidden">
                <Button variant="secondary" onClick={() => setActiveTab('edit')}>
                  Back to Edit
                </Button>
                <Button variant="primary" onClick={exportPDF}>
                  <Download className="w-4 h-4" />
                  Export PDF
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowUpgradeModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full px-8 py-8 text-center animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowUpgradeModal(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-blue-50 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="text-lg font-semibold text-neutral-900 mb-2">Upgrade to Pro</h2>
            <p className="text-sm text-neutral-500 mb-6">
              AI-powered features like resume parsing and bullet enhancement are available to members.
            </p>

            <div className="flex flex-col gap-2">
              {user ? (
                <Button variant="primary" fullWidth onClick={() => window.location.href = '/membership'}>
                  View Plans
                </Button>
              ) : (
                <Button variant="primary" fullWidth onClick={() => {
                  setShowUpgradeModal(false)
                  openSignupModal()
                }}>
                  Sign Up
                </Button>
              )}
              <Button variant="ghost" fullWidth onClick={() => setShowUpgradeModal(false)}>
                Maybe Later
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Resume Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !isUploading && setShowUploadModal(false)} />
          <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <button
              onClick={() => !isUploading && setShowUploadModal(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-medium text-neutral-900 mb-1">Upload Resume</h2>
            <p className="text-sm text-neutral-500 mb-5">Import your existing resume to auto-fill the form.</p>

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.txt"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleResumeUpload(file)
                e.target.value = ''
              }}
            />

            <div
              onClick={() => !isUploading && fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-blue-400', 'bg-blue-50') }}
              onDragLeave={(e) => { e.preventDefault(); e.currentTarget.classList.remove('border-blue-400', 'bg-blue-50') }}
              onDrop={(e) => {
                e.preventDefault()
                e.currentTarget.classList.remove('border-blue-400', 'bg-blue-50')
                const file = e.dataTransfer.files?.[0]
                if (file) handleResumeUpload(file)
              }}
              className={`border-2 border-dashed border-neutral-300 rounded-xl p-8 text-center cursor-pointer transition-all hover:border-neutral-400 hover:bg-neutral-50 ${isUploading ? 'animate-pulse pointer-events-none' : ''}`}
            >
              {isUploading ? (
                <>
                  <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-blue-100 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-blue-600 animate-pulse" />
                  </div>
                  <p className="text-sm font-medium text-neutral-700">Scanning your resume...</p>
                  <p className="text-xs text-neutral-400 mt-1">This may take a few seconds</p>
                </>
              ) : (
                <>
                  <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-neutral-100 flex items-center justify-center">
                    <Upload className="w-5 h-5 text-neutral-500" />
                  </div>
                  <p className="text-sm font-medium text-neutral-700">Drop your resume here or click to browse</p>
                  <p className="text-xs text-neutral-400 mt-1">PDF or TXT, max 5MB</p>
                </>
              )}
            </div>

            {uploadError && (
              <p className="text-sm text-red-600 mt-3">{uploadError}</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
