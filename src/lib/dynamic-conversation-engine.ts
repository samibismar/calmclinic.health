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
  private clinicId: number | null = null;
  private clinicInfo: { id?: number; name?: string; [key: string]: unknown } | null = null;

  constructor(config: ConversationConfig) {
    this.config = config;
    this.context = {
      clinicName: config.clinicName,
      hasConsent: false,
      questionsAsked: [],
      demoCompleted: false,
      feedbackGiven: false,
    };
    // Fetch clinic information for personalized responses
    this.fetchClinicInfo();
  }

  /**
   * Fetch contextual clinic information for personalized demonstrations
   */
  private async fetchClinicInfo(): Promise<void> {
    try {
      // Try to get clinic ID first
      const clinicResponse = await fetch(`/api/providers/${this.config.clinicSlug}`);
      if (clinicResponse.ok) {
        const clinicData = await clinicResponse.json();
        this.clinicId = clinicData.clinic?.id;
        this.clinicInfo = clinicData.clinic;
        console.log('Clinic info loaded for personalization:', this.clinicInfo?.name);
      }
    } catch (error) {
      console.log('Could not fetch clinic info for personalization:', error);
    }
  }

  /**
   * Get personalized information using hybrid RAG for specific queries
   */
  private async getPersonalizedInfo(query: string): Promise<string> {
    if (!this.clinicId) {
      return 'I can help you prepare for your appointment and think of great questions to ask your provider.';
    }

    try {
      const response = await fetch('/api/responses-hybrid', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            { role: 'user', content: query }
          ],
          clinicId: this.clinicId,
          useHybridRAG: true,
          maxWebPages: 2
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.message || 'I can help you prepare for your appointment.';
      }
    } catch (error) {
      console.log('Could not get personalized info:', error);
    }

    return 'I can help you prepare for your appointment and answer questions about your visit.';
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
    
    // Engaging welcome that explains value
    const welcomeMessage = `Hey! I'm your AI assistant here at ${this.context.clinicName}. I'm basically like having a smart friend who can help you prep for your visit, answer questions, or just chat to help you feel more relaxed while you wait. Can you hear me okay?`;
    
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
      console.log('🎯 System prompt being used:', systemPrompt);
      
      // FORCE our conversation flow for specific states instead of relying on AI
      if (this.state === 'explaining_study') {
        this.updateStateBasedOnConversation(userInput);
        return "Perfect! So here's the deal - I can be whatever you need right now. Want help preparing questions for your doctor? Need something explained? Or just want to chat to pass time? I'm doing a quick 5-minute study to show how AI can help patients. Want to give it a shot?";
      }
      
      if (this.state === 'getting_consent') {
        this.updateStateBasedOnConversation(userInput);
        return "Cool! So want to try it? I promise it's actually pretty helpful - or at least fun to chat with!";
      }
      
      if (this.state === 'selecting_provider') {
        // Don't update state yet - let the provider selection UI handle it
        return "Quick question - which doctor are you seeing today? Helps me give you better tips!";
      }
      
      // For the critical "nothing to ask" moment in assistant demo, provide immediate personalized value
      if (this.state === 'assistant_demo' && 
          (userInput.toLowerCase().includes('nothing') || 
           userInput.toLowerCase().includes('don\'t know') || 
           userInput.toLowerCase().includes('not sure'))) {
        
        const personalizedInfo = await this.getPersonalizedInfo(
          `What should a patient expect during their appointment and what are good questions to ask the provider?`
        );
        
        return `Actually, that's perfect because I can show you some really useful stuff! Let me start with something super practical: ${personalizedInfo} See? That's exactly the kind of helpful information I can provide. What else would be useful for you?`;
      }
      
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
    
    const basePrompt = `You are a friendly AI assistant at ${clinicName}. CRITICAL: Keep responses SHORT - max 1-2 sentences. Match the user's casual energy. Be conversational like talking to a friend, not formal. `;

    switch (this.state) {
      case 'welcome':
        return basePrompt + `Welcome them warmly and immediately explain what you are in an engaging way. Say something like: "Hey! I'm your AI assistant here at ${clinicName}. I'm basically like having a smart friend who can help you prep for your visit, answer questions, or just chat to help you feel more relaxed while you wait. Can you hear me okay?"`;
      
      case 'explaining_study':
        return basePrompt + `Explain the value clearly: "Perfect! So here's the deal - I can be whatever you need right now. Want help preparing questions for your doctor? Need something explained? Or just want to chat to pass time? I'm doing a quick 5-minute study to show how AI can help patients. Want to give it a shot?"`;
      
      case 'getting_consent':
        return basePrompt + `Ask for consent to continue: "Cool! So want to try it? I promise it's actually pretty helpful - or at least fun to chat with!"`;
      
      case 'selecting_provider':
        return basePrompt + `Now ask about their provider: "Quick question - which doctor are you seeing today? Helps me give you better tips!" Keep it casual.`;
      
      case 'answering_questions':
        return basePrompt + `Answer their questions casually and briefly. When they seem ready, ask "Ready to jump in?"`;
      
      case 'demo_transition':
        return basePrompt + `Say something like "Awesome! Let me show you what I can do - think of it like having your own health prep assistant."`;
      
      case 'assistant_demo':
        const interactionCount = this.context.questionsAsked.length;
        const lastUserInput = this.context.questionsAsked[this.context.questionsAsked.length - 1] || '';
        
        // Critical engagement moment - IMMEDIATELY demonstrate value
        if (lastUserInput.toLowerCase().includes('nothing') || lastUserInput.toLowerCase().includes('don\'t') || 
            lastUserInput.toLowerCase().includes('not sure') || lastUserInput.toLowerCase().includes('not really')) {
          return `User said they don't know what to ask. IMMEDIATELY give them one specific, practical tip about their visit with ${providerName}. Keep it short - just 1-2 sentences of actual helpful info, then ask "What else would help?"`;
        }
        
        if (interactionCount === 0) {
          return `Jump right in with one specific helpful tip about visiting ${providerName}. Keep it short and practical, then ask what else they want to know.`;
        } else if (interactionCount < 3) {
          return `Give another quick, practical tip about their visit. Keep responses short - match their energy level.`;
        } else {
          return `Wrap up warmly: "Hope that helps you feel more prepared!" Ask how it was for them.`;
        }
      
      case 'collecting_feedback':
        return basePrompt + `Ask casually: "So how was that? Pretty helpful?" Keep it conversational, not like a survey.`;
      
      case 'wrapping_up':
        return basePrompt + `Thank them briefly: "Thanks for trying that out! Hope it helps with your visit." Keep it short and friendly.`;
      
      default:
        return basePrompt + "Have a natural, brief conversation. Match their energy and keep responses short.";
    }
  }

  private updateStateBasedOnConversation(userInput: string): void {
    const input = userInput.toLowerCase();
    
    switch (this.state) {
      case 'welcome':
        if (input.includes('yes') || input.includes('yeah') || input.includes('good') || input.includes('clear') || input.includes('ready') || input.includes('perfect') || input.includes('hear') || input.includes('fine') || input.includes('okay')) {
          this.setState('explaining_study');
        }
        break;
        
      case 'selecting_provider':
        // Provider selected, but don't auto-transition yet - let the AI respond first
        // The selectProvider method will handle the transition
        break;
        
      case 'explaining_study':
        if (input.includes('no') || input.includes('question') || input.includes('how') || input.includes('what')) {
          this.setState('answering_questions');
        } else if (input.includes('yes') || input.includes('yeah') || input.includes('sure') || input.includes('okay') || input.includes('try') || input.includes('shot')) {
          this.setState('getting_consent');
        }
        break;
        
      case 'getting_consent':
        if (input.includes('yes') || input.includes('agree') || input.includes('okay') || input.includes('sure') || input.includes('try')) {
          this.context.hasConsent = true;
          this.setState('selecting_provider');
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

  private getProviderPronoun(providerName: string): string {
    // Simple heuristic for pronoun - could be enhanced with a provider gender database
    const lowerName = providerName.toLowerCase();
    if (lowerName.includes('dr.') || lowerName.includes('doctor')) {
      // Use 'them' as gender-neutral default for doctors
      return 'them';
    }
    return 'them'; // Default to gender-neutral
  }

  private addMessage(role: 'ai' | 'user' | 'system', content: string): void {
    const message: ConversationMessage = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
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
    
    // Determine proper pronoun for provider
    const pronoun = this.getProviderPronoun(providerName);
    
    // Natural, conversational transition
    const explanationMessage = `Perfect! ${providerName} - I've actually helped lots of people prep for visits with ${pronoun}. Ready to see what I can do to help you get ready?`;
    
    await this.speak(explanationMessage);
    
    // Move directly to demo
    this.setState('demo_transition');
  }

  public stop(): void {
    this.autoListenAfterSpeaking = false;
    this.stopListening();
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }
}