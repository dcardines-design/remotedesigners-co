// Job filtering constants

// Top 100 design keywords - used to identify legitimate design jobs
export const DESIGN_KEYWORDS = [
  // Job Titles
  'designer', 'design', 'ux', 'ui', 'ui/ux', 'ux/ui', 'product designer',
  'graphic designer', 'visual designer', 'brand designer', 'web designer',
  'interaction designer', 'experience designer', 'creative director',
  'art director', 'design director', 'design lead', 'design manager',
  'motion designer', 'motion graphics', 'animator', 'illustrator',
  'icon designer', 'layout designer', 'print designer', 'packaging designer',
  'environmental designer', 'exhibition designer', 'signage designer',
  'presentation designer', 'email designer', 'marketing designer',
  'digital designer', 'multimedia designer', 'communication designer',

  // Design Specializations
  'user experience', 'user interface', 'human centered', 'human-centered',
  'service design', 'design thinking', 'design systems', 'design ops',
  'designops', 'design operations', 'content design', 'conversational design',
  'game designer', 'level designer', 'character designer', 'concept artist',
  'storyboard artist', 'visual development', 'texture artist',

  // Tools & Software
  'figma', 'sketch', 'adobe xd', 'invision', 'framer', 'principle',
  'origami', 'protopie', 'axure', 'balsamiq', 'marvel', 'zeplin',
  'photoshop', 'illustrator', 'indesign', 'after effects', 'premiere',
  'lightroom', 'xd', 'creative cloud', 'creative suite',
  'cinema 4d', 'blender', 'maya', '3ds max', 'zbrush',
  'procreate', 'affinity', 'canva', 'webflow', 'readymag',

  // Design Skills & Methods
  'wireframe', 'wireframing', 'prototype', 'prototyping', 'mockup',
  'user research', 'usability', 'usability testing', 'a/b testing',
  'user testing', 'heuristic', 'accessibility', 'wcag', 'ada compliant',
  'information architecture', 'ia', 'sitemap', 'user flow', 'user journey',
  'persona', 'empathy map', 'card sorting', 'tree testing',
  'typography', 'typographic', 'color theory', 'visual hierarchy',
  'gestalt', 'grid system', 'responsive design', 'mobile first',
  'atomic design', 'component library', 'style guide', 'brand guidelines',
  'moodboard', 'mood board', 'storyboard', 'artboard',

  // Design Outputs
  'branding', 'brand identity', 'logo', 'logotype', 'wordmark',
  'icon', 'iconography', 'illustration', 'infographic', 'data viz',
  'data visualization', 'dashboard design', 'app design', 'web design',
  'landing page', 'marketing collateral', 'social media design',
  'banner', 'advertisement', 'ad design', 'campaign design',
  'packaging', 'label design', 'book design', 'editorial design',
  'publication design', 'poster', 'flyer', 'brochure'
]

// Engineering/non-design keywords to exclude
export const EXCLUDE_KEYWORDS = [
  // Engineering roles
  'software engineer', 'backend engineer', 'frontend engineer', 'full stack engineer',
  'fullstack engineer', 'devops engineer', 'sre', 'site reliability',
  'platform engineer', 'infrastructure engineer', 'data engineer',
  'machine learning engineer', 'ml engineer', 'ai engineer',
  'security engineer', 'network engineer', 'systems engineer',
  'qa engineer', 'test engineer', 'automation engineer',
  'embedded engineer', 'firmware engineer', 'hardware engineer',
  'cloud engineer', 'solutions engineer', 'sales engineer',

  // Developer roles
  'software developer', 'web developer', 'mobile developer',
  'ios developer', 'android developer', 'react developer',
  'node developer', 'python developer', 'java developer',
  'ruby developer', 'php developer', 'golang developer',
  '.net developer', 'c++ developer', 'rust developer',

  // Other technical roles
  'data scientist', 'data analyst', 'business analyst',
  'product manager', 'project manager', 'program manager',
  'scrum master', 'agile coach', 'technical writer',
  'system administrator', 'database administrator', 'dba',
  'architect', 'solutions architect', 'technical architect',

  // Operations & Support
  'customer support', 'customer success', 'account manager',
  'sales representative', 'business development', 'recruiter',
  'hr manager', 'people operations', 'office manager',
  'finance', 'accountant', 'bookkeeper', 'controller',
  'legal', 'paralegal', 'compliance', 'attorney',

  // Marketing (non-design)
  'seo specialist', 'sem specialist', 'ppc specialist',
  'growth hacker', 'performance marketing', 'email marketing',
  'content writer', 'copywriter', 'content strategist',
  'social media manager', 'community manager',

  // Specific exclusions
  'accelerator', 'manager api', 'api development',
  'reliability', 'instructor', 'teacher', 'professor',
  'researcher', 'scientist', 'analyst',

  // More exclusions
  'ai developer', 'growth marketer', 'content manager',
  'content specialist', 'social media specialist', 'cloud expert',
  'cloud-experte', 'aws', 'azure', 'gcp', 'kubernetes',
  'data ops', 'dataops', 'mlops', 'technical lead',
  'tech lead', 'engineering manager', 'cto', 'cio',
  'vp engineering', 'head of engineering', 'director of engineering',
  'marketing manager', 'marketing director', 'head of marketing',
  'operations manager', 'operations director', 'coo',
  'chief', 'officer', 'president', 'founder', 'co-founder',
  'consultant', 'advisor', 'strategist', 'coordinator',
  'assistant', 'intern', 'trainee', 'apprentice',
  'mentor', 'coach', 'trainer'
]

// Specific patterns that strongly indicate design roles
export const DESIGN_TITLE_PATTERNS = [
  /\bdesigner\b/i,
  /\bux\b/i,
  /\bui\b/i,
  /\bux\/ui\b/i,
  /\bui\/ux\b/i,
  /\bart director\b/i,
  /\bcreative director\b/i,
  /\bdesign lead\b/i,
  /\bdesign manager\b/i,
  /\bhead of design\b/i,
  /\bvp design\b/i,
  /\billustrator\b/i,
  /\banimator\b/i,
  /\bmotion\s*(designer|graphics)\b/i,
  /\bbrand\s*(designer|design)\b/i,
  /\bvisual\s*(designer|design)\b/i,
  /\bgraphic\s*(designer|design)\b/i,
  /\bproduct\s*designer\b/i,
  /\bweb\s*designer\b/i,
  /\binteraction\s*designer\b/i,
  /\bexperience\s*designer\b/i,
]

// Core design job titles
export const CORE_DESIGN_TITLES = [
  'designer', 'design lead', 'design manager', 'design director',
  'head of design', 'vp of design', 'creative director', 'art director',
  'illustrator', 'animator', 'motion graphics'
]

// Skills to filter out (generic terms)
export const EXCLUDED_SKILL_TERMS = [
  'designer', 'design', 'digital nomad', 'lead', 'senior', 'junior',
  'entry', 'mid', 'technical', 'remote', 'hybrid', 'onsite', 'full-time',
  'part-time', 'contract', 'freelance', 'manager', 'director', 'intern',
  'system', 'mobile', 'marketing', 'content', 'engineering'
]

// Design skill patterns for extraction
export const SKILL_PATTERNS = [
  'Figma', 'Sketch', 'Adobe XD', 'Photoshop', 'Illustrator', 'After Effects',
  'InVision', 'Framer', 'Principle', 'Webflow', 'HTML', 'CSS', 'JavaScript',
  'React', 'Vue', 'Design Systems', 'Prototyping', 'User Research',
  'Wireframing', 'UI Design', 'UX Design', 'Visual Design', 'Brand Design',
  'Motion Design', 'Interaction Design', 'Typography', 'Accessibility'
]
