import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: false
    }
  }
)

// Database types
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          discord_id: string
          created_at: string
          updated_at: string
          privy_id: string
          sol_address: string
        }
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['users']['Insert']>
      }
      error_logs: {
        Row: {
          id: string
          command: string
          error: string
          stack?: string
          user_id: string
          timestamp: string
        }
        Insert: Omit<Database['public']['Tables']['error_logs']['Row'], 'id' | 'timestamp'>
        Update: Partial<Database['public']['Tables']['error_logs']['Insert']>
      }
    }
  }
} 