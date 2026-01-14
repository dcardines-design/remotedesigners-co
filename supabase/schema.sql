-- DesignJobs Remote - Supabase Database Schema
-- Run this in your Supabase SQL Editor to set up the database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Companies table
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  logo_url TEXT,
  website VARCHAR(255),
  description TEXT,
  size VARCHAR(50), -- e.g., '1-10', '11-50', '51-200', '201-500', '500+'
  industry VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Jobs table
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  location VARCHAR(255) NOT NULL DEFAULT 'Remote',
  salary_min INTEGER,
  salary_max INTEGER,
  salary_currency VARCHAR(3) DEFAULT 'USD',
  description TEXT NOT NULL,
  requirements TEXT[] DEFAULT '{}',
  benefits TEXT[] DEFAULT '{}',
  job_type VARCHAR(50) NOT NULL DEFAULT 'full-time', -- full-time, part-time, contract, freelance
  experience_level VARCHAR(50) NOT NULL DEFAULT 'mid', -- entry, mid, senior, lead, executive
  skills TEXT[] DEFAULT '{}',
  apply_url TEXT,
  is_featured BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Users table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  avatar_url TEXT,
  headline VARCHAR(255), -- e.g., "Senior Product Designer"
  location VARCHAR(255),
  portfolio_url TEXT,
  linkedin_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Resumes table
CREATE TABLE resumes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL DEFAULT 'My Resume',
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  location VARCHAR(255),
  summary TEXT,
  skills TEXT[] DEFAULT '{}',
  portfolio_url TEXT,
  linkedin_url TEXT,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Resume Experience table
CREATE TABLE resume_experiences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  resume_id UUID REFERENCES resumes(id) ON DELETE CASCADE,
  company VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  location VARCHAR(255),
  start_date DATE NOT NULL,
  end_date DATE,
  is_current BOOLEAN DEFAULT FALSE,
  description TEXT,
  highlights TEXT[] DEFAULT '{}',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Resume Education table
CREATE TABLE resume_education (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  resume_id UUID REFERENCES resumes(id) ON DELETE CASCADE,
  institution VARCHAR(255) NOT NULL,
  degree VARCHAR(255) NOT NULL,
  field_of_study VARCHAR(255),
  start_date DATE,
  end_date DATE,
  is_current BOOLEAN DEFAULT FALSE,
  gpa VARCHAR(10),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cover Letters table
CREATE TABLE cover_letters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL DEFAULT 'Cover Letter',
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Applications table
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  resume_id UUID REFERENCES resumes(id) ON DELETE SET NULL,
  cover_letter_id UUID REFERENCES cover_letters(id) ON DELETE SET NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'draft', -- draft, applied, interviewing, offered, rejected, withdrawn
  notes TEXT,
  applied_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, job_id)
);

-- Saved Jobs table
CREATE TABLE saved_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, job_id)
);

-- Indexes for better query performance
CREATE INDEX idx_jobs_company_id ON jobs(company_id);
CREATE INDEX idx_jobs_created_at ON jobs(created_at DESC);
CREATE INDEX idx_jobs_is_active ON jobs(is_active);
CREATE INDEX idx_jobs_experience_level ON jobs(experience_level);
CREATE INDEX idx_resumes_user_id ON resumes(user_id);
CREATE INDEX idx_applications_user_id ON applications(user_id);
CREATE INDEX idx_applications_job_id ON applications(job_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_saved_jobs_user_id ON saved_jobs(user_id);

-- Row Level Security (RLS) Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE resume_experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE resume_education ENABLE ROW LEVEL SECURITY;
ALTER TABLE cover_letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_jobs ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can only view/edit their own profile
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Resumes: Users can only access their own resumes
CREATE POLICY "Users can view own resumes" ON resumes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own resumes" ON resumes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own resumes" ON resumes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own resumes" ON resumes FOR DELETE USING (auth.uid() = user_id);

-- Resume Experiences: Access through resume ownership
CREATE POLICY "Users can manage own resume experiences" ON resume_experiences
  FOR ALL USING (
    resume_id IN (SELECT id FROM resumes WHERE user_id = auth.uid())
  );

-- Resume Education: Access through resume ownership
CREATE POLICY "Users can manage own resume education" ON resume_education
  FOR ALL USING (
    resume_id IN (SELECT id FROM resumes WHERE user_id = auth.uid())
  );

-- Cover Letters: Users can only access their own
CREATE POLICY "Users can manage own cover letters" ON cover_letters
  FOR ALL USING (auth.uid() = user_id);

-- Applications: Users can only access their own
CREATE POLICY "Users can manage own applications" ON applications
  FOR ALL USING (auth.uid() = user_id);

-- Saved Jobs: Users can only access their own
CREATE POLICY "Users can manage own saved jobs" ON saved_jobs
  FOR ALL USING (auth.uid() = user_id);

-- Jobs: Anyone can view active jobs
CREATE POLICY "Anyone can view active jobs" ON jobs FOR SELECT USING (is_active = true);

-- Companies: Anyone can view companies
CREATE POLICY "Anyone can view companies" ON companies FOR SELECT USING (true);

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Sample data for testing (optional)
INSERT INTO companies (name, logo_url, website, description, size, industry) VALUES
  ('Figma', 'https://logo.clearbit.com/figma.com', 'https://figma.com', 'Collaborative design tool', '201-500', 'Design Tools'),
  ('Webflow', 'https://logo.clearbit.com/webflow.com', 'https://webflow.com', 'Visual web development platform', '201-500', 'Web Development'),
  ('Notion', 'https://logo.clearbit.com/notion.so', 'https://notion.so', 'All-in-one workspace', '201-500', 'Productivity'),
  ('Framer', 'https://logo.clearbit.com/framer.com', 'https://framer.com', 'Interactive design tool', '51-200', 'Design Tools'),
  ('Linear', 'https://logo.clearbit.com/linear.app', 'https://linear.app', 'Issue tracking for modern teams', '11-50', 'Developer Tools');

INSERT INTO jobs (company_id, title, location, salary_min, salary_max, description, requirements, benefits, job_type, experience_level, skills, is_featured) VALUES
  ((SELECT id FROM companies WHERE name = 'Figma'), 'Senior Product Designer', 'Remote (US)', 150000, 200000,
   'Join Figma to shape the future of collaborative design. You will work on core product features used by millions of designers worldwide.',
   ARRAY['5+ years of product design experience', 'Strong portfolio demonstrating end-to-end design process', 'Experience with design systems', 'Excellent communication skills'],
   ARRAY['Competitive salary', 'Equity', 'Health insurance', 'Unlimited PTO', 'Remote-first'],
   'full-time', 'senior', ARRAY['Figma', 'Product Design', 'Design Systems', 'Prototyping', 'User Research'], true),

  ((SELECT id FROM companies WHERE name = 'Webflow'), 'UI/UX Designer', 'Remote (Global)', 90000, 130000,
   'Help us make web development more accessible. Design intuitive interfaces for our visual development platform.',
   ARRAY['3+ years of UI/UX design experience', 'Experience with responsive web design', 'Understanding of HTML/CSS', 'Portfolio required'],
   ARRAY['Competitive compensation', 'Stock options', 'Health benefits', 'Learning budget'],
   'full-time', 'mid', ARRAY['UI Design', 'UX Design', 'Figma', 'Web Design', 'Responsive Design'], false),

  ((SELECT id FROM companies WHERE name = 'Notion'), 'Brand Designer', 'Remote (US/EU)', 120000, 160000,
   'Shape the visual identity of Notion. Create compelling brand experiences across all touchpoints.',
   ARRAY['4+ years of brand design experience', 'Strong typography and illustration skills', 'Experience with motion design is a plus', 'Agency or in-house brand experience'],
   ARRAY['Top-tier compensation', 'Equity', 'Full benefits', 'Home office stipend'],
   'full-time', 'senior', ARRAY['Brand Design', 'Typography', 'Illustration', 'Motion Design', 'Adobe Creative Suite'], true),

  ((SELECT id FROM companies WHERE name = 'Framer'), 'Motion Designer', 'Remote (EU)', 80000, 120000,
   'Bring our product and brand to life through animation. Create engaging motion design for product, marketing, and social.',
   ARRAY['3+ years of motion design experience', 'Proficiency in After Effects', 'Understanding of UI animation principles', 'Strong portfolio'],
   ARRAY['Competitive salary', 'Stock options', 'Flexible hours', 'Conference budget'],
   'full-time', 'mid', ARRAY['Motion Design', 'After Effects', 'Cinema 4D', 'Lottie', 'UI Animation'], false),

  ((SELECT id FROM companies WHERE name = 'Linear'), 'Product Designer', 'Remote (US/EU)', 130000, 170000,
   'Design the future of project management. Work on a product loved by the best software teams.',
   ARRAY['4+ years of product design experience', 'Experience designing developer tools', 'Systems thinking', 'Strong visual design skills'],
   ARRAY['Competitive package', 'Significant equity', 'Premium health insurance', 'Unlimited PTO'],
   'full-time', 'senior', ARRAY['Product Design', 'Developer Tools', 'Design Systems', 'Figma', 'Prototyping'], true);

-- =====================================================
-- AI Auto-Apply Feature Schema Extensions
-- =====================================================

-- Enum for auto-apply session status
CREATE TYPE auto_apply_status AS ENUM (
  'pending',      -- Waiting to start
  'navigating',   -- Navigating to apply page
  'detecting',    -- Detecting ATS type
  'filling',      -- Filling form fields
  'uploading',    -- Uploading resume/cover letter
  'submitting',   -- Submitting application
  'completed',    -- Successfully submitted
  'failed',       -- Failed with error
  'captcha',      -- Waiting for manual CAPTCHA
  'manual'        -- Requires manual intervention
);

-- Auto-apply sessions table
CREATE TABLE auto_apply_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,

  -- Job info (for external jobs not in our DB)
  external_job_id VARCHAR(255),
  job_title VARCHAR(255) NOT NULL,
  company_name VARCHAR(255) NOT NULL,
  apply_url TEXT NOT NULL,

  -- Session status
  status auto_apply_status NOT NULL DEFAULT 'pending',
  current_step VARCHAR(100),
  progress INTEGER DEFAULT 0, -- 0-100

  -- ATS detection
  ats_detected VARCHAR(50), -- greenhouse, lever, workday, etc.
  ats_confidence FLOAT,

  -- Form handling
  fields_total INTEGER DEFAULT 0,
  fields_filled INTEGER DEFAULT 0,
  custom_questions JSONB DEFAULT '[]',

  -- Documents used
  resume_id UUID REFERENCES resumes(id) ON DELETE SET NULL,
  cover_letter_content TEXT,
  resume_pdf_url TEXT,
  cover_letter_pdf_url TEXT,

  -- Debugging/logging
  screenshots JSONB DEFAULT '[]', -- Array of screenshot URLs
  action_log JSONB DEFAULT '[]',  -- Array of {timestamp, action, result}
  error_message TEXT,
  error_stack TEXT,

  -- Timestamps
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add auto-apply fields to applications table
ALTER TABLE applications ADD COLUMN IF NOT EXISTS auto_apply_session_id UUID REFERENCES auto_apply_sessions(id) ON DELETE SET NULL;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS is_auto_applied BOOLEAN DEFAULT FALSE;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS auto_apply_status auto_apply_status;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS confirmation_screenshot TEXT;

-- Indexes for auto-apply sessions
CREATE INDEX idx_auto_apply_sessions_user_id ON auto_apply_sessions(user_id);
CREATE INDEX idx_auto_apply_sessions_status ON auto_apply_sessions(status);
CREATE INDEX idx_auto_apply_sessions_created_at ON auto_apply_sessions(created_at DESC);

-- RLS for auto-apply sessions
ALTER TABLE auto_apply_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own auto-apply sessions" ON auto_apply_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own auto-apply sessions" ON auto_apply_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own auto-apply sessions" ON auto_apply_sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- Function to update auto_apply_sessions updated_at
CREATE OR REPLACE FUNCTION update_auto_apply_session_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_auto_apply_sessions_timestamp
  BEFORE UPDATE ON auto_apply_sessions
  FOR EACH ROW EXECUTE FUNCTION update_auto_apply_session_timestamp();

-- =====================================================
-- Newsletter Subscribers
-- =====================================================

CREATE TABLE subscribers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT TRUE,
  frequency VARCHAR(20) DEFAULT 'daily', -- daily, weekly
  preferences JSONB DEFAULT '{}', -- job type preferences, skills, etc.
  last_email_sent_at TIMESTAMP WITH TIME ZONE,
  unsubscribe_token UUID DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_subscribers_email ON subscribers(email);
CREATE INDEX idx_subscribers_is_active ON subscribers(is_active);
CREATE INDEX idx_subscribers_frequency ON subscribers(frequency);

-- Allow public to subscribe (no auth required)
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can subscribe" ON subscribers FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can view by unsubscribe token" ON subscribers FOR SELECT USING (true);
CREATE POLICY "Anyone can unsubscribe" ON subscribers FOR UPDATE USING (true);
