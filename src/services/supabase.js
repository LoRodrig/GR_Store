import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

export const supabaseConfigured = Boolean(url && key)

// Use somente a Publishable Key no navegador. Nunca exponha a senha do banco
// ou uma service_role key em um site hospedado no GitHub Pages.
export const supabase = supabaseConfigured ? createClient(url, key) : null

export function requireSupabase() {
  if (!supabase) throw new Error('Configure VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY no .env.')
  return supabase
}
