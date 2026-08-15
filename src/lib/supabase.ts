import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// If the keys aren't configured yet, we export `null` and every call site
// falls back to localStorage-only behaviour (see src/utils/storage.ts and
// src/components/auth/AuthScreen.tsx) instead of crashing the app.
export const supabase =
  supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

export const isSupabaseConfigured = !!supabase;
