// Script to update all SEO pages to pass filter props for pagination
// This script reads each SEO page and adds the appropriate filter props to SEOLandingPage

import * as fs from 'fs'
import * as path from 'path'

const APP_DIR = path.join(__dirname, '..', 'src', 'app')

// Page type patterns and their required prop additions
const pagePatterns = [
  {
    // Job Type pages: remote-brand-design-jobs, remote-ui-ux-design-jobs, etc.
    match: /^remote-(ui-ux-design|product-design|graphic-design|motion-design|brand-design|web-design|interaction-design|visual-design)-jobs$/,
    type: 'jobType',
    propToAdd: 'filterKeywords={page.filterKeywords}',
  },
  {
    // Regional pages: remote-design-jobs-usa, remote-design-jobs-europe, etc.
    match: /^remote-design-jobs-(usa|europe|asia|uk|canada|latam|australia|middle-east|africa|worldwide)$/,
    type: 'regional',
    propToAdd: 'locationKeywords={page.locationKeywords}',
  },
  {
    // Combination pages: remote-brand-design-jobs-usa, etc.
    match: /^remote-(ui-ux-design|product-design|graphic-design|motion-design|brand-design|web-design|interaction-design|visual-design)-jobs-(usa|europe|asia|uk|canada|latam|australia|middle-east|africa|worldwide)$/,
    type: 'combination',
    propToAdd: 'filterKeywords={jobTypeConfig.filterKeywords}\n        locationKeywords={regionConfig.locationKeywords}',
  },
  {
    // Experience Level pages: entry-level-design-jobs, junior-designer-jobs, etc.
    match: /^(entry-level-design-jobs|junior-designer-jobs|mid-level-designer-jobs|senior-designer-jobs|design-lead-jobs|design-director-jobs)$/,
    type: 'experienceLevel',
    propToAdd: 'experienceLevel={page.filterValue}',
  },
  {
    // Employment Type pages: full-time-design-jobs, part-time-design-jobs, etc.
    match: /^(full-time-design-jobs|part-time-design-jobs|contract-design-jobs|freelance-design-jobs|design-internships)$/,
    type: 'employmentType',
    propToAdd: 'employmentType={page.filterValue}',
  },
]

function getDirName(dir: string): string {
  return path.basename(dir)
}

function updatePageFile(filePath: string, dirName: string): { updated: boolean; type: string | null } {
  let content = fs.readFileSync(filePath, 'utf-8')

  // Find which pattern this page matches
  let matchedPattern = null
  for (const pattern of pagePatterns) {
    if (pattern.match.test(dirName)) {
      matchedPattern = pattern
      break
    }
  }

  if (!matchedPattern) {
    return { updated: false, type: null }
  }

  // Check if the prop is already added
  if (content.includes(matchedPattern.propToAdd.split('\n')[0])) {
    return { updated: false, type: matchedPattern.type }
  }

  // Find SEOLandingPage component and add the prop before the closing />
  const seoLandingPageRegex = /(<SEOLandingPage[\s\S]*?)(\/\s*>)/
  const match = content.match(seoLandingPageRegex)

  if (!match) {
    console.log(`  Warning: SEOLandingPage not found in ${filePath}`)
    return { updated: false, type: matchedPattern.type }
  }

  // Add the prop before the closing />
  const updatedComponent = `${match[1]}${matchedPattern.propToAdd}\n      ${match[2]}`
  content = content.replace(seoLandingPageRegex, updatedComponent)

  fs.writeFileSync(filePath, content)
  return { updated: true, type: matchedPattern.type }
}

async function main() {
  console.log('Updating SEO pages with pagination filter props...\n')

  const stats = {
    jobType: { total: 0, updated: 0 },
    regional: { total: 0, updated: 0 },
    combination: { total: 0, updated: 0 },
    experienceLevel: { total: 0, updated: 0 },
    employmentType: { total: 0, updated: 0 },
    skipped: 0,
  }

  // Get all directories in src/app
  const entries = fs.readdirSync(APP_DIR, { withFileTypes: true })

  for (const entry of entries) {
    if (!entry.isDirectory()) continue

    const dirName = entry.name
    const pageFile = path.join(APP_DIR, dirName, 'page.tsx')

    if (!fs.existsSync(pageFile)) continue

    const result = updatePageFile(pageFile, dirName)

    if (result.type) {
      const typeKey = result.type as keyof typeof stats
      if (typeof stats[typeKey] === 'object') {
        stats[typeKey].total++
        if (result.updated) {
          stats[typeKey].updated++
          console.log(`✓ Updated ${dirName} (${result.type})`)
        }
      }
    } else {
      stats.skipped++
    }
  }

  console.log('\n--- Summary ---')
  console.log(`Job Type pages: ${stats.jobType.updated}/${stats.jobType.total} updated`)
  console.log(`Regional pages: ${stats.regional.updated}/${stats.regional.total} updated`)
  console.log(`Combination pages: ${stats.combination.updated}/${stats.combination.total} updated`)
  console.log(`Experience Level pages: ${stats.experienceLevel.updated}/${stats.experienceLevel.total} updated`)
  console.log(`Employment Type pages: ${stats.employmentType.updated}/${stats.employmentType.total} updated`)
  console.log(`Other pages skipped: ${stats.skipped}`)
}

main().catch(console.error)
