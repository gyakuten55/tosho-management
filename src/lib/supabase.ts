import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_URL')
}

if (!supabaseKey) {
  throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

console.log('Initializing Supabase client:', { url: supabaseUrl, keyPresent: !!supabaseKey })

// Create fresh client instance with cache-busting timestamp
const timestamp = Date.now()
export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  global: {
    headers: {
      'cache-control': 'no-cache, no-store, must-revalidate',
      'pragma': 'no-cache',
      'expires': '0',
      'x-client-refresh': timestamp.toString(),
      'x-force-refresh': 'true'
    }
  },
  db: {
    schema: 'public'
  },
  auth: {
    persistSession: false
  },
  // リアルタイム機能を無効化してキャッシュを回避
  realtime: {
    params: {
      eventsPerSecond: -1
    }
  }
})