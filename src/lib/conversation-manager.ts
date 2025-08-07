export interface ConversationConfig {
  clinicSlug: string;
  clinicName?: string;
  phase: 'welcome' | 'chat' | 'feedback' | 'complete';
  onPhaseChange: (phase: 'welcome' | 'chat' | 'feedback' | 'complete') => void;
  onTranscript: (text: string, isUser: boolean) => void;
  onError: (error: string) => void;
}

export class ConversationManager {
  private config: ConversationConfig;
  private isConnected = false;
  private audioContext: AudioContext | null = null;

  constructor(config: ConversationConfig) {
    this.config = config;
  }

  async initialize(): Promise<boolean> {
    try {
      // Check if ElevenLabs API key is available
      const apiKey = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY || process.env.ELEVENLABS_API_KEY;
      if (!apiKey || apiKey === 'your_elevenlabs_api_key_here') {
        throw new Error('ElevenLabs API key not configured');
      }

      // Initialize audio context
      this.audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      
      // Resume audio context if suspended (required for some browsers)
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
      
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });

      return true;
    } catch (error) {
      console.error('Failed to initialize conversation:', error);
      this.config.onError(`Failed to initialize voice: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  }

  async startConversation(): Promise<void> {
    if (this.isConnected) return;

    try {
      const apiKey = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY || process.env.ELEVENLABS_API_KEY;
      if (!apiKey) throw new Error('API key not found');

      // For now, we'll use a simple approach with the standard ElevenLabs SDK
      // In production, you'd use the Conversational AI API
      this.isConnected = true;
      
      // Start with the welcome message based on current phase
      await this.handlePhaseTransition(this.config.phase);
      
    } catch (error) {
      console.error('Failed to start conversation:', error);
      this.config.onError(`Failed to start conversation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async handlePhaseTransition(phase: 'welcome' | 'chat' | 'feedback' | 'complete'): Promise<void> {
    const messages = this.getPhaseScript(phase);
    
    console.log(`🎭 Starting ${phase} phase with ${messages.length} messages`);
    
    // For MVP, we'll use text-to-speech for AI responses
    // In full implementation, this would be replaced with ElevenLabs Conversational AI
    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];
      console.log(`🗣️ AI speaking message ${i + 1}/${messages.length}:`, message.substring(0, 50) + '...');
      
      this.config.onTranscript(message, false); // false = AI speaking
      await this.speak(message);
      
      // Add a small pause between messages
      if (i < messages.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    console.log(`✅ Finished ${phase} phase - AI ready to listen`);
    
    // Explicitly signal that AI has finished speaking
    this.config.onTranscript('[AI finished speaking - ready for response]', false);
  }

  private getPhaseScript(phase: 'welcome' | 'chat' | 'feedback' | 'complete'): string[] {
    const clinicName = this.config.clinicName || 'the clinic';
    
    switch (phase) {
      case 'welcome':
        return [
          `Hi there! Welcome to ${clinicName}. I'm an AI assistant, and you're about to be part of something really exciting.`,
          "We're conducting a study to see how AI can help patients prepare for their appointments. This is completely optional, and I'll explain everything as we go.",
          "Can you hear me clearly? If you'd like to continue, just say 'yes' or click the continue button."
        ];
      
      case 'chat':
        return [
          "Great! Now I'm going to help you think through questions for your doctor and understand how I might be able to help patients like you.",
          "Feel free to ask me anything about your visit, your symptoms, or just chat with me about your health concerns.",
          "What brings you to the clinic today?"
        ];
      
      case 'feedback':
        return [
          "That was awesome! Now I'd love to hear your thoughts.",
          "How was talking with me? Do you think this kind of AI assistant could be helpful for you or other patients?",
          "Feel free to share any feedback - I'm here to listen!"
        ];
      
      case 'complete':
        return [
          "Thank you so much for being part of this study! Your feedback is going to help us make healthcare better for everyone.",
          "Now you can continue with your normal check-in process. Your doctor will be really impressed that you tried this out!"
        ];
      
      default:
        return ["Hello! I'm your AI assistant."];
    }
  }

  private async speak(text: string): Promise<void> {
    try {
      const apiKey = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY;
      console.log('🎤 ElevenLabs API Key available:', !!apiKey && apiKey !== 'your_elevenlabs_api_key_here');
      
      if (!apiKey || apiKey === 'your_elevenlabs_api_key_here') {
        console.log('⚠️ Using browser speech synthesis fallback');
        return this.speakWithBrowser(text);
      }

      console.log('🔊 Using ElevenLabs TTS for:', text.substring(0, 50) + '...');

      // Use ElevenLabs Text-to-Speech
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

      if (!response.ok) {
        console.error('ElevenLabs API error:', response.status);
        return this.speakWithBrowser(text);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);

      return new Promise((resolve, reject) => {
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          resolve();
        };
        audio.onerror = (error) => {
          URL.revokeObjectURL(audioUrl);
          console.error('Audio playback error:', error);
          this.speakWithBrowser(text).then(resolve).catch(reject);
        };
        audio.play().catch(error => {
          console.error('Audio play error:', error);
          this.speakWithBrowser(text).then(resolve).catch(reject);
        });
      });

    } catch (error) {
      console.error('ElevenLabs speak error:', error);
      return this.speakWithBrowser(text);
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
        // Fallback - just resolve immediately
        resolve();
      }
    });
  }

  async listen(): Promise<string> {
    console.log('🎤 Starting speech recognition...');
    return new Promise((resolve, reject) => {
      if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        console.error('❌ Speech recognition not supported');
        reject(new Error('Speech recognition not supported. Please use Chrome or Edge browser.'));
        return;
      }

      const SpeechRecognition = (window as unknown as { SpeechRecognition?: typeof webkitSpeechRecognition; webkitSpeechRecognition?: typeof webkitSpeechRecognition }).SpeechRecognition || (window as unknown as { webkitSpeechRecognition?: typeof webkitSpeechRecognition }).webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        reject(new Error('Speech recognition not available'));
        return;
      }
      
      const recognition = new SpeechRecognition();
      
      recognition.continuous = false;
      recognition.interimResults = true; // Allow interim results for better feedback
      recognition.lang = 'en-US';

      let finalTranscript = '';
      let timeoutId: NodeJS.Timeout | null = null;

      // Set a timeout to prevent hanging
      timeoutId = setTimeout(() => {
        recognition.stop();
        if (finalTranscript) {
          resolve(finalTranscript);
        } else {
          reject(new Error('No speech detected. Please try speaking louder or closer to the microphone.'));
        }
      }, 8000); // 8 second timeout

      recognition.onstart = () => {
        console.log('Speech recognition started');
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        // Show interim results for user feedback
        if (interimTranscript) {
          this.config.onTranscript(`[Listening...] ${interimTranscript}`, true);
        }

        if (finalTranscript) {
          if (timeoutId) clearTimeout(timeoutId);
          this.config.onTranscript(finalTranscript, true); // true = user speaking
          resolve(finalTranscript);
        }
      };

      recognition.onerror = (error: SpeechRecognitionErrorEvent) => {
        if (timeoutId) clearTimeout(timeoutId);
        console.error('Speech recognition error:', error.error);
        
        let errorMessage = 'Speech recognition failed';
        switch (error.error) {
          case 'no-speech':
            errorMessage = 'No speech detected. Please try again and speak clearly.';
            break;
          case 'audio-capture':
            errorMessage = 'Microphone not accessible. Please check your microphone permissions.';
            break;
          case 'not-allowed':
            errorMessage = 'Microphone access denied. Please allow microphone access and try again.';
            break;
          case 'network':
            errorMessage = 'Network error. Please check your internet connection.';
            break;
        }
        
        reject(new Error(errorMessage));
      };

      recognition.onend = () => {
        console.log('Speech recognition ended');
        if (!finalTranscript) {
          if (timeoutId) clearTimeout(timeoutId);
          reject(new Error('No speech was recognized. Please try again.'));
        }
      };

      recognition.start();
    });
  }

  stop(): void {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    this.isConnected = false;
  }

  isActive(): boolean {
    return this.isConnected;
  }
}