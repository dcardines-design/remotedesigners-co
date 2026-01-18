import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Jobs collected from Indeed MCP API
const indeedJobs = [
  // Graphic Designer US
  {"id":"541c18b236d3592a","company":"Quigley Marketing","location":"Remote","salary_min":52000,"salary_max":104000,"title":"Freelance Graphic Designer - REMOTE/PART TIME","posted":"2026-01-08"},
  {"id":"8c16cc9f1edc9f57","company":"Stanford University","location":"Stanford, CA","salary_min":64207,"salary_max":113413,"title":"Graphic Designer (Remote Eligible)","posted":"2026-01-14"},
  {"id":"d2e837064eaf3568","company":"Authority Wit","location":"Remote","salary_min":70000,"salary_max":150000,"title":"Graphic Designer","posted":"2026-01-15"},
  {"id":"580aac1e9c8c3cfa","company":"CrucialPoint","location":"Remote","salary_min":72800,"salary_max":93600,"title":"Email Marketing Graphic Designer","posted":"2026-01-14"},
  {"id":"04e26df27de976f8","company":"Fritzen Publishing LLC","location":"Remote","salary_min":62400,"salary_max":124800,"title":"Graphic Designer and Book Cover Designer","posted":"2026-01-09"},
  {"id":"65c5be28d608dd1c","company":"KPR Elite Concept","location":"Remote","salary_min":45677,"salary_max":55016,"title":"Graphic Designer","posted":"2026-01-08"},
  {"id":"9a35d561b855f588","company":"InquisiCorp Corporation","location":"Remote","salary_min":65000,"salary_max":75000,"title":"Graphic Designer","posted":"2026-01-14"},
  {"id":"3fc2d97e7176e604","company":"InkWell Veritas","location":"Remote","salary_min":52000,"salary_max":83200,"title":"Graphic Designer","posted":"2026-01-15"},
  {"id":"02b7326f7059e6db","company":"Cella","location":"Remote","salary_min":66560,"salary_max":68640,"title":"Part-Time Production Artist","posted":"2026-01-16"},
  {"id":"ac72d8d03c1b6e62","company":"Open Bionics","location":"Remote","salary_min":45000,"salary_max":72000,"title":"Graphic Designer","posted":"2026-01-14"},
  {"id":"b6e8b98aa1066bec","company":"Television Academy","location":"Remote","salary_min":0,"salary_max":104000,"title":"Freelance Graphic Designer","posted":"2026-01-13"},
  {"id":"be5df7a89d6785a6","company":"Steuben Foods","location":"Remote","salary_min":62500,"salary_max":70000,"title":"Graphic Designer","posted":"2026-01-13"},
  {"id":"ac4d52c51359a9a0","company":"Odixcity Consulting","location":"Remote","salary_min":400000,"salary_max":600000,"title":"Graphic Designer","posted":"2026-01-15"},

  // UX Designer US
  {"id":"63fae9f3bceb2cef","company":"Greenway Health","location":"Remote","salary_min":null,"salary_max":null,"title":"Associate UX Designer","posted":"2026-01-08"},
  {"id":"a113f067de4de151","company":"Useful Media Ltd","location":"Remote","salary_min":150000,"salary_max":250000,"title":"UI/UX Designer","posted":"2026-01-15"},
  {"id":"23e4703cb27eae9b","company":"Cyberfleet Integrated","location":"Remote","salary_min":150000,"salary_max":250000,"title":"UI/UX Product Designer","posted":"2026-01-15"},
  {"id":"a2b5fac80a9f4829","company":"Odixcity Consulting","location":"Remote","salary_min":400000,"salary_max":600000,"title":"UI/UX Designer","posted":"2026-01-15"},
  {"id":"dfbcffed37a8a954","company":"ShipHawk","location":"Santa Barbara, CA","salary_min":90000,"salary_max":120000,"title":"UI/UX Designer","posted":"2026-01-05"},
  {"id":"4e1c39d6f692d076","company":"Omnigo Software LLC","location":"St. Louis, MO","salary_min":null,"salary_max":null,"title":"UI/UX Designer (Remote Position)","posted":"2026-01-16"},
  {"id":"85d14403b00ebc53","company":"Abercrombie and Fitch Co.","location":"Columbus, OH","salary_min":120000,"salary_max":135000,"title":"Sr. UX Designer - Design Systems (REMOTE)","posted":"2026-01-13"},
  {"id":"df742dfbd7ea2141","company":"Jibstar Business","location":"Remote","salary_min":150000,"salary_max":250000,"title":"Product & Brand Experience Designer","posted":"2026-01-15"},
  {"id":"e5388275396297f4","company":"Urban Insight","location":"Remote","salary_min":75000,"salary_max":95000,"title":"UI/UX Web Designer","posted":"2026-01-15"},
  {"id":"74bbffde3d157e67","company":"Eliza Health Inc","location":"Remote","salary_min":85000,"salary_max":null,"title":"User Experience Designer","posted":"2026-01-08"},
  {"id":"bc968abdbc3bd484","company":"Visalaw AI","location":"Remote","salary_min":null,"salary_max":null,"title":"Product Designer","posted":"2026-01-17"},
  {"id":"d68fbf5d0bca711e","company":"Clear Digital, Inc.","location":"San Jose, CA","salary_min":70000,"salary_max":110000,"title":"Mid-Level UX / IA Designer","posted":"2026-01-14"},
  {"id":"ca631df57687358e","company":"Parraid LLC","location":"Hollywood, MD","salary_min":90000,"salary_max":120000,"title":"UI/UX Designer","posted":"2026-01-12"},
  {"id":"3b22151bdc65c9ec","company":"SPINE","location":"Remote","salary_min":62400,"salary_max":83200,"title":"UX Designer","posted":"2026-01-12"},
  {"id":"d45da2c270b29685","company":"First Vulcan, Inc","location":"Remote","salary_min":41600,"salary_max":104000,"title":"UI/User Experience Designer","posted":"2026-01-06"},
  {"id":"f917333b92ade86f","company":"Netflix","location":"Remote","salary_min":120000,"salary_max":515000,"title":"Senior Ad Creative Designer","posted":"2026-01-15"},
  {"id":"26d89a3eb355240a","company":"Recruitics","location":"Remote","salary_min":104000,"salary_max":135200,"title":"B2B Freelance Designer","posted":"2026-01-15"},
  {"id":"000439fbaa72c786","company":"Auria","location":"Remote","salary_min":93583,"salary_max":134760,"title":"UI/UX Designer","posted":"2026-01-12"},

  // Web Designer US
  {"id":"3e16b556d27caff4","company":"HR On Wheels","location":"Remote","salary_min":250000,"salary_max":400000,"title":"Web Designer","posted":"2026-01-15"},
  {"id":"9d5538df33ad9f3e","company":"Design Garage","location":"Remote","salary_min":45760,"salary_max":66560,"title":"Part-Time Brand Designer","posted":"2026-01-08"},
  {"id":"7ed4fea2adb75375","company":"Underdog Solutions","location":"Remote","salary_min":31200,"salary_max":52000,"title":"Website Designer","posted":"2026-01-13"},
  {"id":"2d5360b17f07c3e7","company":"Interface Alliance","location":"Remote","salary_min":56160,"salary_max":66560,"title":"Branding & Website Design","posted":"2026-01-12"},
  {"id":"1b16db50149144bb","company":"Intrepy Healthcare Marketing","location":"Remote","salary_min":52000,"salary_max":58240,"title":"Jr. WordPress Designer/Developer","posted":"2026-01-15"},
  {"id":"e1e4789b591795d7","company":"Handcrafted Marketing Solutions","location":"Remote","salary_min":52291,"salary_max":62982,"title":"Contract Website & Logo Designer (Remote)","posted":"2026-01-12"},
  {"id":"007d41c36445bd62","company":"Highland Principals","location":"Remote","salary_min":60000,"salary_max":95000,"title":"Designer II","posted":"2026-01-14"},
  {"id":"710d8d8e4b72aa5d","company":"Limitless Creations","location":"Remote","salary_min":62400,"salary_max":72800,"title":"Digital Assets Designer","posted":"2026-01-15"},

  // Brand Designer US
  {"id":"04909cf7acd62596","company":"Runway AI","location":"Remote","salary_min":180000,"salary_max":230000,"title":"Senior Brand Designer","posted":"2026-01-09"},
  {"id":"1faeb84f95c38cf8","company":"Workiva","location":"Remote","salary_min":133000,"salary_max":214000,"title":"Lead Brand Designer","posted":"2026-01-09"},
  {"id":"298d123ee20b79f2","company":"Assured","location":"Palo Alto, CA","salary_min":170000,"salary_max":185000,"title":"Staff Brand/Graphic Designer","posted":"2026-01-13"},
  {"id":"1e59fa7b9ae5e367","company":"VSA Partners","location":"Remote","salary_min":50000,"salary_max":63000,"title":"Staff Designer","posted":"2026-01-14"},

  // Product Designer GB
  {"id":"1dcef4c869ebe4df","company":"Journey","location":"Remote","salary_min":null,"salary_max":null,"title":"Senior Product Designer","posted":"2026-01-09"},
  {"id":"80683c054f1f8c95","company":"DoiT","location":"London","salary_min":null,"salary_max":null,"title":"UX Designer","posted":"2026-01-08"},
  {"id":"090266779ee84a72","company":"Wordbank","location":"London WC2N 4JF","salary_min":null,"salary_max":null,"title":"Freelance Graphic Designer - Title Treatment Localization","posted":"2023-03-31"},
  {"id":"a0b3f85de9f34cba","company":"Journey","location":"Remote","salary_min":null,"salary_max":null,"title":"Design System Designer","posted":"2026-01-09"},
  {"id":"ba04983443c0f1e6","company":"KSF Global Ltd","location":"Remote","salary_min":62400,"salary_max":104000,"title":"Freelance Graphic Designer","posted":"2026-01-12"},
  {"id":"3a8ef71a16948c6f","company":"nono","location":"Remote","salary_min":27337,"salary_max":67330,"title":"UX/UI Designer","posted":"2026-01-09"},

  // Designer Canada
  {"id":"b14df7313b5161e0","company":"Party Booth","location":"Remote","salary_min":36920,"salary_max":45760,"title":"Junior Graphic Designer","posted":"2026-01-14"},
  {"id":"3ce587f03112dd66","company":"Cyneosure Health","location":"Remote","salary_min":null,"salary_max":null,"title":"Experience Designer","posted":"2026-01-15"},
  {"id":"e4f515aaa6c17cb5","company":"AAFRICANAA INC.","location":"Remote","salary_min":47050,"salary_max":62400,"title":"Content Designer","posted":"2026-01-14"},
  {"id":"f8c461a37374f07e","company":"Carebook","location":"Remote","salary_min":75000,"salary_max":95000,"title":"Product Designer, CoreHealth","posted":"2026-01-06"},
  {"id":"6ed1dd9ee0f072f9","company":"Lennard Commercial Realty","location":"Remote","salary_min":49920,"salary_max":49920,"title":"Junior Graphic Designer - Bilingual","posted":"2026-01-13"},
  {"id":"be3c84baedaf8784","company":"eVision Media","location":"Hope, BC","salary_min":62400,"salary_max":72800,"title":"Contract Website UI Designer (Graphic Designer)","posted":"2026-01-16"},
  {"id":"f4b41ba08a1e1f0b","company":"Ratehub","location":"Remote","salary_min":90000,"salary_max":125000,"title":"Product Designer","posted":"2026-01-07"},
  {"id":"187ec81f1ae89954","company":"Aequilibrium Software","location":"Remote","salary_min":83200,"salary_max":104000,"title":"Designer, Digital Marketing","posted":"2026-01-06"},

  // Designer Germany
  {"id":"a931302c8e61b89b","company":"wynwood tech LLC","location":"Home Office","salary_min":null,"salary_max":null,"title":"UX Concept Designer - 100% remote","posted":"2026-01-15"},
  {"id":"1e5c592b1ae7714f","company":"Entrando","location":"Home Office","salary_min":40000,"salary_max":50000,"title":"Grafikdesigner:in - Amazon & Shopify","posted":"2026-01-11"},
  {"id":"86bd1e69e138b382","company":"Netzbekannt GmbH","location":"Home Office","salary_min":52000,"salary_max":83200,"title":"Freelance Webdesigner/Webentwickler","posted":"2026-01-15"},
  {"id":"89314498ac1283aa","company":"Constructor","location":"Home Office","salary_min":null,"salary_max":null,"title":"Senior Product Designer - Searchandising (Remote)","posted":"2026-01-16"},
  {"id":"0cd058631addc5a0","company":"UserWise Services","location":"Home Office","salary_min":null,"salary_max":null,"title":"Game UX Designer (Casual Mobile)","posted":"2026-01-16"},
  {"id":"6d69357a311fb599","company":"Hire Overseas","location":"Home Office","salary_min":null,"salary_max":null,"title":"Gameplay Motion Designer (Unity)","posted":"2026-01-15"},
  {"id":"bfd00df1808d227d","company":"Growing Imaginations GmbH","location":"Home Office","salary_min":null,"salary_max":null,"title":"(Senior) Product Designer:in - fully remote","posted":"2026-01-06"},
  {"id":"252b0cf0ae0ea187","company":"wynwood tech LLC","location":"Home Office","salary_min":null,"salary_max":null,"title":"UI / Visual Designers - 100% remote","posted":"2026-01-15"},

  // Motion Designer US
  {"id":"48926de4c4ce00ec","company":"Merjoh Ltd","location":"Remote","salary_min":150000,"salary_max":250000,"title":"Motion Graphic Designer","posted":"2026-01-15"},
  {"id":"f0ea2204530e93d7","company":"Comstock","location":"Reston, VA","salary_min":null,"salary_max":null,"title":"Motion Designer (2D/3D Animator)","posted":"2026-01-12"},
  {"id":"f733b677026caace","company":"Moira Studio","location":"Remote","salary_min":104000,"salary_max":166400,"title":"Freelance Motion Graphics Designer and Editor","posted":"2026-01-15"},
  {"id":"19020c534f44c256","company":"Tinuiti","location":"Remote","salary_min":70000,"salary_max":80000,"title":"Sr. Motion Designer","posted":"2026-01-05"},
  {"id":"f68bf75b0af0f734","company":"Team Velocity","location":"Herndon, VA","salary_min":null,"salary_max":null,"title":"Motion Designer","posted":"2026-01-15"},
  {"id":"63cafa46fc3fc328","company":"Milan Laser Hair Removal","location":"Remote","salary_min":null,"salary_max":null,"title":"Motion Designer","posted":"2026-01-06"},
  {"id":"72ea06c624863cf4","company":"Arbor Platform, Inc.","location":"Remote","salary_min":29120,"salary_max":33280,"title":"Motion Graphics Designer","posted":"2026-01-06"},
  {"id":"845f05b27287a4c6","company":"Jegzi","location":"Remote","salary_min":null,"salary_max":null,"title":"Graphic Designer (Art-Directed AI Visuals & Motion Stills)","posted":"2026-01-15"},
  {"id":"53229f152884944a","company":"Metropolis Media Group","location":"Remote","salary_min":null,"salary_max":null,"title":"Freelance Video Editor / Motion Graphics Animator","posted":"2026-01-09"},
  {"id":"0223d3e1ffa38ed0","company":"Life Happens","location":"Remote","salary_min":83200,"salary_max":124800,"title":"Motion Graphics Artist & Video Editor (Remote)","posted":"2026-01-14"},
  {"id":"0bb454278386a7be","company":"Everblue","location":"Remote","salary_min":null,"salary_max":null,"title":"Graphic Designer","posted":"2026-01-13"},
]

async function importJobs() {
  console.log(`Importing ${indeedJobs.length} jobs...`)
  let inserted = 0
  let skipped = 0

  for (const job of indeedJobs) {
    const externalId = `indeed-${job.id}`

    // Check if job already exists
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
        posted_at: job.posted,
        is_active: true,
        is_featured: false
      })

    if (!error) {
      inserted++
    } else {
      console.log(`Error: ${job.title} - ${error.message}`)
    }
  }

  const { count } = await supabase
    .from('jobs')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)

  console.log(`\nInserted: ${inserted}`)
  console.log(`Skipped (already exist): ${skipped}`)
  console.log(`Total jobs in DB: ${count}`)
}

importJobs()
