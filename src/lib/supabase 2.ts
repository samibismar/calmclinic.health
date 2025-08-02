import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🧪 Supabase URL env:', supabaseUrl);
console.log('🧪 Supabase ANON KEY env:', supabaseAnonKey?.slice(0, 12) + '...');

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase environment variables are missing. Check .env.local!');
  console.error('❌ One or both Supabase env vars are missing at runtime');
}

export const supabase = createClient(supabaseUrl!, supabaseAnonKey!);

// Optional: ping test to verify Supabase works (only in dev)
if (process.env.NODE_ENV === 'development') {
  supabase
    .from('clinics')
    .select('id')
    .limit(1)
    .then(({ data, error }) => {
      if (error) {
        console.error('❌ Supabase ping failed:', error);
      } else {
        console.log('✅ Supabase ping succeeded. Clinics:', data);
      }
    });
}

// Type for our clinic data - matches actual database schema
export interface Clinic {
  id: number;
  slug: string;
  practice_name: string;
  doctor_name: string | null;
  logo_url: string | null;
  primary_color: string;
  welcome_message: string | null;
  specialty: string | null;
  ai_instructions: string | null;
  suggested_prompts: {
    en: string[];
    es: string[];
  } | null;
  created_at: string;
}

// Type for chat feedback data
export interface ChatFeedback {
  id: number;
  clinic_id: number | null;
  patient_name: string;
  feedback: 'thumbs-up' | 'thumbs-down';
  chat_messages: Array<{ role: string; content: string }>;
  created_at: string;
}