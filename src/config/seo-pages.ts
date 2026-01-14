// SEO Landing Pages Configuration

export interface JobTypePage {
  slug: string
  title: string
  metaDescription: string
  h1: string
  intro: string
  filterKeywords: string[]
}

export interface RegionalPage {
  slug: string
  title: string
  metaDescription: string
  h1: string
  intro: string
  locationKeywords: string[]
}

export const jobTypePages: Record<string, JobTypePage> = {
  'ui-ux-design': {
    slug: 'ui-ux-design',
    title: 'Remote UI/UX Design Jobs',
    metaDescription: 'Find the best remote UI/UX design jobs. Browse user interface and user experience designer positions from top companies hiring remotely.',
    h1: 'Remote UI/UX Design Jobs',
    intro: 'Discover remote opportunities in user interface and user experience design. From wireframing to prototyping, find your next UI/UX role at companies that value great design.',
    filterKeywords: ['ui', 'ux', 'user interface', 'user experience', 'ui/ux', 'uiux'],
  },
  'product-design': {
    slug: 'product-design',
    title: 'Remote Product Design Jobs',
    metaDescription: 'Browse remote product design jobs from leading tech companies. Find product designer roles that let you shape digital products from anywhere.',
    h1: 'Remote Product Design Jobs',
    intro: 'Join product teams shaping the future of digital experiences. These remote product design roles offer the opportunity to own end-to-end design at innovative companies.',
    filterKeywords: ['product design', 'product designer'],
  },
  'graphic-design': {
    slug: 'graphic-design',
    title: 'Remote Graphic Design Jobs',
    metaDescription: 'Explore remote graphic design jobs and freelance opportunities. Find positions in brand design, marketing materials, and visual communications.',
    h1: 'Remote Graphic Design Jobs',
    intro: 'Create stunning visuals from anywhere in the world. These remote graphic design positions span brand identity, marketing collateral, social media, and more.',
    filterKeywords: ['graphic design', 'graphic designer', 'graphics'],
  },
  'motion-design': {
    slug: 'motion-design',
    title: 'Remote Motion Design Jobs',
    metaDescription: 'Find remote motion design and animation jobs. Browse positions for motion graphics designers, animators, and video editors at top companies.',
    h1: 'Remote Motion Design Jobs',
    intro: 'Bring designs to life with motion. These remote animation and motion graphics roles let you create engaging content for brands, products, and entertainment.',
    filterKeywords: ['motion', 'animation', 'animator', 'motion graphics', 'video'],
  },
  'brand-design': {
    slug: 'brand-design',
    title: 'Remote Brand Design Jobs',
    metaDescription: 'Discover remote brand design and identity jobs. Find positions creating logos, brand systems, and visual identities for innovative companies.',
    h1: 'Remote Brand Design Jobs',
    intro: 'Shape how companies present themselves to the world. These remote brand design roles focus on identity systems, visual language, and brand experiences.',
    filterKeywords: ['brand', 'branding', 'identity', 'brand designer', 'brand design'],
  },
  'web-design': {
    slug: 'web-design',
    title: 'Remote Web Design Jobs',
    metaDescription: 'Browse remote web design jobs and website designer positions. Find roles creating beautiful, functional websites for companies worldwide.',
    h1: 'Remote Web Design Jobs',
    intro: 'Design the web from anywhere. These remote web design positions cover everything from landing pages to complex web applications.',
    filterKeywords: ['web design', 'website', 'web designer', 'webflow', 'wordpress'],
  },
  'interaction-design': {
    slug: 'interaction-design',
    title: 'Remote Interaction Design Jobs',
    metaDescription: 'Find remote interaction design jobs focused on user flows, micro-interactions, and interface behavior. Join teams creating intuitive digital experiences.',
    h1: 'Remote Interaction Design Jobs',
    intro: 'Craft how users interact with digital products. These remote interaction design roles focus on behavior, animation, and the details that make interfaces feel alive.',
    filterKeywords: ['interaction design', 'ixd', 'interaction designer'],
  },
  'visual-design': {
    slug: 'visual-design',
    title: 'Remote Visual Design Jobs',
    metaDescription: 'Explore remote visual design jobs combining aesthetics and usability. Find positions crafting beautiful interfaces at design-forward companies.',
    h1: 'Remote Visual Design Jobs',
    intro: 'Create visually stunning digital experiences. These remote visual design positions focus on the aesthetic layer of products, from typography to color and layout.',
    filterKeywords: ['visual design', 'visual designer'],
  },
}

export const regionalPages: Record<string, RegionalPage> = {
  'usa': {
    slug: 'usa',
    title: 'Remote Design Jobs in USA',
    metaDescription: 'Find remote design jobs from US-based companies. Browse UI/UX, product, and graphic design positions at American startups and enterprises.',
    h1: 'Remote Design Jobs in USA',
    intro: 'Work remotely for US-based companies offering competitive salaries and benefits. These positions are open to designers across America and often worldwide.',
    locationKeywords: ['usa', 'united states', 'us', 'america', 'american'],
  },
  'europe': {
    slug: 'europe',
    title: 'Remote Design Jobs in Europe',
    metaDescription: 'Browse remote design jobs from European companies. Find UI/UX and product design positions at companies across the EU and UK.',
    h1: 'Remote Design Jobs in Europe',
    intro: 'Join European companies embracing remote work. These design positions offer opportunities across the EU, with many open to global candidates.',
    locationKeywords: ['europe', 'eu', 'european', 'germany', 'france', 'netherlands', 'spain', 'italy', 'sweden', 'denmark', 'portugal', 'ireland', 'austria', 'belgium'],
  },
  'asia': {
    slug: 'asia',
    title: 'Remote Design Jobs in Asia',
    metaDescription: 'Discover remote design jobs from Asian companies. Find positions at tech companies in Singapore, Japan, India, and across the Asia-Pacific region.',
    h1: 'Remote Design Jobs in Asia',
    intro: 'Connect with innovative companies across Asia-Pacific. These remote design roles offer exciting opportunities in fast-growing markets.',
    locationKeywords: ['asia', 'singapore', 'japan', 'india', 'china', 'korea', 'hong kong', 'taiwan', 'vietnam', 'indonesia', 'malaysia', 'philippines', 'thailand', 'apac'],
  },
  'uk': {
    slug: 'uk',
    title: 'Remote Design Jobs in UK',
    metaDescription: 'Find remote design jobs from UK companies. Browse positions at London startups, agencies, and enterprises hiring designers remotely.',
    h1: 'Remote Design Jobs in UK',
    intro: 'Work with innovative British companies from anywhere. These UK-based remote design roles offer competitive packages and flexible working.',
    locationKeywords: ['uk', 'united kingdom', 'london', 'manchester', 'birmingham', 'edinburgh', 'britain', 'british', 'england', 'scotland', 'wales'],
  },
  'canada': {
    slug: 'canada',
    title: 'Remote Design Jobs in Canada',
    metaDescription: 'Browse remote design jobs from Canadian companies. Find UI/UX and product design positions at Toronto, Vancouver, and Montreal-based startups.',
    h1: 'Remote Design Jobs in Canada',
    intro: 'Join Canadian companies building world-class products. These remote design positions offer great work-life balance and competitive compensation.',
    locationKeywords: ['canada', 'canadian', 'toronto', 'vancouver', 'montreal', 'ottawa', 'calgary'],
  },
  'latam': {
    slug: 'latam',
    title: 'Remote Design Jobs in Latin America',
    metaDescription: 'Find remote design jobs for Latin American designers. Browse positions at companies hiring from Brazil, Mexico, Argentina, and across LATAM.',
    h1: 'Remote Design Jobs in Latin America',
    intro: 'Connect with companies actively hiring designers from Latin America. These remote positions often offer timezone-friendly schedules for LATAM-based talent.',
    locationKeywords: ['latin america', 'latam', 'brazil', 'mexico', 'argentina', 'colombia', 'chile', 'peru', 'south america', 'central america'],
  },
  'australia': {
    slug: 'australia',
    title: 'Remote Design Jobs in Australia',
    metaDescription: 'Discover remote design jobs from Australian companies. Find positions at Sydney, Melbourne, and Brisbane-based startups and agencies.',
    h1: 'Remote Design Jobs in Australia',
    intro: 'Work with Australian companies embracing remote-first culture. These design positions offer great opportunities in the APAC region.',
    locationKeywords: ['australia', 'australian', 'sydney', 'melbourne', 'brisbane', 'perth', 'adelaide', 'anz', 'oceania'],
  },
  'middle-east': {
    slug: 'middle-east',
    title: 'Remote Design Jobs in Middle East',
    metaDescription: 'Browse remote design jobs from Middle Eastern companies. Find positions at Dubai, UAE, and regional tech companies hiring designers.',
    h1: 'Remote Design Jobs in Middle East',
    intro: 'Join the growing tech ecosystem in the Middle East. These remote design positions offer opportunities at innovative regional companies.',
    locationKeywords: ['middle east', 'dubai', 'uae', 'saudi arabia', 'qatar', 'israel', 'bahrain', 'kuwait', 'mena'],
  },
  'africa': {
    slug: 'africa',
    title: 'Remote Design Jobs in Africa',
    metaDescription: 'Find remote design jobs from African companies and those hiring in Africa. Browse positions at South African, Nigerian, and pan-African tech startups.',
    h1: 'Remote Design Jobs in Africa',
    intro: 'Be part of the African tech renaissance. These remote design positions connect you with companies building for the continent and beyond.',
    locationKeywords: ['africa', 'african', 'south africa', 'nigeria', 'kenya', 'egypt', 'ghana', 'rwanda', 'morocco'],
  },
  'worldwide': {
    slug: 'worldwide',
    title: 'Worldwide Remote Design Jobs',
    metaDescription: 'Browse fully remote design jobs open to candidates worldwide. Find global positions with no location restrictions at distributed companies.',
    h1: 'Worldwide Remote Design Jobs',
    intro: 'Work from anywhere in the world. These fully distributed companies hire designers regardless of location, offering true location independence.',
    locationKeywords: ['worldwide', 'anywhere', 'global', 'remote', 'international', 'distributed', 'location independent'],
  },
}

// Helper to get all slugs for static generation
export const jobTypeSlugs = Object.keys(jobTypePages)
export const regionalSlugs = Object.keys(regionalPages)
