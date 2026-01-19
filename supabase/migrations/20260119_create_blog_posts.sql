-- Blog posts table for auto-generated SEO content
CREATE TABLE blog_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug VARCHAR(255) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  excerpt VARCHAR(500),
  category VARCHAR(50) NOT NULL,
  tags TEXT[] DEFAULT '{}',
  featured_image TEXT,
  featured_image_alt VARCHAR(255),  -- SEO: image alt text
  status VARCHAR(20) NOT NULL DEFAULT 'published',
  published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- SEO Fields
  meta_title VARCHAR(70),           -- Optimal: 50-60 chars
  meta_description VARCHAR(160),    -- Optimal: 150-160 chars
  focus_keyword VARCHAR(100),       -- Primary keyword to target
  secondary_keywords TEXT[],        -- Related keywords
  canonical_url TEXT,               -- For duplicate content prevention

  -- Content metrics
  reading_time_minutes INTEGER,
  word_count INTEGER,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX idx_blog_posts_published_at ON blog_posts(published_at DESC);
CREATE INDEX idx_blog_posts_category ON blog_posts(category);
CREATE INDEX idx_blog_posts_status ON blog_posts(status);

-- Enable RLS
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- Public read access for published posts
CREATE POLICY "Public can read published posts"
  ON blog_posts
  FOR SELECT
  USING (status = 'published');

-- Service role can do everything (for cron jobs)
CREATE POLICY "Service role has full access"
  ON blog_posts
  FOR ALL
  USING (auth.role() = 'service_role');

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_blog_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER blog_posts_updated_at
  BEFORE UPDATE ON blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_blog_posts_updated_at();
