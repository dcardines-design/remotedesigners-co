-- RemoteDesigners.co - Simplified Schema for Job Aggregation
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Jobs table (supports both internal and external jobs)
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Job details
  title VARCHAR(255) NOT NULL,
  company VARCHAR(255) NOT NULL,
  company_logo TEXT,
  location VARCHAR(255) NOT NULL DEFAULT 'Remote',

  -- Salary
  salary_min INTEGER,
  salary_max INTEGER,
  salary_text VARCHAR(100),

  -- Description
  description TEXT,
  job_type VARCHAR(50) DEFAULT 'full-time',
  experience_level VARCHAR(50),
  skills TEXT[] DEFAULT '{}',

  -- Application
  apply_url TEXT NOT NULL,

  -- Source tracking (for external jobs)
  source VARCHAR(50) DEFAULT 'internal', -- internal, remotive, remoteok, dribbble, etc.
  external_id VARCHAR(255), -- ID from external source to prevent duplicates

  -- Status
  is_featured BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,

  -- Timestamps
  posted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,

  -- Unique constraint to prevent duplicate external jobs
  UNIQUE(source, external_id)
);

-- Indexes
CREATE INDEX idx_jobs_source ON jobs(source);
CREATE INDEX idx_jobs_posted_at ON jobs(posted_at DESC);
CREATE INDEX idx_jobs_is_active ON jobs(is_active);
CREATE INDEX idx_jobs_company ON jobs(company);

-- Anyone can read active jobs (no auth required)
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active jobs" ON jobs FOR SELECT USING (is_active = true);

-- Allow service role to insert/update (for job sync)
CREATE POLICY "Service role can manage jobs" ON jobs FOR ALL USING (true) WITH CHECK (true);
