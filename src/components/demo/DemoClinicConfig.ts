// Fort Worth Eye Associates Demo Configuration
export const DEMO_CLINIC_CONFIG = {
  // Basic clinic info
  id: 'demo-fort-worth-eye',
  slug: 'fort-worth-eye-demo',
  practice_name: 'Fort Worth Eye Associates',
  doctor_name: 'Dr. Ranelle',
  specialty: 'Ophthalmology',
  
  // Branding
  primary_color: '#0ea5e9', // Cool, soothing blue
  accent_color: '#059669', // Calming green
  logo_url: null, // Can be added later if needed
  
  // AI Configuration
  welcome_message: "Welcome to Fort Worth Eye Associates! I'm Dr. Ranelle's AI assistant. I can help answer general vision questions and prepare you for your visit.",
  
  // Ophthalmology-specific suggested prompts
  suggested_prompts: {
    en: [
      "What should I know about cataract surgery?",
      "How do I prepare for my child's eye exam?", 
      "Are contact lenses better than glasses for dry eyes?",
      "What's involved in a LASIK consultation?"
    ],
    es: [
      "¿Qué debo saber sobre la cirugía de cataratas?",
      "¿Cómo preparo a mi hijo para el examen de la vista?",
      "¿Son mejores los lentes de contacto que los anteojos para ojos secos?",
      "¿Qué incluye una consulta de LASIK?"
    ]
  },
  
  // Professional disclaimers
  disclaimer: "This assistant is designed to help with general vision questions while you wait. For diagnosis or treatment, please consult your ophthalmologist.",
  
  // Demo-specific features
  has_completed_setup: true,
  status: 'active',
  is_demo: true
};

// Pre-seeded conversation history for realistic demo
export const DEMO_CONVERSATION_HISTORY = [
  {
    role: 'assistant',
    content: DEMO_CLINIC_CONFIG.welcome_message,
    timestamp: new Date(Date.now() - 300000) // 5 minutes ago
  },
  {
    role: 'user', 
    content: "What should I expect during my cataract surgery recovery?",
    timestamp: new Date(Date.now() - 240000) // 4 minutes ago
  },
  {
    role: 'assistant',
    content: "Cataract surgery recovery is typically quite smooth! Most patients notice improved vision within a few days. You'll need to:\n\n• Use prescribed eye drops as directed\n• Avoid rubbing your eyes\n• Wear the protective shield while sleeping\n• Avoid heavy lifting for about a week\n\nDr. Ranelle will provide detailed post-op instructions, and most patients return to normal activities within a few days. Do you have any specific concerns about the procedure?",
    timestamp: new Date(Date.now() - 180000) // 3 minutes ago
  }
];

// Simulated activity metrics for "live" feel
export const DEMO_ACTIVITY_METRICS = {
  patients_helped_today: 12,
  active_conversations: 3,
  most_common_questions: [
    "Cataract surgery preparation",
    "LASIK consultation details", 
    "Pediatric eye exam tips",
    "Contact lens options for dry eyes"
  ]
};