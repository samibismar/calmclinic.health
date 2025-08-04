export type SimpleConversationState = 
  | 'welcome'
  | 'explaining_study' 
  | 'selecting_provider'
  | 'assistant_demo'
  | 'collecting_feedback'
  | 'complete';

export interface SimpleConversationMessage {
  id: string;
  role: 'ai' | 'user';
  content: string;
  timestamp: Date;
}

export interface SimpleConversationConfig {
  clinicSlug: string;
  clinicName: string;
  enableVoice: boolean;
  onStateChange: (state: SimpleConversationState) => void;
  onConversationUpdate: (messages: SimpleConversationMessage[]) => void;
  onError: (error: string) => void;
}

export class SimpleConversationEngine {
  private config: SimpleConversationConfig;
  private state: SimpleConversationState = 'welcome';
  private messages: SimpleConversationMessage[] = [];
  private selectedProvider: string | null = null;
  private isListening = false;
  private isSpeaking = false;
  private recognition: SpeechRecognition | null = null;

  constructor(config: SimpleConversationConfig) {
    this.config = config;
    this.fetchClinicInfo();
  }

  private async fetchClinicInfo(): Promise<void> {
    // This could be used for future clinic-specific functionality
    try {
      await fetch(`/api/providers/${this.config.clinicSlug}`);
    } catch (error) {
      console.log('Could not fetch clinic info:', error);
    }
  }

  async initialize(): Promise<void> {
    try {
      if (this.config.enableVoice) {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        this.setupSpeechRecognition();
      }
      await this.startConversation();
    } catch (error) {
      this.config.onError(`Failed to initialize: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private setupSpeechRecognition(): void {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      throw new Error('Speech recognition not supported');
    }

    const SpeechRecognition = (window as { SpeechRecognition?: typeof webkitSpeechRecognition; webkitSpeechRecognition?: typeof webkitSpeechRecognition }).SpeechRecognition || (window as { webkitSpeechRecognition?: typeof webkitSpeechRecognition }).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      throw new Error('Speech recognition not available');
    }
    
    this.recognition = new SpeechRecognition();
    this.recognition.continuous = false;
    this.recognition.interimResults = false;
    this.recognition.lang = 'en-US';

    this.recognition.onstart = () => {
      this.isListening = true;
    };

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      this.handleUserInput(transcript);
    };

    this.recognition.onerror = () => {
      this.isListening = false;
    };

    this.recognition.onend = () => {
      this.isListening = false;
    };
  }

  private async startConversation(): Promise<void> {
    this.setState('welcome');
    const welcomeMessage = `Hey! I'm your AI assistant here at ${this.config.clinicName}. I'm basically like having a smart friend who can help you prep for your visit, answer questions, or just chat to help you feel more relaxed while you wait. Can you hear me okay?`;
    await this.speak(welcomeMessage);
  }

  private async handleUserInput(input: string): Promise<void> {
    this.addMessage('user', input);
    
    const response = this.getScriptedResponse(input);
    if (response) {
      await this.speak(response);
      this.updateState(input);
    }
  }

  private getScriptedResponse(userInput: string): string | null {
    const input = userInput.toLowerCase();

    switch (this.state) {
      case 'welcome':
        if (input.includes('yes') || input.includes('yeah') || input.includes('perfect') || input.includes('hear') || input.includes('good')) {
          return "Perfect! So here's the deal - I can be whatever you need right now. Want help preparing questions for your doctor? Need something explained? Or just want to chat to pass time? I'm doing a quick 5-minute study to show how AI can help patients. Want to give it a shot?";
        }
        return null;

      case 'explaining_study':
        if (input.includes('yes') || input.includes('sure') || input.includes('try') || input.includes('shot') || input.includes('sounds good')) {
          return "Quick question - which doctor are you seeing today? Helps me give you better tips!";
        }
        return null;

      case 'selecting_provider':
        // This will be handled by the UI component
        return null;

      case 'assistant_demo':
        // Use AI for dynamic responses in demo mode
        return null;

      default:
        return null;
    }
  }

  private updateState(userInput: string): void {
    const input = userInput.toLowerCase();

    switch (this.state) {
      case 'welcome':
        if (input.includes('yes') || input.includes('yeah') || input.includes('perfect') || input.includes('hear') || input.includes('good')) {
          this.setState('explaining_study');
        }
        break;

      case 'explaining_study':
        if (input.includes('yes') || input.includes('sure') || input.includes('try') || input.includes('shot') || input.includes('sounds good')) {
          this.setState('selecting_provider');
        }
        break;
    }
  }

  public async selectProvider(providerName: string): Promise<void> {
    this.selectedProvider = providerName;
    this.addMessage('user', `I'm here to see ${providerName}`);
    
    const confirmationMessage = `Perfect! ${providerName} - ready to see what I can do to help you get ready?`;
    await this.speak(confirmationMessage);
    this.setState('assistant_demo');
  }

  public async sendTextInput(text: string): Promise<void> {
    if (this.state === 'assistant_demo') {
      // Use AI for dynamic responses in demo mode
      await this.handleAIResponse(text);
    } else {
      // Use scripted responses for structured flow
      await this.handleUserInput(text);
    }
  }

  private async handleAIResponse(userInput: string): Promise<void> {
    this.addMessage('user', userInput);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            { 
              role: 'system', 
              content: `You are a helpful AI assistant at ${this.config.clinicName}. Keep responses SHORT - max 1-2 sentences. Be conversational and helpful. The user is seeing ${this.selectedProvider}. Help them prepare for their visit or answer their questions.`
            },
            ...this.messages.slice(-4).map(msg => ({
              role: msg.role === 'ai' ? 'assistant' : msg.role,
              content: msg.content
            })),
            { role: 'user', content: userInput }
          ],
          clinic: this.config.clinicSlug,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const responseText = data.message || data;
        await this.speak(responseText);
      }
    } catch (error) {
      console.error('AI response error:', error);
      await this.speak("I'm here to help! What would you like to know about your visit?");
    }
  }

  private async speak(text: string): Promise<void> {
    this.isSpeaking = true;
    this.addMessage('ai', text);

    if (!this.config.enableVoice) {
      this.isSpeaking = false;
      return;
    }

    try {
      const apiKey = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY;
      
      if (!apiKey || apiKey === 'your_elevenlabs_api_key_here') {
        await this.speakWithBrowser(text);
        return;
      }

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
            similarity_boost: 0.5
          }
        })
      });

      if (response.ok) {
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);

        return new Promise((resolve) => {
          audio.onended = () => {
            URL.revokeObjectURL(audioUrl);
            this.isSpeaking = false;
            resolve();
          };
          audio.play();
        });
      } else {
        await this.speakWithBrowser(text);
      }
    } catch (error) {
      console.error('Speech error:', error);
      await this.speakWithBrowser(text);
    }
  }

  private async speakWithBrowser(text: string): Promise<void> {
    return new Promise((resolve) => {
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9;
        utterance.pitch = 1.0;
        utterance.volume = 0.8;
        
        utterance.onend = () => {
          this.isSpeaking = false;
          resolve();
        };
        
        window.speechSynthesis.speak(utterance);
      } else {
        this.isSpeaking = false;
        resolve();
      }
    });
  }

  public startListening(): void {
    if (this.recognition && !this.isListening && !this.isSpeaking) {
      this.recognition.start();
    }
  }

  public stopListening(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
    }
  }

  private addMessage(role: 'ai' | 'user', content: string): void {
    const message: SimpleConversationMessage = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      role,
      content,
      timestamp: new Date()
    };
    
    this.messages.push(message);
    this.config.onConversationUpdate([...this.messages]);
  }

  private setState(newState: SimpleConversationState): void {
    console.log(`🔄 State transition: ${this.state} → ${newState}`);
    this.state = newState;
    this.config.onStateChange(newState);
  }

  public getCurrentState(): SimpleConversationState {
    return this.state;
  }

  public getMessages(): SimpleConversationMessage[] {
    return [...this.messages];
  }

  public isCurrentlyListening(): boolean {
    return this.isListening;
  }

  public isCurrentlySpeaking(): boolean {
    return this.isSpeaking;
  }

  public stop(): void {
    this.stopListening();
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }
}