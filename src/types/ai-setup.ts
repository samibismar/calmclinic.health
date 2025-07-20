// AI Setup Agent Types

export interface InterviewResponses {
  communicationStyle: string;
  anxietyHandling: string;
  practiceUniqueness: string;
  medicalDetailLevel: string;
  escalationPreference: string;
  culturalApproach: string;
  formalityLevel: string;
}

export interface InterviewQuestion {
  id: keyof InterviewResponses;
  question: string;
  follow_up: string;
}

export interface SetupAgentMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
}

export interface SetupAgentResponse {
  message: string;
  currentQuestion: number;
  totalQuestions: number;
  isComplete: boolean;
  progress: number;
  extractedResponses?: InterviewResponses;
}

export interface PersonalitySettings {
  warmth: number; // 1-5 scale
  professionalism: number; // 1-5 scale  
  detail: number; // 1-5 scale
}

export interface AIConfigurationData {
  interviewResponses: InterviewResponses;
  template: 'general' | 'urgent-care' | 'specialist' | 'dental' | 'mental-health' | 'pediatric' | 'custom';
  personalitySettings: PersonalitySettings;
  customInstructions?: string;
}

// Extended AI Prompt History with interview data
export interface AIPromptHistoryWithInterview {
  id: number;
  clinic_id: number;
  prompt_text: string;
  version: number;
  created_at: string;
  created_by: string;
  generation_data: {
    template: string;
    custom_instructions?: string;
    intelligence_data_used: boolean;
    interview_responses?: InterviewResponses;
    personality_settings?: PersonalitySettings;
  };
  is_active: boolean;
}

// Voice interface types
export interface VoiceConfig {
  enabled: boolean;
  language: string;
  voice?: SpeechSynthesisVoice;
  rate: number;
  pitch: number;
  volume: number;
}

export interface SpeechRecognitionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
}

// System prompt assembly types
export interface PromptAssemblyConfig {
  basePrompt: string;
  toolInstructions: string;
  conversationRules: string;
  clinicPersonality: InterviewResponses;
  fallbackGuidelines: string;
  personalityGuidelines: string;
}

export interface AssembledSystemPrompt {
  fullPrompt: string;
  components: PromptAssemblyConfig;
  version: string;
  clinicId: number;
  generatedAt: Date;
}