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

// For client components: import { createBrowserSupabaseClient } from '@/lib/supabase-browser'
// For auth-aware server code: import { createAuthSupabaseClient } from '@/lib/supabase-server'
