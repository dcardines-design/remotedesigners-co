// SEO Landing Pages Configuration

export interface FAQ {
  question: string
  answer: string
}

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

export const combinationPages: Record<string, CombinationPage> = {
  'product-design-usa': {
    jobTypeSlug: 'product-design',
    regionSlug: 'usa',
    slug: 'product-design-usa',
    title: 'Remote Product Design Jobs in USA',
    metaDescription: 'Find remote product design jobs at US-based companies. Browse product designer positions at American startups and tech companies hiring remotely.',
    h1: 'Remote Product Design Jobs in USA',
    intro: 'Join top US companies as a remote product designer. These positions combine competitive American salaries with the flexibility of remote work.',
    faqs: [
      { question: 'What is the average salary for remote product designers in the US?', answer: 'Remote product designers at US companies typically earn $100,000-$180,000+ annually, with top tech companies offering even higher compensation.' },
      { question: 'Do US product design jobs require US residency?', answer: 'Some positions require US work authorization, while others are open to global candidates. Check each job listing for specific requirements.' },
      { question: 'What timezone overlap is expected?', answer: 'Most US companies prefer 4+ hours overlap with US timezones (PT to ET). Some fully distributed teams are async-friendly.' },
    ],
  },
  'ui-ux-design-uk': {
    jobTypeSlug: 'ui-ux-design',
    regionSlug: 'uk',
    slug: 'ui-ux-design-uk',
    title: 'Remote UI/UX Design Jobs in UK',
    metaDescription: 'Browse remote UI/UX design jobs from UK companies. Find user interface and user experience designer positions at British startups and agencies.',
    h1: 'Remote UI/UX Design Jobs in UK',
    intro: 'Design for innovative British companies from anywhere. These UK-based UI/UX roles offer competitive packages and the chance to work with world-class brands.',
    faqs: [
      { question: 'What are typical UK UI/UX designer salaries?', answer: 'UK UI/UX designers earn £45,000-£85,000 typically, with London-based companies often paying 20-30% more. Senior roles can exceed £100,000.' },
      { question: 'Can non-UK residents apply for UK remote jobs?', answer: 'Many UK companies hire internationally, though some may require right-to-work in the UK. Remote-first companies are often more flexible.' },
      { question: 'What design tools are popular in UK companies?', answer: 'Figma dominates the UK design scene, with Sketch still used in some agencies. Proficiency in prototyping tools like Principle is a plus.' },
    ],
  },
  'product-design-europe': {
    jobTypeSlug: 'product-design',
    regionSlug: 'europe',
    slug: 'product-design-europe',
    title: 'Remote Product Design Jobs in Europe',
    metaDescription: 'Discover remote product design jobs at European companies. Find product designer roles at startups across Germany, France, Netherlands, and more.',
    h1: 'Remote Product Design Jobs in Europe',
    intro: 'Join the European tech scene as a remote product designer. From Berlin to Amsterdam, these companies offer great work-life balance and competitive compensation.',
    faqs: [
      { question: 'Which European countries have the most product design jobs?', answer: 'Germany, Netherlands, UK, and France lead in product design opportunities. Berlin, Amsterdam, and London are major tech hubs.' },
      { question: 'What languages are required for European product design jobs?', answer: 'English is typically sufficient for international companies. Local language skills are a bonus but rarely required for design roles.' },
      { question: 'How do European design salaries compare to US?', answer: 'European salaries are typically lower in raw numbers (€50,000-€100,000) but often come with better benefits, more vacation, and lower living costs.' },
    ],
  },
  'graphic-design-usa': {
    jobTypeSlug: 'graphic-design',
    regionSlug: 'usa',
    slug: 'graphic-design-usa',
    title: 'Remote Graphic Design Jobs in USA',
    metaDescription: 'Find remote graphic design jobs at US companies. Browse graphic designer positions in brand design, marketing, and visual communications.',
    h1: 'Remote Graphic Design Jobs in USA',
    intro: 'Create stunning visuals for American brands from anywhere. These US-based graphic design roles span agencies, startups, and enterprise companies.',
    faqs: [
      { question: 'What types of graphic design work are most in demand in the US?', answer: 'Brand identity, marketing collateral, social media graphics, and packaging design are highly sought after. Digital-first skills are increasingly important.' },
      { question: 'What is the salary range for remote graphic designers in the US?', answer: 'Remote graphic designers earn $50,000-$100,000+ depending on experience and specialization. Senior and specialized roles command higher rates.' },
      { question: 'Do US graphic design jobs require specific software skills?', answer: 'Adobe Creative Suite proficiency is essential. Figma skills are increasingly valued. Motion graphics capabilities (After Effects) are a strong differentiator.' },
    ],
  },
  'ui-ux-design-worldwide': {
    jobTypeSlug: 'ui-ux-design',
    regionSlug: 'worldwide',
    slug: 'ui-ux-design-worldwide',
    title: 'Worldwide Remote UI/UX Design Jobs',
    metaDescription: 'Browse fully remote UI/UX design jobs open worldwide. Find global positions at distributed companies with no location restrictions.',
    h1: 'Worldwide Remote UI/UX Design Jobs',
    intro: 'Work from anywhere in the world as a UI/UX designer. These fully distributed companies hire globally and embrace async-first culture.',
    faqs: [
      { question: 'What does "worldwide" mean for remote UI/UX jobs?', answer: 'Worldwide positions have no geographic restrictions - you can work from any country. These are typically at fully distributed, async-friendly companies.' },
      { question: 'How is compensation handled for worldwide remote positions?', answer: 'Varies by company: some pay US-equivalent rates globally, others adjust for local cost of living, and some use standardized global pay bands.' },
      { question: 'What challenges come with worldwide remote UI/UX work?', answer: 'Main challenges include timezone coordination for meetings, async communication skills, and potentially complex tax situations. Strong written communication is essential.' },
    ],
  },
}

export const combinationSlugs = Object.keys(combinationPages)

// Helper to get all slugs for static generation
export const jobTypeSlugs = Object.keys(jobTypePages)
export const regionalSlugs = Object.keys(regionalPages)
