export interface Job {
  id: string
  title: string
  company: string
  company_logo?: string
  location: string
  salary_min?: number
  salary_max?: number
  salary_currency?: string
  description: string
  requirements: string[]
  benefits: string[]
  job_type: 'full-time' | 'part-time' | 'contract' | 'freelance'
  experience_level: 'entry' | 'mid' | 'senior' | 'lead' | 'executive'
  skills: string[]
  apply_url?: string
  created_at: string
  expires_at?: string
  is_featured: boolean
}

export interface Company {
  id: string
  name: string
  logo_url?: string
  website?: string
  description?: string
  size?: string
  industry?: string
  created_at: string
}

export interface User {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  created_at: string
}

export interface Resume {
  id: string
  user_id: string
  title: string
  full_name: string
  email: string
  phone?: string
  location?: string
  summary?: string
  experience: ResumeExperience[]
  education: ResumeEducation[]
  skills: string[]
  portfolio_url?: string
  linkedin_url?: string
  created_at: string
  updated_at: string
}

export interface ResumeExperience {
  id: string
  company: string
  title: string
  location?: string
  start_date: string
  end_date?: string
  is_current: boolean
  description: string
  highlights: string[]
}

export interface ResumeEducation {
  id: string
  institution: string
  degree: string
  field_of_study?: string
  start_date: string
  end_date?: string
  is_current: boolean
  gpa?: string
}

export interface CoverLetter {
  id: string
  user_id: string
  job_id?: string
  title: string
  content: string
  created_at: string
  updated_at: string
}

export interface Application {
  id: string
  user_id: string
  job_id: string
  resume_id?: string
  cover_letter_id?: string
  status: 'draft' | 'applied' | 'interviewing' | 'offered' | 'rejected' | 'withdrawn'
  notes?: string
  applied_at?: string
  created_at: string
  updated_at: string
}
