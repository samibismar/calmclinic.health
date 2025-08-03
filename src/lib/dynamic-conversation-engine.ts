export type ConversationState = 
  | 'initializing'
  | 'welcome'
  | 'selecting_provider'
  | 'explaining_study' 
  | 'getting_consent'
  | 'answering_questions'
  | 'demo_transition'
  | 'assistant_demo'
  | 'collecting_feedback'
  | 'wrapping_up'
  | 'complete';

export interface ConversationContext {
  clinicName: string;
  userName?: string;
  selectedProvider?: string;
  providerId?: string;
  hasConsent: boolean;
  questionsAsked: string[];
  demoCompleted: boolean;
  feedbackGiven: boolean;
}

export interface ConversationConfig {
  clinicSlug: string;
  clinicName: string;
  enableVoice: boolean;
  onStateChange: (state: ConversationState) => void;
  onConversationUpdate: (messages: ConversationMessage[]) => void;
  onError: (error: string) => void;
}

export interface ConversationMessage {
  id: string;
  role: 'ai' | 'user' | 'system';
  content: string;
  timestamp: Date;
  isPlaying?: boolean;
}

export class DynamicConversationEngine {
  private config: ConversationConfig;
  private state: ConversationState = 'initializing';
  private context: ConversationContext;
  private messages: ConversationMessage[] = [];
  private isListening = false;
  private isSpeaking = false;
  private audioContext: AudioContext | null = null;
  private recognition: SpeechRecognition | null = null;
  private autoListenAfterSpeaking = false;

  constructor(config: ConversationConfig) {
    this.config = config;
    this.context = {
      clinicName: config.clinicName,
      hasConsent: false,
      questionsAsked: [],
      demoCompleted: false,
      feedbackGiven: false,
    };
  }

  async initialize(): Promise<void> {
    try {
      console.log('🎤 Initializing dynamic conversation engine...');
      
      // Initialize audio context
      this.audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('✅ Microphone permission granted');
      
      // Setup speech recognition
      this.setupSpeechRecognition();
      
      // Start the conversation
      await this.startConversation();
      
    } catch (error) {
      console.error('❌ Failed to initialize conversation:', error);
      this.config.onError(`Failed to initialize voice conversation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private setupSpeechRecognition(): void {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      throw new Error('Speech recognition not supported. Please use Chrome or Edge browser.');
    }

    const SpeechRecognition = (window as unknown as { SpeechRecognition?: typeof webkitSpeechRecognition; webkitSpeechRecognition?: typeof webkitSpeechRecognition }).SpeechRecognition || (window as unknown as { webkitSpeechRecognition?: typeof webkitSpeechRecognition }).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      throw new Error('Speech recognition not available');
    }
    
    this.recognition = new SpeechRecognition();
    this.recognition.continuous = false;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';

    this.recognition.onstart = () => {
      console.log('🎤 Started listening...');
      this.isListening = true;
    };

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        }
      }

      if (finalTranscript) {
        console.log('👤 User said:', finalTranscript);
        this.handleUserInput(finalTranscript);
      }
    };

    this.recognition.onerror = (error: SpeechRecognitionErrorEvent) => {
      console.error('❌ Speech recognition error:', error.error);
      this.isListening = false;
      
      // Auto-restart listening if it was an expected error during continuous conversation
      if (this.autoListenAfterSpeaking && error.error === 'no-speech') {
        setTimeout(() => this.startListening(), 1000);
      }
    };

    this.recognition.onend = () => {
      console.log('🔇 Stopped listening');
      this.isListening = false;
      
      // Auto-restart listening if we're in continuous conversation mode
      if (this.autoListenAfterSpeaking && !this.isSpeaking) {
        setTimeout(() => this.startListening(), 500);
      }
    };
  }

  private async startConversation(): Promise<void> {
    this.setState('welcome');
    
    // Engaging welcome with mini-onboarding
    const welcomeMessage = `Hi there! Welcome to ${this.context.clinicName}. I'm your AI assistant, and you're about to experience something pretty amazing - a live conversation with artificial intelligence that's specifically designed to help patients prepare for their appointments.

This is like having a knowledgeable healthcare assistant right here with you while you wait. I'll guide you through everything step by step, and it's completely optional. But I think you'll find this really interesting!

First, can you hear me clearly?`;
    
    await this.speak(welcomeMessage);
    
    // Start auto-listening after welcome
    this.autoListenAfterSpeaking = true;
    if (this.state !== 'complete') {
      setTimeout(() => this.startListening(), 1000);
    }
  }

  private async handleUserInput(input: string): Promise<void> {
    // Add user message to conversation
    this.addMessage('user', input);
    
    // Stop listening temporarily while we process and respond
    this.stopListening();
    
    const response = await this.generateContextualResponse(input);
    await this.speak(response);
    
    // Resume listening after our response
    if (this.autoListenAfterSpeaking && this.state !== 'complete') {
      setTimeout(() => this.startListening(), 1000);
    }
  }

  private async generateContextualResponse(userInput: string): Promise<string> {
    const systemPrompt = this.getSystemPromptForCurrentState();
    const conversationHistory = this.messages.slice(-6); // Last 6 messages for context
    
    try {
      console.log('🧠 Generating contextual response for state:', this.state);
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: systemPrompt },
            ...conversationHistory.map(msg => ({
              role: msg.role === 'ai' ? 'assistant' : msg.role,
              content: msg.content
            })),
            { role: 'user', content: userInput }
          ],
          clinic: this.config.clinicSlug,
        }),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Generated response');
      
      // Extract the message from the API response
      const responseText = data.message || data;
      
      // Update conversation state based on response content
      this.updateStateBasedOnConversation(userInput);
      
      return responseText;
      
    } catch (error) {
      console.error('❌ Failed to generate contextual response:', error);
      return this.getFallbackResponse();
    }
  }

  private getSystemPromptForCurrentState(): string {
    const providerName = this.context.selectedProvider || 'your healthcare provider';
    const clinicName = this.context.clinicName;
    
    const basePrompt = `You are a helpful AI assistant at ${clinicName}. You're conducting a brief study to show patients how AI can help them prepare for appointments. Be natural, conversational, and genuinely helpful. Keep responses concise but complete. `;

    switch (this.state) {
      case 'welcome':
        return basePrompt + `Welcome the patient warmly. Confirm they can hear you clearly. Explain: "I'm here to help you prepare for your visit today through a quick AI study. It takes just a few minutes and could be really helpful." Ask if they'd like to continue.`;
      
      case 'selecting_provider':
        return basePrompt + `Ask which healthcare provider they're here to see. Explain that knowing their provider helps you give more relevant information. Be friendly and patient.`;
      
      case 'explaining_study':
        // This state is now skipped - explanation happens in selectProvider method
        return basePrompt + `Explain the study briefly and ask for consent.`;
      
      case 'getting_consent':
        return basePrompt + `They've heard the explanation. Ask for their consent: "Would you like to try the AI assistant? It's completely optional, but I think it could help you prepare for your appointment." Wait for a clear yes/no response.`;
      
      case 'answering_questions':
        return basePrompt + `Answer any questions they have about the AI assistant or what they'll experience. Be reassuring and thorough. When they seem ready, offer to begin the demo.`;
      
      case 'demo_transition':
        return basePrompt + `Create an engaging mini-onboarding moment: "Perfect! Now I'm going to show you something really cool. Think of this as your personal AI assistant preview - I'll walk you through exactly how I can help patients like you prepare for appointments. This takes about 2 minutes and I think you'll be impressed by what's possible. I'm going to demonstrate three specific ways I can help with your visit to ${providerName} today. Ready to see what AI can do for healthcare? Let's dive in!"`;
      
      case 'assistant_demo':
        const interactionCount = this.context.questionsAsked.length;
        const lastUserInput = this.context.questionsAsked[this.context.questionsAsked.length - 1] || '';
        
        // Handle the critical "nothing to say" moment
        if (lastUserInput.toLowerCase().includes('nothing') || lastUserInput.toLowerCase().includes('don\'t have') || 
            lastUserInput.toLowerCase().includes('not sure') || lastUserInput.toLowerCase().includes('no questions')) {
          return `CRITICAL MOMENT: The user doesn't know what to ask. This is your chance to demonstrate value! Say something like: "No problem! A lot of patients don't know what to ask. Let me show you what I can help with..." Then proactively demonstrate 2-3 specific things you can do for their visit with ${providerName}. Examples: "I can explain what to expect during your appointment, help you prepare questions for Dr. ${providerName}, discuss any insurance or billing questions, or walk you through common procedures." Be enthusiastic and showcasing value, not just listing options.`;
        }
        
        if (interactionCount === 0) {
          return `You are demonstrating an AI medical assistant for ${providerName} at ${clinicName}. Your goal is to PROACTIVELY SHOWCASE VALUE. Start immediately with an enthusiastic demo: "Great! Let me show you exactly how I can help prepare you for your visit with ${providerName}. I'm going to walk you through three key things I can do for you..." Then demonstrate specific capabilities like: 1) Explaining what to expect during the appointment, 2) Helping prepare personalized questions for the doctor, 3) Providing relevant health education. Make it feel like an interactive walkthrough, not a Q&A session.`;
        } else if (interactionCount < 3) {
          return `Continue the WALKTHROUGH DEMONSTRATION. After each capability you show, immediately transition to the next one: "Now let me show you another way I can help..." or "Here's something else that might be valuable for your visit..." Keep the momentum going by actively demonstrating capabilities rather than waiting for their questions. Make them feel like they're discovering valuable features.`;
        } else {
          return `Complete the demo with enthusiasm: "And that's just a taste of how I can help patients prepare for their appointments! This gives you a sense of what's possible with AI assistance while you wait." Then smoothly transition to collecting feedback about their experience.`;
        }
      
      case 'collecting_feedback':
        const feedbackCount = this.context.questionsAsked.length;
        if (feedbackCount <= 3) {
          return basePrompt + `You're collecting structured feedback. Ask ONE specific question at a time and wait for their response before asking the next. Ask these questions in this exact order: 1) First ask: "Was this helpful today?" 2) After they respond, ask: "Would you use this again while waiting for your doctor?" 3) Finally ask: "What could I do better?" Be genuinely interested in their answers and acknowledge each response before moving to the next question.`;
        } else {
          return basePrompt + `Thank them for their detailed feedback and transition to wrapping up the experience. Show appreciation for their time and input.`;
        }
      
      case 'wrapping_up':
        return basePrompt + `Thank them sincerely: "Thank you for trying our AI assistant! Your feedback helps us improve this for all patients. You can now continue with your regular check-in for your appointment with ${providerName}."`;
      
      default:
        return basePrompt + "Guide them naturally through the AI assistant experience, being helpful and conversational.";
    }
  }

  private updateStateBasedOnConversation(userInput: string): void {
    const input = userInput.toLowerCase();
    
    switch (this.state) {
      case 'welcome':
        if (input.includes('yes') || input.includes('good') || input.includes('clear') || input.includes('ready')) {
          this.setState('selecting_provider');
        }
        break;
        
      case 'selecting_provider':
        // Provider selected, but don't auto-transition yet - let the AI respond first
        // The selectProvider method will handle the transition
        break;
        
      case 'explaining_study':
        if (input.includes('no') || input.includes('question') || input.includes('how') || input.includes('what')) {
          this.setState('answering_questions');
        } else {
          // Auto-progress after explanation (most users just listen)
          setTimeout(() => this.setState('getting_consent'), 2000);
        }
        break;
        
      case 'getting_consent':
        if (input.includes('yes') || input.includes('agree') || input.includes('okay') || input.includes('sure') || input.includes('try')) {
          this.context.hasConsent = true;
          setTimeout(() => this.setState('demo_transition'), 1000);
        }
        break;
        
      case 'answering_questions':
        if (input.includes('ready') || input.includes('start') || input.includes('try') || input.includes('okay')) {
          this.setState('demo_transition');
        }
        break;
        
      case 'demo_transition':
        // Give them a moment to understand, then start the demo
        setTimeout(() => this.setState('assistant_demo'), 2000);
        break;
        
      case 'assistant_demo':
        this.context.questionsAsked.push(userInput);
        
        // Demo-focused transition logic
        if (this.context.questionsAsked.length >= 3) {
          // After demonstrating value, move to feedback
          setTimeout(() => this.setState('collecting_feedback'), 2000);
        } else if (input.includes('no') || input.includes('nothing') || input.includes('that\'s all')) {
          // If user indicates they're done early, still collect feedback
          setTimeout(() => this.setState('collecting_feedback'), 1500);
        }
        break;
        
      case 'collecting_feedback':
        // Move to wrapping up after they give feedback
        this.context.feedbackGiven = true;
        setTimeout(() => this.setState('wrapping_up'), 2000);
        break;
        
      case 'wrapping_up':
        // Complete the experience
        setTimeout(() => {
          this.setState('complete');
          this.autoListenAfterSpeaking = false;
        }, 3000);
        break;
    }
  }

  private getFallbackResponse(): string {
    const providerName = this.context.selectedProvider || 'your healthcare provider';
    const responses: Record<ConversationState, string> = {
      initializing: "Getting ready to start our conversation...",
      welcome: "Hi there! I can see you're here. Can you hear me clearly? I'm here to help you prepare for your visit today and show you how AI can assist patients like you.",
      selecting_provider: "Which healthcare provider are you here to see today? Knowing this helps me give you the most relevant information for your visit.",
      explaining_study: `Great! Now that I know you're seeing ${providerName}, let me explain what we're going to do. This quick study will show you how AI can help patients prepare for appointments and get questions answered. It takes just a few minutes and could be really helpful for your visit today. Do you have any questions before we begin?`,
      getting_consent: "This is completely optional, but if you'd like to try it, I can show you how this AI assistant works and help you prepare for your appointment. Your feedback helps us make this better for all patients. Would you like to give it a try?",
      answering_questions: "I'm here to answer any questions you have about the AI assistant or what you'll experience. What would you like to know?",
      demo_transition: `Perfect! Now I'm switching into assistant mode - this is exactly how the AI would help you prepare for your visit with ${providerName}. Go ahead and ask me anything about your appointment, health concerns, or what to expect today. I'm here to help!`,
      assistant_demo: `I'm here to help you prepare for your visit with ${providerName}. What questions do you have about your appointment today? I can help with health concerns, what to expect, or anything else about your visit.`,
      collecting_feedback: "How was that experience? Do you think having an AI assistant like this would be helpful for preparing for your appointments? I'd love to hear your thoughts.",
      wrapping_up: `Thank you so much for trying our AI assistant! Your feedback helps us make this better for all patients. Now you can continue with your normal check-in process for your appointment with ${providerName}.`,
      complete: "Thank you for completing the AI assistant experience!"
    };
    
    return responses[this.state] || "I'm here to help guide you through this AI experience. What would you like to know?";
  }

  private async speak(text: string): Promise<void> {
    this.isSpeaking = true;
    this.addMessage('ai', text);
    
    try {
      // Check if voice is enabled in config
      if (!this.config.enableVoice) {
        console.log('🔇 Voice disabled - skipping TTS');
        this.isSpeaking = false;
        return;
      }

      const apiKey = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY;
      
      if (!apiKey || apiKey === 'your_elevenlabs_api_key_here') {
        console.log('⚠️ Using browser speech synthesis fallback');
        await this.speakWithBrowser(text);
        return;
      }

      console.log('🔊 Using ElevenLabs TTS for:', text.substring(0, 50) + '...');

      const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM', {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': apiKey
        },
        body: JSON.stringify({
          text: text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5,
            style: 0.2,
            use_speaker_boost: true
          }
        })
      });

      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.status}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);

      return new Promise((resolve, reject) => {
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          this.isSpeaking = false;
          console.log('✅ Finished speaking');
          resolve();
        };
        
        audio.onerror = (error) => {
          URL.revokeObjectURL(audioUrl);
          console.error('Audio playback error:', error);
          this.speakWithBrowser(text).then(() => {
            this.isSpeaking = false;
            resolve();
          }).catch(reject);
        };
        
        audio.play().catch(error => {
          console.error('Audio play error:', error);
          this.speakWithBrowser(text).then(() => {
            this.isSpeaking = false;
            resolve();
          }).catch(reject);
        });
      });

    } catch (error) {
      console.error('ElevenLabs speak error:', error);
      await this.speakWithBrowser(text);
      this.isSpeaking = false;
    }
  }

  private async speakWithBrowser(text: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9;
        utterance.pitch = 1.0;
        utterance.volume = 0.8;
        
        utterance.onend = () => resolve();
        utterance.onerror = (error) => reject(error);
        
        window.speechSynthesis.speak(utterance);
      } else {
        resolve();
      }
    });
  }

  private startListening(): void {
    if (!this.config.enableVoice || !this.recognition || this.isListening || this.isSpeaking) {
      return;
    }
    
    try {
      this.recognition.start();
    } catch (error) {
      console.error('Failed to start listening:', error);
    }
  }

  private stopListening(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
    }
  }

  private addMessage(role: 'ai' | 'user' | 'system', content: string): void {
    const message: ConversationMessage = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      role,
      content,
      timestamp: new Date()
    };
    
    this.messages.push(message);
    this.config.onConversationUpdate([...this.messages]);
  }

  private setState(newState: ConversationState): void {
    console.log(`🔄 State transition: ${this.state} → ${newState}`);
    this.state = newState;
    this.config.onStateChange(newState);
  }

  public getCurrentState(): ConversationState {
    return this.state;
  }

  public getMessages(): ConversationMessage[] {
    return [...this.messages];
  }

  public isCurrentlyListening(): boolean {
    return this.isListening;
  }

  public isCurrentlySpeaking(): boolean {
    return this.isSpeaking;
  }

  public async sendTextInput(text: string): Promise<void> {
    // Allow manual text input when voice is disabled
    await this.handleUserInput(text);
  }

  public async selectProvider(providerName: string, providerId?: string): Promise<void> {
    // Store selected provider
    this.context.selectedProvider = providerName;
    this.context.providerId = providerId;
    
    // Add confirmation message
    this.addMessage('user', `I'm here to see ${providerName}`);
    
    // Create an engaging onboarding moment
    const explanationMessage = `Excellent! You're seeing ${providerName} today - that's perfect for what I'm about to show you.

Here's what's happening: You're about to experience the future of patient preparation. This is a quick AI study where I'll demonstrate how artificial intelligence can help patients like you get ready for appointments and feel more confident about their visit.

Think of me as your personal healthcare preparation assistant. In the next few minutes, I'll show you some pretty impressive ways AI can help you prepare for your visit with ${providerName}. You'll get to experience this firsthand, and then I'll ask for your honest feedback.

This is completely optional, but I think you'll be amazed by what's possible. Ready to see how AI can transform your healthcare experience? Would you like to give it a try?`;
    
    await this.speak(explanationMessage);
    
    // Move to getting consent (skip the separate explaining_study state)
    this.setState('getting_consent');
  }

  public stop(): void {
    this.autoListenAfterSpeaking = false;
    this.stopListening();
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }
}