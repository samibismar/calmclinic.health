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
  ai_instructions: string | null
  suggested_prompts: {
    en: string[]
    es: string[]
  } | null
  created_at: string
}

// Type for chat feedback data
export interface ChatFeedback {
  id: number
  clinic_id: number | null
  patient_name: string
  feedback: 'thumbs-up' | 'thumbs-down'
  chat_messages: Array<{role: string, content: string}>
  created_at: string
}