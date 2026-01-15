// Shared skill categories used across the application
// These match the filter labels on the homepage and post-job page

export const SKILLS_BY_CATEGORY = {
  'Product & UX': [
    'Product Design',
    'UX Design',
    'UI Design',
    'User Research',
    'Wireframing',
    'Prototyping',
    'Usability Testing',
    'Information Architecture',
  ],
  'Visual & Brand': [
    'Visual Design',
    'Brand Design',
    'Graphic Design',
    'Typography',
    'Illustration',
    'Icon Design',
    'Logo Design',
    'Art Direction',
  ],
  'Interaction & Motion': [
    'Interaction Design',
    'Motion Design',
    'Animation',
    'Micro-interactions',
    'Video Editing',
    '3D Design',
  ],
  'Tools': [
    'Figma',
    'Sketch',
    'Adobe XD',
    'Photoshop',
    'Illustrator',
    'After Effects',
    'Framer',
    'Webflow',
  ],
  'Systems & Strategy': [
    'Design Systems',
    'Design Ops',
    'Design Strategy',
    'Accessibility',
    'Responsive Design',
    'Design Tokens',
  ],
} as const

// Flat list of all skills
export const ALL_SKILLS: string[] = Object.values(SKILLS_BY_CATEGORY).flat()

// Type for skill categories
export type SkillCategory = keyof typeof SKILLS_BY_CATEGORY
