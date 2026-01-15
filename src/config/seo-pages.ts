// SEO Landing Pages Configuration

export interface FAQ {
  question: string
  answer: string
}

// General FAQs that appear on all SEO pages
export const generalFAQs: FAQ[] = [
  {
    question: 'What is the difference between remotedesigners.co and other job boards?',
    answer: 'Most job boards only show paid listings from companies willing to pay to post. We aggregate jobs from hundreds of sources across the internet, including direct company career pages, giving you access to thousands more opportunities. We also accept featured job posts from companies who want extra visibility.'
  },
  {
    question: 'How often are new jobs posted?',
    answer: 'New jobs are posted hourly. We continuously scan hundreds of job sites and company career pages to ensure you have access to the freshest remote design opportunities as soon as they become available.'
  },
  {
    question: 'Can I suggest jobs to be added?',
    answer: 'Yes! We\'re always looking to expand our listings and appreciate suggestions from our community. Just send an email to dcardinesiii@gmail.com with the job details and we\'ll review it.'
  },
  {
    question: 'Who built remotedesigners.co?',
    answer: 'remotedesigners.co was built by Dante Cardines III. You can follow along with updates and connect on X (Twitter) at <a href="https://x.com/dantecardines" target="_blank" rel="noopener noreferrer" class="text-blue-600 underline hover:no-underline">@dantecardines</a>.'
  },
]

export interface JobTypePage {
  slug: string
  title: string
  metaDescription: string
  h1: string
  intro: string
  filterKeywords: string[]
  faqs: FAQ[]
}

export interface RegionalPage {
  slug: string
  title: string
  metaDescription: string
  h1: string
  intro: string
  locationKeywords: string[]
  faqs: FAQ[]
  breadcrumbName?: string // Optional: use this for breadcrumb if different from h1 extraction
}

export const jobTypePages: Record<string, JobTypePage> = {
  'ui-ux-design': {
    slug: 'ui-ux-design',
    title: 'Remote UI/UX Design Jobs',
    metaDescription: 'Find the best remote UI/UX design jobs. Browse user interface and user experience designer positions from top companies hiring remotely.',
    h1: 'Remote UI/UX Design Jobs',
    intro: 'Discover remote opportunities in user interface and user experience design. From wireframing to prototyping, find your next UI/UX role at companies that value great design.',
    filterKeywords: ['ui', 'ux', 'user interface', 'user experience', 'ui/ux', 'uiux'],
    faqs: [
      { question: 'What skills do I need for remote UI/UX design jobs?', answer: 'Key skills include proficiency in design tools like Figma or Sketch, understanding of user research methods, wireframing, prototyping, and strong communication skills for remote collaboration.' },
      { question: 'What is the average salary for remote UI/UX designers?', answer: 'Remote UI/UX designer salaries typically range from $70,000 to $150,000+ USD annually, depending on experience level, company size, and location.' },
      { question: 'Do I need a degree for UI/UX design jobs?', answer: 'While a degree can help, many companies prioritize a strong portfolio and practical skills. Bootcamps, online courses, and self-taught designers are common in the industry.' },
    ],
  },
  'product-design': {
    slug: 'product-design',
    title: 'Remote Product Design Jobs',
    metaDescription: 'Browse remote product design jobs from leading tech companies. Find product designer roles that let you shape digital products from anywhere.',
    h1: 'Remote Product Design Jobs',
    intro: 'Join product teams shaping the future of digital experiences. These remote product design roles offer the opportunity to own end-to-end design at innovative companies.',
    filterKeywords: ['product design', 'product designer'],
    faqs: [
      { question: 'What does a remote product designer do?', answer: 'Product designers own the end-to-end design process, from user research and ideation to prototyping and final UI. They collaborate with product managers and engineers to ship features.' },
      { question: 'How is product design different from UI/UX design?', answer: 'Product design encompasses the full product lifecycle, while UI/UX often focuses on specific aspects. Product designers typically have more ownership over strategy and business outcomes.' },
      { question: 'What tools do product designers use?', answer: 'Common tools include Figma for design, FigJam or Miro for collaboration, Notion for documentation, and various prototyping tools like Principle or ProtoPie.' },
    ],
  },
  'graphic-design': {
    slug: 'graphic-design',
    title: 'Remote Graphic Design Jobs',
    metaDescription: 'Explore remote graphic design jobs and freelance opportunities. Find positions in brand design, marketing materials, and visual communications.',
    h1: 'Remote Graphic Design Jobs',
    intro: 'Create stunning visuals from anywhere in the world. These remote graphic design positions span brand identity, marketing collateral, social media, and more.',
    filterKeywords: ['graphic design', 'graphic designer', 'graphics'],
    faqs: [
      { question: 'What software do remote graphic designers need?', answer: 'Essential tools include Adobe Creative Suite (Photoshop, Illustrator, InDesign), Figma for collaborative work, and potentially Canva for quick social media graphics.' },
      { question: 'Can I work as a freelance graphic designer remotely?', answer: 'Yes, graphic design is one of the most popular freelance remote careers. Many designers work with multiple clients or combine freelance work with part-time positions.' },
      { question: 'What types of projects do remote graphic designers work on?', answer: 'Projects include brand identity, marketing materials, social media graphics, packaging design, presentations, and digital advertising assets.' },
    ],
  },
  'motion-design': {
    slug: 'motion-design',
    title: 'Remote Motion Design Jobs',
    metaDescription: 'Find remote motion design and animation jobs. Browse positions for motion graphics designers, animators, and video editors at top companies.',
    h1: 'Remote Motion Design Jobs',
    intro: 'Bring designs to life with motion. These remote animation and motion graphics roles let you create engaging content for brands, products, and entertainment.',
    filterKeywords: ['motion', 'animation', 'animator', 'motion graphics', 'video'],
    faqs: [
      { question: 'What skills are needed for remote motion design jobs?', answer: 'Key skills include After Effects, Cinema 4D or Blender for 3D, understanding of animation principles, and increasingly Lottie/Rive for interactive animations.' },
      { question: 'What industries hire remote motion designers?', answer: 'Tech companies, advertising agencies, streaming platforms, gaming studios, and social media companies all hire motion designers for UI animations, ads, and content.' },
      { question: 'Do motion designers need video editing skills?', answer: 'While not always required, video editing skills in Premiere Pro or Final Cut are valuable and can open up more opportunities.' },
    ],
  },
  'brand-design': {
    slug: 'brand-design',
    title: 'Remote Brand Design Jobs',
    metaDescription: 'Discover remote brand design and identity jobs. Find positions creating logos, brand systems, and visual identities for innovative companies.',
    h1: 'Remote Brand Design Jobs',
    intro: 'Shape how companies present themselves to the world. These remote brand design roles focus on identity systems, visual language, and brand experiences.',
    filterKeywords: ['brand', 'branding', 'identity', 'brand designer', 'brand design'],
    faqs: [
      { question: 'What does a brand designer create?', answer: 'Brand designers create visual identity systems including logos, color palettes, typography guidelines, brand assets, and comprehensive brand guidelines documents.' },
      { question: 'Is brand design the same as logo design?', answer: 'Logo design is just one component. Brand design encompasses the entire visual identity system, voice and tone, and how the brand is experienced across all touchpoints.' },
      { question: 'What portfolio pieces should brand designers have?', answer: 'Strong portfolios show complete brand identity projects with strategy rationale, logo variations, brand guidelines, and real-world applications across various media.' },
    ],
  },
  'web-design': {
    slug: 'web-design',
    title: 'Remote Web Design Jobs',
    metaDescription: 'Browse remote web design jobs and website designer positions. Find roles creating beautiful, functional websites for companies worldwide.',
    h1: 'Remote Web Design Jobs',
    intro: 'Design the web from anywhere. These remote web design positions cover everything from landing pages to complex web applications.',
    filterKeywords: ['web design', 'website', 'web designer', 'webflow', 'wordpress'],
    faqs: [
      { question: 'Do web designers need to know how to code?', answer: 'Basic HTML/CSS knowledge is helpful but not always required. Many web designers use no-code tools like Webflow, Framer, or WordPress with visual builders.' },
      { question: 'What is the difference between web design and web development?', answer: 'Web designers focus on visual design, layout, and user experience, while developers handle the technical implementation. Many roles now blend both skills.' },
      { question: 'What tools do remote web designers use?', answer: 'Popular tools include Figma for design, Webflow or Framer for no-code development, and collaboration tools like Slack and Loom for remote communication.' },
    ],
  },
  'interaction-design': {
    slug: 'interaction-design',
    title: 'Remote Interaction Design Jobs',
    metaDescription: 'Find remote interaction design jobs focused on user flows, micro-interactions, and interface behavior. Join teams creating intuitive digital experiences.',
    h1: 'Remote Interaction Design Jobs',
    intro: 'Craft how users interact with digital products. These remote interaction design roles focus on behavior, animation, and the details that make interfaces feel alive.',
    filterKeywords: ['interaction design', 'ixd', 'interaction designer'],
    faqs: [
      { question: 'What is interaction design?', answer: 'Interaction design focuses on how users interact with products, including micro-interactions, animations, transitions, and the overall feel of using an interface.' },
      { question: 'How is interaction design different from UX design?', answer: 'While UX design covers the entire user experience, interaction design specifically focuses on the moment-to-moment interactions and behaviors within an interface.' },
      { question: 'What tools do interaction designers use?', answer: 'Tools include Principle, ProtoPie, Framer, and Figma for prototyping interactions, plus After Effects for more complex animations.' },
    ],
  },
  'visual-design': {
    slug: 'visual-design',
    title: 'Remote Visual Design Jobs',
    metaDescription: 'Explore remote visual design jobs combining aesthetics and usability. Find positions crafting beautiful interfaces at design-forward companies.',
    h1: 'Remote Visual Design Jobs',
    intro: 'Create visually stunning digital experiences. These remote visual design positions focus on the aesthetic layer of products, from typography to color and layout.',
    filterKeywords: ['visual design', 'visual designer'],
    faqs: [
      { question: 'What skills do visual designers need?', answer: 'Strong typography, color theory, layout composition, and an eye for aesthetics. Technical skills in Figma, Photoshop, and Illustrator are essential.' },
      { question: 'How is visual design different from graphic design?', answer: 'Visual design typically refers to digital product interfaces, while graphic design is broader and includes print. Visual designers focus on UI aesthetics specifically.' },
      { question: 'What makes a strong visual design portfolio?', answer: 'Show range in style, attention to detail in typography and spacing, and ability to create cohesive visual systems. Include both finished work and process.' },
    ],
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
    faqs: [
      { question: 'Do US companies hire international remote designers?', answer: 'Many US companies hire globally, though some positions may require US work authorization or specific timezone overlap for collaboration.' },
      { question: 'What are typical salaries for remote design jobs in the US?', answer: 'US remote design salaries range from $80,000-$180,000+ depending on role, experience, and company. San Francisco and NYC-based companies often pay the highest rates.' },
      { question: 'What timezones do US remote jobs require?', answer: 'Most US companies prefer candidates within US timezones (PT to ET) or with 4+ hours overlap. Some fully async companies have no timezone requirements.' },
    ],
  },
  'europe': {
    slug: 'europe',
    title: 'Remote Design Jobs in Europe',
    metaDescription: 'Browse remote design jobs from European companies. Find UI/UX and product design positions at companies across the EU and UK.',
    h1: 'Remote Design Jobs in Europe',
    intro: 'Join European companies embracing remote work. These design positions offer opportunities across the EU, with many open to global candidates.',
    locationKeywords: ['europe', 'eu', 'european', 'germany', 'france', 'netherlands', 'spain', 'italy', 'sweden', 'denmark', 'portugal', 'ireland', 'austria', 'belgium'],
    faqs: [
      { question: 'What are design salaries like in Europe?', answer: 'European design salaries vary by country, typically ranging from €45,000-€120,000. Western European countries and the UK generally offer higher compensation.' },
      { question: 'Do European companies hire outside the EU?', answer: 'Some do, though many prefer EU-based candidates due to easier employment arrangements. Some companies use Employer of Record services to hire globally.' },
      { question: 'What languages are required for European design jobs?', answer: 'English is typically sufficient for most international companies. Local language skills are a plus but rarely required for design roles.' },
    ],
  },
  'asia': {
    slug: 'asia',
    title: 'Remote Design Jobs in Asia',
    metaDescription: 'Discover remote design jobs from Asian companies. Find positions at tech companies in Singapore, Japan, India, and across the Asia-Pacific region.',
    h1: 'Remote Design Jobs in Asia',
    intro: 'Connect with innovative companies across Asia-Pacific. These remote design roles offer exciting opportunities in fast-growing markets.',
    locationKeywords: ['asia', 'singapore', 'japan', 'india', 'china', 'korea', 'hong kong', 'taiwan', 'vietnam', 'indonesia', 'malaysia', 'philippines', 'thailand', 'apac'],
    faqs: [
      { question: 'Which Asian countries have the most remote design jobs?', answer: 'Singapore, Japan, and India lead in remote design opportunities. The startup ecosystems in these countries actively embrace remote work.' },
      { question: 'What are typical design salaries in Asia?', answer: 'Salaries vary widely: Singapore offers $60,000-$120,000 USD, while India and Southeast Asia range from $20,000-$60,000 USD for similar roles.' },
      { question: 'Are there timezone challenges working remotely in Asia?', answer: 'Asian designers often work with US or European companies, which may require flexibility. Many companies offer async work arrangements.' },
    ],
  },
  'uk': {
    slug: 'uk',
    title: 'Remote Design Jobs in UK',
    metaDescription: 'Find remote design jobs from UK companies. Browse positions at London startups, agencies, and enterprises hiring designers remotely.',
    h1: 'Remote Design Jobs in UK',
    intro: 'Work with innovative British companies from anywhere. These UK-based remote design roles offer competitive packages and flexible working.',
    locationKeywords: ['uk', 'united kingdom', 'london', 'manchester', 'birmingham', 'edinburgh', 'britain', 'british', 'england', 'scotland', 'wales'],
    breadcrumbName: 'United Kingdom',
    faqs: [
      { question: 'What are design salaries like in the UK?', answer: 'UK design salaries typically range from £40,000-£90,000, with London roles often paying 20-30% more than other regions.' },
      { question: 'Do UK companies hire designers from outside the UK?', answer: 'Post-Brexit, some UK companies still hire EU and international designers, though visa sponsorship requirements vary by company.' },
      { question: 'What benefits do UK remote design jobs offer?', answer: 'UK positions typically include 25+ days holiday, pension contributions, and often private health insurance. Remote-first companies may offer equipment budgets.' },
    ],
  },
  'canada': {
    slug: 'canada',
    title: 'Remote Design Jobs in Canada',
    metaDescription: 'Browse remote design jobs from Canadian companies. Find UI/UX and product design positions at Toronto, Vancouver, and Montreal-based startups.',
    h1: 'Remote Design Jobs in Canada',
    intro: 'Join Canadian companies building world-class products. These remote design positions offer great work-life balance and competitive compensation.',
    locationKeywords: ['canada', 'canadian', 'toronto', 'vancouver', 'montreal', 'ottawa', 'calgary'],
    faqs: [
      { question: 'What are design salaries in Canada?', answer: 'Canadian design salaries range from CAD $70,000-$140,000, with Toronto and Vancouver typically offering the highest compensation.' },
      { question: 'Do Canadian companies hire US-based designers?', answer: 'Many Canadian companies hire from the US due to timezone alignment. Some also hire globally and use EOR services for international contractors.' },
      { question: 'What is the design job market like in Canada?', answer: 'Canada has a thriving tech scene, especially in Toronto, Vancouver, and Montreal, with many startups and established companies hiring designers.' },
    ],
  },
  'latam': {
    slug: 'latam',
    title: 'Remote Design Jobs in Latin America',
    metaDescription: 'Find remote design jobs for Latin American designers. Browse positions at companies hiring from Brazil, Mexico, Argentina, and across LATAM.',
    h1: 'Remote Design Jobs in Latin America',
    intro: 'Connect with companies actively hiring designers from Latin America. These remote positions often offer timezone-friendly schedules for LATAM-based talent.',
    locationKeywords: ['latin america', 'latam', 'brazil', 'mexico', 'argentina', 'colombia', 'chile', 'peru', 'south america', 'central america'],
    faqs: [
      { question: 'Why do US companies hire designers from Latin America?', answer: 'LATAM designers offer timezone alignment with US companies, strong design skills, and often more competitive rates, making it a popular hiring region.' },
      { question: 'What are typical salaries for LATAM-based remote designers?', answer: 'LATAM designers working for US companies typically earn $40,000-$100,000 USD, significantly higher than local market rates.' },
      { question: 'What countries have the strongest design talent in LATAM?', answer: 'Brazil, Argentina, Mexico, and Colombia have particularly strong design communities with many experienced remote designers.' },
    ],
  },
  'australia': {
    slug: 'australia',
    title: 'Remote Design Jobs in Australia',
    metaDescription: 'Discover remote design jobs from Australian companies. Find positions at Sydney, Melbourne, and Brisbane-based startups and agencies.',
    h1: 'Remote Design Jobs in Australia',
    intro: 'Work with Australian companies embracing remote-first culture. These design positions offer great opportunities in the APAC region.',
    locationKeywords: ['australia', 'australian', 'sydney', 'melbourne', 'brisbane', 'perth', 'adelaide', 'anz', 'oceania'],
    faqs: [
      { question: 'What are design salaries in Australia?', answer: 'Australian design salaries range from AUD $80,000-$160,000, with Sydney and Melbourne offering the highest compensation.' },
      { question: 'Do Australian companies hire international designers?', answer: 'Many Australian companies hire internationally, especially from nearby Asian countries and those with compatible timezones.' },
      { question: 'What is unique about the Australian design market?', answer: 'Australia has a mature design industry with strong agency culture and growing startup scene, particularly in fintech and healthcare.' },
    ],
  },
  'middle-east': {
    slug: 'middle-east',
    title: 'Remote Design Jobs in Middle East',
    metaDescription: 'Browse remote design jobs from Middle Eastern companies. Find positions at Dubai, UAE, and regional tech companies hiring designers.',
    h1: 'Remote Design Jobs in Middle East',
    intro: 'Join the growing tech ecosystem in the Middle East. These remote design positions offer opportunities at innovative regional companies.',
    locationKeywords: ['middle east', 'dubai', 'uae', 'saudi arabia', 'qatar', 'israel', 'bahrain', 'kuwait', 'mena'],
    faqs: [
      { question: 'Which Middle Eastern countries have the most design jobs?', answer: 'UAE (Dubai), Israel, and Saudi Arabia lead in design opportunities, with growing tech ecosystems and international companies.' },
      { question: 'Are Middle Eastern design salaries competitive?', answer: 'Dubai and UAE offer tax-free salaries often comparable to Western markets. Israeli tech companies offer competitive, equity-heavy packages.' },
      { question: 'Do Middle Eastern companies hire remote designers?', answer: 'Remote work is growing in the region, though many companies still prefer local or regional candidates, especially in UAE and Saudi Arabia.' },
    ],
  },
  'africa': {
    slug: 'africa',
    title: 'Remote Design Jobs in Africa',
    metaDescription: 'Find remote design jobs from African companies and those hiring in Africa. Browse positions at South African, Nigerian, and pan-African tech startups.',
    h1: 'Remote Design Jobs in Africa',
    intro: 'Be part of the African tech renaissance. These remote design positions connect you with companies building for the continent and beyond.',
    locationKeywords: ['africa', 'african', 'south africa', 'nigeria', 'kenya', 'egypt', 'ghana', 'rwanda', 'morocco'],
    faqs: [
      { question: 'Which African countries have the strongest design job markets?', answer: 'South Africa, Nigeria, Kenya, and Egypt have the most developed tech and design scenes, with growing startup ecosystems.' },
      { question: 'Do international companies hire designers based in Africa?', answer: 'Yes, many international companies hire African designers for timezone compatibility with Europe and competitive rates with strong talent.' },
      { question: 'What is the African tech design scene like?', answer: 'Africa has a booming fintech and mobile-first design scene, with designers solving unique challenges around connectivity and accessibility.' },
    ],
  },
  'worldwide': {
    slug: 'worldwide',
    title: 'Worldwide Remote Design Jobs',
    metaDescription: 'Browse fully remote design jobs open to candidates worldwide. Find global positions with no location restrictions at distributed companies.',
    h1: 'Worldwide Remote Design Jobs',
    intro: 'Work from anywhere in the world. These fully distributed companies hire designers regardless of location, offering true location independence.',
    locationKeywords: ['worldwide', 'anywhere', 'global', 'remote', 'international', 'distributed', 'location independent'],
    faqs: [
      { question: 'What does "worldwide" mean for remote jobs?', answer: 'Worldwide positions have no location restrictions—you can work from any country. These are often at fully distributed companies with async cultures.' },
      { question: 'How are worldwide remote designers paid?', answer: 'Payment methods vary: some companies pay in USD regardless of location, others adjust for local cost of living, and many use platforms like Deel or Remote.' },
      { question: 'What are the challenges of worldwide remote work?', answer: 'Main challenges include timezone coordination, isolation, and navigating tax implications. Async communication skills are essential.' },
    ],
  },
}

// Combination Pages (Job Type + Region)
export interface CombinationPage {
  jobTypeSlug: string
  regionSlug: string
  slug: string
  title: string
  metaDescription: string
  h1: string
  intro: string
  faqs: FAQ[]
}

// Helper to generate combination page content
function generateCombinationPage(jobTypeSlug: string, regionSlug: string): CombinationPage {
  const jobType = jobTypePages[jobTypeSlug]
  const region = regionalPages[regionSlug]

  const jobTypeName = jobType.h1.replace('Remote ', '').replace(' Jobs', '')
  const regionName = region.h1.replace('Remote Design Jobs in ', '').replace('Worldwide Remote Design Jobs', 'Worldwide')

  const isWorldwide = regionSlug === 'worldwide'
  const title = isWorldwide
    ? `Worldwide Remote ${jobTypeName} Jobs`
    : `Remote ${jobTypeName} Jobs in ${regionName}`

  return {
    jobTypeSlug,
    regionSlug,
    slug: `${jobTypeSlug}-${regionSlug}`,
    title,
    metaDescription: `Find remote ${jobTypeName.toLowerCase()} jobs ${isWorldwide ? 'worldwide' : `in ${regionName}`}. Browse ${jobTypeName.toLowerCase()} positions at companies hiring remotely.`,
    h1: title,
    intro: `Discover remote ${jobTypeName.toLowerCase()} opportunities ${isWorldwide ? 'from companies hiring globally' : `at ${regionName}-based companies`}. Find your next role with flexible remote work.`,
    faqs: [
      {
        question: `What ${jobTypeName.toLowerCase()} jobs are available ${isWorldwide ? 'worldwide' : `in ${regionName}`}?`,
        answer: `We list remote ${jobTypeName.toLowerCase()} positions ${isWorldwide ? 'from companies hiring globally with no location restrictions' : `at companies based in or hiring from ${regionName}`}. Roles range from junior to senior levels.`
      },
      {
        question: `What skills do I need for remote ${jobTypeName.toLowerCase()} jobs?`,
        answer: jobType.faqs[0]?.answer || `Key skills include proficiency in modern design tools, strong communication for remote collaboration, and a portfolio demonstrating your work.`
      },
      {
        question: `What is the salary range for remote ${jobTypeName.toLowerCase()} roles?`,
        answer: jobType.faqs[1]?.answer || `Salaries vary based on experience, company size, and location. Senior roles at well-funded companies offer the highest compensation.`
      },
    ],
  }
}

// Generate all combination pages
const allJobTypes = ['ui-ux-design', 'product-design', 'graphic-design', 'motion-design', 'brand-design', 'web-design', 'interaction-design', 'visual-design'] as const
const allRegions = ['usa', 'europe', 'uk', 'canada', 'asia', 'australia', 'latam', 'middle-east', 'africa', 'worldwide'] as const

export const combinationPages: Record<string, CombinationPage> = {}

for (const jobType of allJobTypes) {
  for (const region of allRegions) {
    const key = `${jobType}-${region}`
    combinationPages[key] = generateCombinationPage(jobType, region)
  }
}

export const combinationSlugs = Object.keys(combinationPages)

// Experience Level Pages
export interface ExperienceLevelPage {
  slug: string
  title: string
  metaDescription: string
  h1: string
  intro: string
  filterValue: string
  faqs: FAQ[]
}

export const experienceLevelPages: Record<string, ExperienceLevelPage> = {
  'entry-level': {
    slug: 'entry-level',
    title: 'Entry Level Design Jobs - No Experience Required',
    metaDescription: 'Find entry level design jobs perfect for recent graduates and career changers. Browse junior designer positions that welcome candidates with no professional experience.',
    h1: 'Entry Level Design Jobs',
    intro: 'Start your design career with these entry-level positions. Perfect for recent graduates, bootcamp grads, and career changers looking to break into the design industry.',
    filterValue: 'entry',
    faqs: [
      { question: 'What qualifies as an entry-level design job?', answer: 'Entry-level positions typically require 0-1 years of experience. They focus on your portfolio, potential, and willingness to learn rather than extensive work history.' },
      { question: 'Do I need a degree for entry-level design jobs?', answer: 'Not necessarily. Many companies value a strong portfolio and relevant skills over formal education. Bootcamp graduates and self-taught designers are welcomed.' },
      { question: 'What salary can I expect at entry level?', answer: 'Entry-level design salaries typically range from $45,000-$70,000 USD, depending on location and company size. Remote positions may vary based on your location.' },
    ],
  },
  'junior-designer': {
    slug: 'junior-designer',
    title: 'Junior Designer Jobs - Remote Positions',
    metaDescription: 'Browse junior designer jobs for early-career designers. Find remote positions with 1-3 years experience at companies investing in growing design talent.',
    h1: 'Junior Designer Jobs',
    intro: 'Take the next step in your design career. These junior designer positions offer mentorship, growth opportunities, and the chance to work on real products.',
    filterValue: 'junior',
    faqs: [
      { question: 'What experience do junior designer roles require?', answer: 'Junior roles typically require 1-3 years of experience or equivalent project work. A solid portfolio showing your design process is essential.' },
      { question: 'How do I grow from junior to mid-level?', answer: 'Focus on owning projects end-to-end, improving your craft, learning from senior designers, and building expertise in your area of interest.' },
      { question: 'What should a junior designer portfolio include?', answer: 'Include 3-5 case studies showing your process, decisions, and outcomes. Personal projects and redesigns are valuable if you lack professional work.' },
    ],
  },
  'mid-level-designer': {
    slug: 'mid-level-designer',
    title: 'Mid-Level Designer Jobs - Remote Opportunities',
    metaDescription: 'Find mid-level designer jobs for experienced designers. Browse remote positions requiring 3-5 years experience at growing companies.',
    h1: 'Mid-Level Designer Jobs',
    intro: 'You\'ve built your foundation—now take on more ownership. These mid-level positions offer autonomy, interesting challenges, and room to grow into leadership.',
    filterValue: 'mid',
    faqs: [
      { question: 'What is expected of mid-level designers?', answer: 'Mid-level designers work independently, own features or product areas, contribute to design systems, and may begin mentoring junior designers.' },
      { question: 'What experience do mid-level roles require?', answer: 'Typically 3-5 years of professional experience with a track record of shipping products and collaborating with cross-functional teams.' },
      { question: 'How do mid-level salaries compare?', answer: 'Mid-level designers typically earn $80,000-$120,000 USD, with higher compensation at well-funded startups and larger tech companies.' },
    ],
  },
  'senior-designer': {
    slug: 'senior-designer',
    title: 'Senior Designer Jobs - Remote Positions',
    metaDescription: 'Discover senior designer jobs at top companies. Find remote leadership positions for experienced designers with 5+ years of professional experience.',
    h1: 'Senior Designer Jobs',
    intro: 'Lead design at innovative companies. These senior positions offer the opportunity to shape product direction, mentor teams, and work on complex challenges.',
    filterValue: 'senior',
    faqs: [
      { question: 'What do senior designers do differently?', answer: 'Senior designers lead projects, set design direction, mentor others, influence product strategy, and often work across multiple product areas or teams.' },
      { question: 'What experience is needed for senior roles?', answer: 'Most senior positions require 5-8+ years of experience, though exceptional candidates with strong portfolios may qualify earlier.' },
      { question: 'What is the salary range for senior designers?', answer: 'Senior designers typically earn $120,000-$180,000+ USD, with staff and principal levels earning even higher at top companies.' },
    ],
  },
  'design-lead': {
    slug: 'design-lead',
    title: 'Design Lead Jobs - Leadership Positions',
    metaDescription: 'Find design lead jobs combining hands-on design with team leadership. Browse remote positions for senior designers ready to lead teams and projects.',
    h1: 'Design Lead Jobs',
    intro: 'Bridge the gap between individual contribution and management. Design lead roles let you guide teams while staying close to the craft.',
    filterValue: 'lead',
    faqs: [
      { question: 'What is the difference between senior designer and design lead?', answer: 'Design leads typically manage a small team or major project, set direction for others, and have more organizational influence while still doing hands-on design work.' },
      { question: 'Do design leads manage people?', answer: 'It varies—some leads focus on project leadership without direct reports, while others manage 2-5 designers. Many roles blend both IC and management responsibilities.' },
      { question: 'What skills do design leads need?', answer: 'Beyond strong design skills, leads need communication, project management, mentorship abilities, and the capacity to represent design in leadership discussions.' },
    ],
  },
  'design-director': {
    slug: 'design-director',
    title: 'Design Director Jobs - Executive Design Roles',
    metaDescription: 'Browse design director jobs at leading companies. Find executive-level remote positions shaping design vision and building world-class design teams.',
    h1: 'Design Director Jobs',
    intro: 'Shape the future of design organizations. Director-level roles focus on vision, strategy, team building, and elevating design across the company.',
    filterValue: 'director',
    faqs: [
      { question: 'What do design directors do?', answer: 'Directors set design vision, build and manage teams, represent design at the executive level, establish processes, and ensure design quality across products.' },
      { question: 'What experience do director roles require?', answer: 'Most director positions require 8-12+ years of experience including people management, with a track record of building teams and shipping successful products.' },
      { question: 'What is the salary range for design directors?', answer: 'Design directors typically earn $180,000-$300,000+ USD, often with significant equity compensation at startups and tech companies.' },
    ],
  },
}

// Employment Type Pages
export interface EmploymentTypePage {
  slug: string
  title: string
  metaDescription: string
  h1: string
  intro: string
  filterValue: string
  faqs: FAQ[]
}

export const employmentTypePages: Record<string, EmploymentTypePage> = {
  'full-time': {
    slug: 'full-time',
    title: 'Full-Time Remote Design Jobs',
    metaDescription: 'Find full-time remote design jobs with benefits and stability. Browse permanent positions at companies offering competitive packages for designers.',
    h1: 'Full-Time Remote Design Jobs',
    intro: 'Find stable, full-time positions with benefits, equity, and career growth. These permanent roles offer the security of traditional employment with remote flexibility.',
    filterValue: 'full-time',
    faqs: [
      { question: 'What benefits do full-time remote design jobs offer?', answer: 'Benefits typically include health insurance, 401k/retirement plans, paid time off, equity/stock options, equipment budgets, and professional development funds.' },
      { question: 'Are full-time remote jobs truly remote?', answer: 'Most positions listed as remote are fully remote, though some may require occasional office visits or have timezone restrictions. Check each listing for specifics.' },
      { question: 'How do salaries compare to in-office roles?', answer: 'Remote salaries are often comparable to in-office roles, though some companies adjust based on location. Many offer competitive rates regardless of where you live.' },
    ],
  },
  'part-time': {
    slug: 'part-time',
    title: 'Part-Time Remote Design Jobs',
    metaDescription: 'Discover part-time remote design jobs for flexible work schedules. Find 10-30 hour per week positions perfect for work-life balance.',
    h1: 'Part-Time Remote Design Jobs',
    intro: 'Balance work with life. These part-time design positions offer flexibility for parents, students, freelancers building their practice, or anyone seeking reduced hours.',
    filterValue: 'part-time',
    faqs: [
      { question: 'How many hours are part-time design jobs?', answer: 'Part-time positions typically range from 10-30 hours per week. Some offer fixed schedules while others provide flexibility in when you work those hours.' },
      { question: 'Do part-time design jobs offer benefits?', answer: 'Benefits vary—some part-time roles offer prorated benefits, while others are benefits-free. Contract and freelance arrangements are common for part-time work.' },
      { question: 'Can part-time roles lead to full-time?', answer: 'Many part-time positions can convert to full-time as company needs grow or as a trial period before permanent employment.' },
    ],
  },
  'contract': {
    slug: 'contract',
    title: 'Contract Design Jobs - Remote Opportunities',
    metaDescription: 'Browse contract design jobs for project-based work. Find remote contract positions lasting 3-12 months at companies needing specialized design talent.',
    h1: 'Contract Design Jobs',
    intro: 'Take on focused projects with defined timelines. Contract roles offer higher rates, diverse experience, and flexibility between engagements.',
    filterValue: 'contract',
    faqs: [
      { question: 'How long do design contracts typically last?', answer: 'Most contracts run 3-12 months, though some extend longer. Many contracts convert to full-time if there\'s mutual interest.' },
      { question: 'What are contract design rates?', answer: 'Contract rates are typically 20-40% higher than equivalent salaries to account for lack of benefits. Senior designers often charge $75-150+/hour.' },
      { question: 'Do contractors work with multiple clients?', answer: 'Most contracts are exclusive during their term, but some designers maintain multiple part-time contracts or do moonlighting with permission.' },
    ],
  },
  'freelance': {
    slug: 'freelance',
    title: 'Freelance Design Jobs - Remote Projects',
    metaDescription: 'Find freelance design jobs and remote projects. Browse opportunities for independent designers seeking client work and project-based income.',
    h1: 'Freelance Design Jobs',
    intro: 'Build your independent design practice. These freelance opportunities connect you with clients seeking talented designers for projects big and small.',
    filterValue: 'freelance',
    faqs: [
      { question: 'What is the difference between freelance and contract?', answer: 'Freelancers typically work with multiple clients on shorter projects, while contractors usually work exclusively with one company for an extended period.' },
      { question: 'How do freelance designers find clients?', answer: 'Beyond job boards, freelancers find work through referrals, portfolios, social media presence, communities, and platforms like Toptal or Contra.' },
      { question: 'What should freelance designers charge?', answer: 'Rates vary widely based on experience and specialization. Project rates or day rates are common, ranging from $500-$2000+ per day for experienced designers.' },
    ],
  },
  'internship': {
    slug: 'internship',
    title: 'Design Internships - Remote Opportunities',
    metaDescription: 'Find remote design internships at top companies. Browse paid internship opportunities for students and early-career designers.',
    h1: 'Design Internships',
    intro: 'Launch your design career with hands-on experience. These internships offer mentorship, real projects, and often lead to full-time opportunities.',
    filterValue: 'internship',
    faqs: [
      { question: 'Are remote design internships paid?', answer: 'Most legitimate design internships at tech companies are paid, often $25-50+/hour. Be cautious of unpaid internships, which may not provide valuable experience.' },
      { question: 'How long do design internships last?', answer: 'Summer internships typically run 10-12 weeks. Some companies offer fall/spring internships or extended programs lasting 6 months.' },
      { question: 'Can internships lead to full-time offers?', answer: 'Yes, many companies use internships as a pipeline for full-time hires. Strong performers often receive return offers before their internship ends.' },
    ],
  },
}

// Helper to get all slugs for static generation
export const jobTypeSlugs = Object.keys(jobTypePages)
export const regionalSlugs = Object.keys(regionalPages)
export const experienceLevelSlugs = Object.keys(experienceLevelPages)
export const employmentTypeSlugs = Object.keys(employmentTypePages)
