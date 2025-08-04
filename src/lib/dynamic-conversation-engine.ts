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
    
    // Natural, human-like welcome
    const welcomeMessage = `Hey! I'm so glad you're here at ${this.context.clinicName}. I'm your AI assistant - think of me as your friendly prep buddy who's here to help make your visit go smoothly.

I know waiting for appointments can be a bit nerve-wracking, so I'm here to chat with you, answer questions, and help you feel totally prepared. No pressure at all - we can keep this super casual.

Can you hear me okay?`;
    
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
    
    const basePrompt = `You are a helpful AI assistant at ${clinicName}. You're conducting a brief study to show patients how AI can help them prepare for appointments. Be natural, conversational, and genuinely helpful. Keep responses concise but complete. `;

    switch (this.state) {
      case 'welcome':
        return basePrompt + `You're greeting someone like a friendly healthcare assistant would. Keep it warm and conversational. Once they confirm they can hear you, casually mention: "Perfect! I'm here to help you prep for today's visit - just think of me as your friendly assistant. Should take like 5 minutes and I promise it'll be worth it." Then naturally ask if they'd like to continue.`;
      
      case 'selecting_provider':
        return basePrompt + `Ask about their provider in a casual, friendly way: "So who are you here to see today?" or "Which doctor has the pleasure of your company today?" Keep it light and conversational. Briefly mention this helps you give better, more relevant tips.`;
      
      case 'explaining_study':
        return basePrompt + `You're casually explaining what you do, like telling a friend about something cool: "So here's the deal - I'm basically like having a smart healthcare buddy who can help you prep for appointments. I can answer questions, help you think of things to ask your doctor, that kind of stuff. Pretty neat, right?" Keep it conversational and not clinical.`;
      
      case 'getting_consent':
        return basePrompt + `Ask for consent like you're inviting them to try something fun: "Want to give it a shot? No pressure at all - totally up to you. But I think you might find it pretty helpful!" Keep it light and friendly, not formal.`;
      
      case 'answering_questions':
        return basePrompt + `Answer their questions like a helpful friend would - be reassuring and genuine. If they ask what it's like, you might say "It's just like chatting with someone who knows a lot about healthcare stuff. Nothing weird or complicated." When they seem comfortable, casually suggest: "Ready to dive in?"`;
      
      case 'demo_transition':
        return basePrompt + `Transition naturally like you're about to show them something interesting: "Awesome! Okay, so now I get to show you some of the cool stuff I can do. Think of this like getting a sneak peek of having your own personal healthcare prep assistant. Ready? Let's jump in!"`;
      
      case 'assistant_demo':
        const interactionCount = this.context.questionsAsked.length;
        const lastUserInput = this.context.questionsAsked[this.context.questionsAsked.length - 1] || '';
        
        // Critical engagement moment - IMMEDIATELY demonstrate value instead of asking what they want
        if (lastUserInput.toLowerCase().includes('nothing') || lastUserInput.toLowerCase().includes('don\'t have') || 
            lastUserInput.toLowerCase().includes('not sure') || lastUserInput.toLowerCase().includes('no questions')) {
          return `IMMEDIATE VALUE DEMONSTRATION: Don't ask what they want - SHOW them what you can do right now! Respond like: "Actually, that's perfect because I can show you some really useful stuff! Let me start with something super practical..." Then IMMEDIATELY provide one specific, actionable piece of information about their visit with ${providerName}. For example: "Here's what typically happens in your appointment with ${providerName}: [specific appointment flow], and here's one question most patients wish they'd asked: [specific relevant question]". Then continue: "See? That's the kind of stuff I can help you with. What else would be helpful?" Be proactive and demonstrate rather than explain.`;
        }
        
        if (interactionCount === 0) {
          return `Start immediately with concrete value! Say: "Perfect! Let me jump right in and show you some really practical stuff for your visit with ${providerName}..." Then IMMEDIATELY provide specific, useful information. Examples: "Here's what usually happens in appointments with ${providerName}: [specific steps] and here's a smart question to ask: [specific question]." Or: "Based on what I know about ${providerName}'s practice, here are 3 things that would be really helpful to mention: [specific items]." Don't just promise to help - actively help right now!`;
        } else if (interactionCount < 3) {
          return `Continue actively helping with specific information! Transition naturally: "Oh, and here's something else that could be super useful for your visit..." Then immediately provide another concrete piece of value - like preparation tips specific to ${providerName}, common concerns to discuss, or helpful things to bring. Keep giving them actual useful information, not just describing what you could do.`;
        } else {
          return `Wrap up by highlighting the value you just provided: "See how much more prepared you are now? That's exactly what I'm here for - turning that 'I don't know what to ask' feeling into 'I've got this!' confidence." Then transition warmly: "So, how did that feel? Was that actually helpful for you?" Keep it focused on the value they just experienced.`;
        }
      
      case 'collecting_feedback':
        const feedbackCount = this.context.questionsAsked.length;
        if (feedbackCount <= 3) {
          return basePrompt + `You're having a friendly chat about their experience. Ask questions like you genuinely care about their opinion: 1) "So, was that actually helpful for you?" 2) "Would you want to chat with me again before your next appointment?" 3) "Anything I could do better next time?" Respond to their answers like a real person would - with genuine interest and follow-up comments. Don't make it feel like a survey.`;
        } else {
          return basePrompt + `Thank them warmly like you just had a great conversation: "This was really fun! Thanks for chatting with me and for the feedback - it honestly helps me get better at this." Keep it genuine and appreciative.`;
        }
      
      case 'wrapping_up':
        return basePrompt + `Wrap up like you're saying goodbye to a friend: "Thanks so much for hanging out with me today! I really hope this helped you feel more ready for your visit with ${providerName}. You're all set to continue with your check-in now. Take care!"`;
      
      default:
        return basePrompt + "You're having a friendly, natural conversation. Be genuinely helpful, curious about their needs, and enthusiastic about helping them prepare for their visit. Respond like a knowledgeable, caring friend would.";
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
    
    // Natural, conversational transition
    const explanationMessage = `Perfect! ${providerName} - I've actually helped lots of people prep for visits with them. 

So here's the fun part - I get to show you some of the ways I can help make your appointment go super smoothly. Think of me like that friend who always knows what questions to ask and what to expect.

I'll walk you through a few things that might be really helpful for your visit today. Takes just a couple minutes, and honestly, I think you'll be pretty impressed with what I can do.

Sound good? Want to see what I've got?`;
    
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