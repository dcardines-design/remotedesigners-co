// Job API Types

export type JobSource =
  | 'remotive'
  | 'remoteok'
  | 'arbeitnow'
  | 'jsearch'
  | 'himalayas'
  | 'jobicy'
  | 'greenhouse'
  | 'lever'
  | 'ashby'
  | 'adzuna'
  | 'authenticjobs'
  | 'workingnomads'
  | 'themuse'
  | 'glints'
  | 'tokyodev'
  | 'nodeflairsg'
  | 'jooble'
  | 'jobstreet'
  | 'kalibrr'
  | 'instahyre'
  | 'wantedly'
  | 'linkedin'
  | 'indeed'
  | 'ycombinator'

export interface NormalizedJob {
  id: string
  source: JobSource
  title: string
  company: string
  company_logo?: string
  location: string
  salary_min?: number
  salary_max?: number
  salary_text?: string
  description: string
  job_type: string
  experience_level?: string
  skills: string[]
  apply_url: string
  posted_at: string
  is_featured: boolean
}

export interface AIJobCategorization {
  experience_level: 'entry' | 'mid' | 'senior' | 'lead'
  job_type: 'full-time' | 'part-time' | 'contract' | 'freelance' | 'internship'
  skills: string[]
  salary_min?: number
  salary_max?: number
}

// API Response Types
export interface RemotiveJob {
  id: number
  url: string
  title: string
  company_name: string
  company_logo: string
  category: string
  job_type: string
  publication_date: string
  candidate_required_location: string
  salary: string
  description: string
  tags: string[]
}

export interface RemoteOKJob {
  id: string
  url: string
  position: string
  company: string
  company_logo: string
  location: string
  salary_min?: number
  salary_max?: number
  description: string
  date: string
  tags: string[]
}

export interface ArbeitnowJob {
  slug: string
  title: string
  company_name: string
  company_logo?: string
  location: string
  remote: boolean
  url: string
  description: string
  created_at: string
  tags: string[]
}

export interface HimalayasJob {
  id: string
  title: string
  company: {
    name: string
    logo?: string
  }
  location: string
  salary?: {
    min?: number
    max?: number
    currency?: string
  }
  description: string
  url: string
  publishedAt: string
  categories: string[]
}

export interface JobicyJob {
  id: number
  url: string
  jobTitle: string
  companyName: string
  companyLogo?: string
  jobGeo: string
  annualSalaryMin?: number
  annualSalaryMax?: number
  jobDescription: string
  pubDate: string
  jobType: string[]
  jobLevel: string[]
}

export interface GreenhouseJob {
  id: number
  title: string
  location: {
    name: string
  }
  content: string
  absolute_url: string
  updated_at: string
  departments: Array<{ name: string }>
}

export interface LeverJob {
  id: string
  text: string
  categories: {
    location?: string
    team?: string
    commitment?: string
  }
  description: string
  descriptionPlain: string
  hostedUrl: string
  createdAt: number
}

export interface AshbyJob {
  id: string
  title: string
  location: string
  employmentType: string
  descriptionHtml: string
  publishedAt: string
  applicationUrl: string
}

export interface IndeedJobDetails {
  job_title?: string
  company?: {
    name: string
    logo_url?: string
  }
  location?: string
  salary?: {
    min?: number
    max?: number
    type?: string
  }
  description?: string
  job_type?: string
  apply_url?: string
  indeed_final_url?: string
}
