import { ClinicConfig } from "../config/ClinicConfigs";

export interface TourMessage {
  content: string;
  action?: 'highlight' | 'scroll' | 'pause';
  duration?: number;
}

export function getTourScript(clinic: ClinicConfig): Record<string, TourMessage[]> {
  return {
    hero: [
      {
        content: `Hi Dr. ${clinic.doctor_name}! I'm CalmClinic's AI guide. Let me walk you through what I built specifically for ${clinic.practice_name}.`,
        action: 'pause',
        duration: 3000
      },
      {
        content: "This isn't just another AI tool - it's a complete patient experience system designed by someone who understands healthcare.",
        action: 'highlight'
      },
      {
        content: "Ready to see how it works? Let's explore your custom demo together.",
        action: 'scroll'
      }
    ],
    
    origin: [
      {
        content: "This story starts right here, in your waiting room. The founder spent months observing patient experiences.",
        action: 'highlight'
      },
      {
        content: "Every anxious moment, every unasked question, every missed opportunity - they all led to this solution.",
        action: 'pause',
        duration: 2000
      },
      {
        content: "Notice how personal this story is. This wasn't built in a boardroom - it was born from real clinical experience.",
        action: 'highlight'
      }
    ],
    
    'how-it-works': [
      {
        content: "Here's the magic: turning patient anxiety into preparation in just 5 simple steps.",
        action: 'highlight'
      },
      {
        content: "Click through each step to see how seamlessly it works. No apps, no accounts, no friction.",
        action: 'highlight'
      },
      {
        content: "This isn't just technology - it's patient care reimagined for the digital age.",
        action: 'pause',
        duration: 2000
      }
    ],
    
    differentiators: [
      {
        content: "Now here's what makes CalmClinic different from every other AI solution out there.",
        action: 'highlight'
      },
      {
        content: "Click through each feature. Notice how everything is designed specifically for medical practices, not adapted from generic tools.",
        action: 'highlight'
      },
      {
        content: `See that customization? This assistant will speak exactly like ${clinic.practice_name} because you control every word.`,
        action: 'highlight'
      }
    ],
    
    'live-demo': [
      {
        content: "This is the moment of truth - your actual AI assistant, running live with your practice branding.",
        action: 'highlight'
      },
      {
        content: `Notice the ${clinic.practice_name} colors, Dr. ${clinic.doctor_name}'s name, and ${clinic.specialty}-specific responses.`,
        action: 'highlight'
      },
      {
        content: "Go ahead, type a message. See how it responds with your practice's voice and expertise.",
        action: 'pause',
        duration: 3000
      },
      {
        content: "This is exactly what your patients would experience when they scan the QR code in your waiting room.",
        action: 'highlight'
      }
    ],
    
    cta: [
      {
        content: "So, Dr. ${clinic.doctor_name}, you've seen the vision, the technology, and the execution.",
        action: 'highlight'
      },
      {
        content: "CalmClinic isn't just ready for your practice - it's been built specifically with practices like yours in mind.",
        action: 'pause',
        duration: 2000
      },
      {
        content: "Ready to transform how your patients experience care? Let's make it happen.",
        action: 'highlight'
      }
    ]
  };
}