// Job APIs - Modular exports
// This directory contains the job API code split into manageable modules

// Re-export types
export * from './types'

// Re-export constants
export * from './constants'

// Re-export utility functions
export * from './utils'

// Re-export individual fetchers
export { fetchRemotiveJobs, fetchRemoteOKJobs, fetchArbeitnowJobs, fetchJSearchJobs } from './fetchers/aggregators'
export { fetchIndeedJobs } from './fetchers/indeed'
export { fetchYCombinatorJobs } from './fetchers/ycombinator'

// For backwards compatibility, also re-export from the main job-apis.ts file
// These fetchers are still in the main file and will be migrated gradually
export {
  fetchHimalayasJobs,
  fetchJobicyJobs,
  fetchAuthenticJobs,
  fetchWorkingNomadsJobs,
  fetchMuseJobs,
  fetchGreenhouseJobs,
  fetchLeverJobs,
  fetchAshbyJobs,
  fetchAdzunaJobs,
  fetchGlintsJobs,
  fetchTokyoDevJobs,
  fetchNodeFlairJobs,
  fetchJoobleJobs,
  fetchJobStreetJobs,
  fetchKalibrrJobs,
  fetchInstahyreJobs,
  fetchWantedlyJobs,
  fetchLinkedInJobs,
  fetchRapidAPIRemoteJobs,
  fetchAllJobs,
  GREENHOUSE_COMPANIES,
  LEVER_COMPANIES,
  ASHBY_COMPANIES,
} from '../job-apis'
