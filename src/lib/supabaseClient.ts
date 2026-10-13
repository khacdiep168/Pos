import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://jaewyxazjvqtvqifdmlw.supabase.co';

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImphZXd5eGF6anZxdHZxaWZkbWx3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE0Mzg0MTgsImV4cCI6MjEwNzAxNDQxOH0.vXxjYEdEvK7HCefzPuKXgcguB4KPRjGkJhHcPF9uW00';

/**
 * Singleton Supabase Client instance.
 * Returns null if environment variables are not configured,
 * allowing graceful fallback to offline/localStorage mode.
 */
export const supabase: SupabaseClient | null =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      })
    : null;

/**
 * Checks if Supabase connection is actively configured and reachable.
 */
export async function checkSupabaseConnection(): Promise<{ connected: boolean; message: string }> {
  if (!supabase) {
    return {
      connected: false,
      message: 'Chưa cấu hình NEXT_PUBLIC_SUPABASE_URL và NEXT_PUBLIC_SUPABASE_ANON_KEY trong file .env',
    };
  }

  try {
    const { error } = await supabase.from('categories').select('id').limit(1);
    if (error && error.code !== 'PGRST116') {
      return { connected: false, message: error.message };
    }
    return { connected: true, message: 'Kết nối Supabase Cloud thành công!' };
  } catch (err: any) {
    return { connected: false, message: err?.message || 'Không thể kết nối đến Supabase' };
  }
}
