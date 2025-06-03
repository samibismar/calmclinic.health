import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Type for our clinic data
export interface Clinic {
  id: number
  slug: string
  doctor_name: string
  logo_url: string
  primary_color: string
  welcome_message: string
  specialty: string
  created_at: string
}