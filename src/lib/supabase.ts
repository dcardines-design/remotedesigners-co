import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Legacy export for compatibility with existing code (data fetching in server components/API routes)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Simple server client for data fetching (no auth)
export function createServerSupabaseClient() {
  return createClient(supabaseUrl, supabaseAnonKey)
}

// Admin client for write operations (bypasses RLS)
export function createAdminSupabaseClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) {
    console.warn('SUPABASE_SERVICE_ROLE_KEY not set, falling back to anon key')
    return createClient(supabaseUrl, supabaseAnonKey)
  }
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false }
  })
}

type AdminClient = ReturnType<typeof createAdminSupabaseClient>

// Find an auth user by email, paginating past Supabase's default 50-user page
// size. listUsers() returns only the first page by default, so any user beyond
// the first 50 is invisible — which silently breaks subscription activation and
// post-checkout auto-login once the user base grows past 50.
export async function findAuthUserByEmail(supabase: AdminClient, email: string) {
  const target = email.toLowerCase()
  const perPage = 1000
  for (let page = 1; page <= 100; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage })
    if (error) {
      console.error('listUsers failed:', error)
      return null
    }
    const users = data?.users || []
    const match = users.find(u => u.email?.toLowerCase() === target)
    if (match) return match
    if (users.length < perPage) break // last page reached
  }
  return null
}

// For client components: import { createBrowserSupabaseClient } from '@/lib/supabase-browser'
// For auth-aware server code: import { createAuthSupabaseClient } from '@/lib/supabase-server'
