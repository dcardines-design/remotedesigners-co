import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const jobs = [
  // Creative Directors
  {"id":"096233b4b457ea08","company":"Meta IQ Services, Inc.","location":"Remote","salary_min":198996,"salary_max":220543,"title":"Creative Director"},
  {"id":"59c2026eae409e38","company":"Age of Learning","location":"Remote","salary_min":180000,"salary_max":240000,"title":"Creative Director"},
  {"id":"5e79438b0f9d4929","company":"Brighton Jones","location":"Seattle, WA","salary_min":150000,"salary_max":180000,"title":"Creative Director"},
  {"id":"cd542360e1cceb8e","company":"OREG Management Company LLC","location":"Denver, CO","salary_min":160000,"salary_max":175000,"title":"Creative Director / Creative Agency"},
  {"id":"fc93df4a2bcaae4d","company":"Movement Strategy","location":"Remote","salary_min":130000,"salary_max":165000,"title":"Creative Director, Copy - Bilingual"},
  {"id":"eee49b583251bc0b","company":"OREG Management Company LLC","location":"Los Angeles, CA","salary_min":160000,"salary_max":175000,"title":"Creative Director / Creative Agency (LA)"},
  {"id":"ef8a4ee5416f824a","company":"Everlywell","location":"Remote","salary_min":null,"salary_max":null,"title":"Senior Brand Designer / Creative Director (Contract)"},
  {"id":"b154517d3f9670cc","company":"WEBTOON Entertainment","location":"Remote","salary_min":140000,"salary_max":160000,"title":"Executive Creative Director, WEBTOON Consumer Goods"},
  {"id":"50db0d88df3d4083","company":"Olympus KeyMed Group","location":"Remote","salary_min":null,"salary_max":null,"title":"Global Senior Director of Creative Services"},
  {"id":"b8b99a83b6791909","company":"World Vision USA","location":"Federal Way, WA","salary_min":123700,"salary_max":184320,"title":"Senior Director, Creative"},
  {"id":"9846ec48f3049aed","company":"FINSYNC","location":"Kennesaw, GA","salary_min":null,"salary_max":null,"title":"Senior Creative Director"},
  {"id":"dfe2933fdf77c854","company":"Inizio Evoke","location":"New York, NY","salary_min":130000,"salary_max":155000,"title":"Associate Creative Director, Copy"},
  {"id":"3ffb455d269de89e","company":"iHerb","location":"Irvine, CA","salary_min":190000,"salary_max":240000,"title":"Sr. Director - Brand, Creative & Content"},
  {"id":"503d55c4991c71fe","company":"10x Genomics","location":"Pleasanton, CA","salary_min":228300,"salary_max":308900,"title":"Director, Creative + Content Marketing"},

  // Art Directors
  {"id":"76155b7bf1530e14","company":"Runway AI","location":"Remote","salary_min":190000,"salary_max":230000,"title":"Art Director"},
  {"id":"624589882b1bda08","company":"Cella","location":"Remote","salary_min":114400,"salary_max":145600,"title":"Contract Art Director & Designer"},
  {"id":"fbb8b3433e009795","company":"Fonseca Chan + Associates","location":"New York, NY","salary_min":145600,"salary_max":176800,"title":"Art Director"},
  {"id":"e41858ff4e409c5b","company":"Evolve Media Group","location":"Remote","salary_min":100000,"salary_max":110000,"title":"Senior Art Director"},
  {"id":"48c65469bf5535ee","company":"Rush Street Interactive","location":"Remote","salary_min":120000,"salary_max":170000,"title":"Art Director"},
  {"id":"797b08f51d9738e1","company":"Twilio","location":"Remote","salary_min":96640,"salary_max":142000,"title":"Art Director"},
  {"id":"00b8bdc1d5406b08","company":"Abercrombie and Fitch Co.","location":"Columbus, OH","salary_min":90000,"salary_max":130000,"title":"Art Director, A&F NFL Collaboration (Remote)"},
  {"id":"49a2362271d22c2a","company":"Spinplay Games","location":"Remote","salary_min":null,"salary_max":null,"title":"Art Director"},
  {"id":"e2e0796591dafe46","company":"Volley Inc","location":"San Francisco, CA","salary_min":104000,"salary_max":208000,"title":"Art Director - Marketing & Brand (Contract)"},
  {"id":"cd9a798abd62aacb","company":"DMW","location":"Chesterbrook, PA","salary_min":null,"salary_max":null,"title":"Sr. Designer/Art Director (Remote)"},

  // Product Designers
  {"id":"7598d7f524cb31bc","company":"Panda Game Manufacturing","location":"Remote","salary_min":null,"salary_max":null,"title":"Product Designer"},
  {"id":"94a2c730ebfceeab","company":"Akido","location":"Los Angeles, CA","salary_min":104000,"salary_max":124800,"title":"Product Designer"},
  {"id":"61865a3f49ae9cf4","company":"Chess.com","location":"Remote","salary_min":null,"salary_max":null,"title":"Product Designer - Connect"},
  {"id":"912b4d65d1786e3f","company":"Netflix","location":"Remote","salary_min":120000,"salary_max":515000,"title":"Senior Product Designer, Games Visioning"},
  {"id":"290e9d43cde9d166","company":"Netflix","location":"Remote","salary_min":240000,"salary_max":725000,"title":"Staff Product Designer, Games Design System"},
  {"id":"f91a98f730646a7b","company":"Workiva","location":"Remote","salary_min":151000,"salary_max":242000,"title":"Sr Staff Product Designer"},
  {"id":"431298f4f8ae9ced","company":"Point Digital Finance","location":"Remote","salary_min":160000,"salary_max":220000,"title":"Lead Product Designer"},
  {"id":"cb3612cc95dd45d7","company":"RoadRunner Recycling","location":"Remote","salary_min":110000,"salary_max":130000,"title":"Senior Product Designer"},
  {"id":"a439da5656002fb7","company":"Netflix","location":"Remote","salary_min":240000,"salary_max":725000,"title":"Staff Product Designer, New Content Experiences"},
  {"id":"cc3161585d1e0487","company":"Cella","location":"Remote","salary_min":83200,"salary_max":93600,"title":"Packaging Designer"},

  // Senior Designers
  {"id":"e7d4b78f4035572f","company":"Humana","location":"Remote","salary_min":94900,"salary_max":130500,"title":"Senior Digital Designer"},
  {"id":"b0e0be9a3e17ebcf","company":"SurveyMonkey","location":"Portland, OR","salary_min":141100,"salary_max":null,"title":"Senior Designer"},
  {"id":"16b7cb886210958a","company":"VSA Partners","location":"Remote","salary_min":null,"salary_max":null,"title":"Freelance - Senior Designer"},
  {"id":"f19f59241f91bfbe","company":"Vanta","location":"Remote","salary_min":143000,"salary_max":168000,"title":"Senior Web Designer, Brand"},
  {"id":"70a65cd0c60b42a6","company":"Softek Services","location":"Remote","salary_min":87360,"salary_max":108160,"title":"Senior Instructional Designer"},
  {"id":"d0bec2def1558c46","company":"CVS Health","location":"Albany, NY","salary_min":101970,"salary_max":203940,"title":"Senior Digital Experience Designer"},
  {"id":"553b2703c27acc46","company":"Vercel","location":"Remote","salary_min":156000,"salary_max":234000,"title":"Senior Product Designer"},
  {"id":"df2f24a414378d08","company":"Blueprint","location":"Remote","salary_min":120000,"salary_max":150000,"title":"Senior Digital Designer, Organic + Paid Social"},
  {"id":"0021934ab8535459","company":"Facet","location":"Remote","salary_min":150000,"salary_max":200000,"title":"Senior Product Designer, Remote"},
  {"id":"b4c09f90416d1fba","company":"General Motors","location":"Remote","salary_min":105600,"salary_max":140700,"title":"Senior Content Designer, Commerce"},

  // Design Leads
  {"id":"e9ff9b67ad78a8b1","company":"NTT Ltd","location":"Remote","salary_min":81000,"salary_max":115700,"title":"Associate Design Manager"},
  {"id":"82dff5b066a09715","company":"CVS Health","location":"Woonsocket, RI","salary_min":66330,"salary_max":145860,"title":"Sr. Designer 2D, Experience Design"},
  {"id":"2bb0ff49468c5a3d","company":"VAST Data","location":"Remote","salary_min":null,"salary_max":null,"title":"Presentation Design Lead"},
  {"id":"b049490bc0de0918","company":"The Moore Group","location":"Annapolis, MD","salary_min":null,"salary_max":null,"title":"Design Strategy Lead"},

  // Interaction/UX Designers
  {"id":"c4a5e880cdd8d6b3","company":"HealthEquity","location":"Remote","salary_min":127000,"salary_max":165000,"title":"Principal UI Interaction Designer"},
  {"id":"a1b8233d1b242785","company":"Pearl","location":"Remote","salary_min":null,"salary_max":null,"title":"Product Designer II"},
  {"id":"d4581be4d33292c7","company":"Included Health","location":"Remote","salary_min":149450,"salary_max":274430,"title":"Staff Product Designer, Growth and Visual"},

  // Design Systems
  {"id":"756d52828921f764","company":"Chess.com","location":"Remote","salary_min":null,"salary_max":null,"title":"Product Designer, Design Systems"},
  {"id":"7f7e3ae3a0868e97","company":"Clickhouse","location":"Remote","salary_min":124000,"salary_max":152000,"title":"Curriculum Designer - AMER"},
]

async function importJobs() {
  console.log(`Importing ${jobs.length} jobs...`)
  let inserted = 0
  let skipped = 0

  for (const job of jobs) {
    const externalId = `indeed-${job.id}`

    const { data: existing } = await supabase
      .from('jobs')
      .select('id')
      .eq('external_id', externalId)
      .single()

    if (existing) {
      skipped++
      continue
    }

    const { error } = await supabase
      .from('jobs')
      .insert({
        external_id: externalId,
        source: 'indeed',
        title: job.title,
        company: job.company,
        location: job.location,
        salary_min: job.salary_min,
        salary_max: job.salary_max,
        description: `Apply to ${job.company}: ${job.title}`,
        job_type: 'full-time',
        apply_url: `https://indeed.com/viewjob?jk=${job.id}`,
        posted_at: new Date().toISOString(),
        is_active: true,
        is_featured: false
      })

    if (!error) inserted++
    else console.log(`Error: ${job.title} - ${error.message}`)
  }

  const { count } = await supabase
    .from('jobs')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)

  console.log(`\nInserted: ${inserted}`)
  console.log(`Skipped: ${skipped}`)
  console.log(`Total jobs in DB: ${count}`)
}

importJobs()
