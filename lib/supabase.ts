import { createClient } from '@supabase/supabase-js'

// Prefer environment variables; fallback keeps local dev working if env is missing.
// In production you MUST set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel.
const url =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://pdkdvaisggntdrvpxuur.supabase.co'

const key =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  ''

// Create client even if key is empty to avoid crashing during build;
// runtime queries will fail gracefully if not configured.
export const supabase = createClient(url, key || 'public-anon-key-placeholder')

// Helper to check if Supabase is configured
export const isSupabaseConfigured = () => {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
}
