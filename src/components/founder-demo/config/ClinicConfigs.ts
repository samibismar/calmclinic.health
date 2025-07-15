// Clinic-specific configuration for founder demos
export interface ClinicConfig {
  id: string;
  slug: string;
  practice_name: string;
  doctor_name: string;
  specialty: string;
  
  // Visual branding
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  
  // Founder story elements
  origin_story: {
    personal_connection: string;
    key_observation: string;
    moment_of_realization: string;
  };
  
  // Demo content
  suggested_prompts: string[];
  testimonial_quote?: string;
  patient_volume?: string;
  
  // Call to action
  cta_message: string;
  contact_preference: 'email' | 'phone' | 'form';
  
  // Contact information
  contact_phone?: string;
  contact_email?: string;
}

// Fort Worth Eye Associates Configuration
export const FORT_WORTH_EYE_CONFIG: ClinicConfig = {
  id: 'fort-worth-eye',
  slug: 'fort-worth-eye',
  practice_name: 'Fort Worth Eye Associates',
  doctor_name: 'Dr. Ranelle',
  specialty: 'Ophthalmology',
  
  colors: {
    primary: '#1e40af',      // Professional deep blue
    secondary: '#3b82f6',    // Bright blue accent
    accent: '#64748b',       // Clean gray
    background: '#ffffff',   // Clean white
    text: '#0f172a',         // High contrast dark
  },
  
  origin_story: {
    personal_connection: "I spent 6 months working at Fort Worth Eye Associates, watching Dr. Ranelle and her team provide incredible care to patients every day.",
    key_observation: "But I noticed something: patients would arrive anxious, wait with questions, and often leave with concerns they forgot to ask about.",
    moment_of_realization: "That's when I realized - what if we could help patients feel prepared, informed, and heard before they even stepped into the exam room?"
  },
  
  suggested_prompts: [
    "What should I expect during my cataract surgery consultation?",
    "How do I prepare my child for their first eye exam?",
    "Are there any lifestyle changes that could help my dry eyes?",
    "What questions should I ask Dr. Ranelle about LASIK?"
  ],
  
  testimonial_quote: "The assistant feels like an extension of our practice. Patients arrive more prepared and less anxious.",
  patient_volume: "500+ patients monthly",
  
  cta_message: "I'd love to show you how CalmClinic could work specifically for your practice and get your thoughts on what we're building.",
  contact_preference: 'form',
  contact_phone: '817-243-6226',
  contact_email: 'sbismar2025@gmail.com'
};

// Template for other clinics
export const CLINIC_CONFIG_TEMPLATE: Omit<ClinicConfig, 'id' | 'slug'> = {
  practice_name: '[Practice Name]',
  doctor_name: 'Dr. [Name]',
  specialty: '[Specialty]',
  
  colors: {
    primary: '#2563eb',
    secondary: '#059669',
    accent: '#6b7280',
    background: '#0f172a',
    text: '#f8fafc',
  },
  
  origin_story: {
    personal_connection: "I spent time working at [Practice Name], observing how [Dr. Name] and the team deliver exceptional [specialty] care.",
    key_observation: "I noticed patients often had questions and concerns that went unaddressed due to time constraints and appointment flow.",
    moment_of_realization: "What if we could give every patient a knowledgeable assistant to help them prepare, learn, and feel more confident about their care?"
  },
  
  suggested_prompts: [
    "What should I expect during my visit?",
    "How do I prepare for this procedure?",
    "What questions should I ask the doctor?",
    "What are the next steps in my treatment?"
  ],
  
  patient_volume: "300+ patients monthly",
  cta_message: "We're partnering with innovative practices to build the future of AI-enhanced patient care.",
  contact_preference: 'form'
};

// Utility functions
export function getClinicConfig(slug: string): ClinicConfig {
  switch (slug) {
    case 'fort-worth-eye':
      return FORT_WORTH_EYE_CONFIG;
    default:
      throw new Error(`Clinic configuration not found for slug: ${slug}`);
  }
}

export function getAllClinicSlugs(): string[] {
  return ['fort-worth-eye'];
}