// TTS Audio Generator Module
// Uses Google Cloud TTS API or Web Speech API for Anki cards

class TTSGenerator {
  constructor() {
    this.audioBlob = null;
    this.audioUrl = null;
    this.audioData = null;
  }

  // Generate audio using Google Cloud TTS (public endpoint) with fallback to Web Speech API
  async generateAudio(text, options = {}) {
    const {
      lang = 'en-US',
      rate = 0.9,
      pitch = 1,
      voice = null
    } = options;

    // Try Google Cloud TTS first (better quality and MP3 output)
    try {
      return await this.generateGoogleTTS(text, lang);
    } catch (error) {
      console.log('Google TTS failed, falling back to Web Speech API:', error);
      // Fallback to recording Web Speech API
      return await this.generateWebSpeechAudio(text, { lang, rate, pitch, voice });
    }
  }

  // Generate audio using Google Cloud TTS (free public translate API)
  async generateGoogleTTS(text, lang) {
    // Map common language codes to Google TTS codes
    const langMap = {
      'en-US': 'en', 'en-GB': 'en', 'en': 'en',
      'zh-CN': 'zh-CN', 'zh': 'zh-CN',
      'ja-JP': 'ja', 'ja': 'ja',
      'ko-KR': 'ko', 'ko': 'ko',
      'fr-FR': 'fr', 'fr': 'fr',
      'es-ES': 'es', 'es': 'es',
      'de-DE': 'de', 'de': 'de',
      'ru-RU': 'ru', 'ru': 'ru',
      'ar-SA': 'ar', 'ar': 'ar'
    };
    
    const ttsLang = langMap[lang] || lang.split('-')[0];
    
    // Use Google Translate TTS endpoint (free, no API key needed)
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${ttsLang}&q=${encodeURIComponent(text)}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Google TTS request failed');
    }
    
    this.audioBlob = await response.blob();
    
    // Convert to base64 for AnkiConnect
    const base64Audio = await this.blobToBase64(this.audioBlob);
    
    // Create URL for preview
    if (this.audioUrl) {
      URL.revokeObjectURL(this.audioUrl);
    }
    this.audioUrl = URL.createObjectURL(this.audioBlob);
    
    this.audioData = {
      blob: this.audioBlob,
      base64: base64Audio,
      url: this.audioUrl,
      format: 'mp3'
    };
    
    return this.audioData;
  }

  // Fallback: Generate audio using Web Speech API and record it
  async generateWebSpeechAudio(text, options = {}) {
    const {
      lang = 'en-US',
      rate = 0.9,
      pitch = 1,
      voice = null
    } = options;

    return new Promise((resolve, reject) => {
      // Check if Speech Synthesis is supported
      if (!('speechSynthesis' in window)) {
        reject(new Error('Speech Synthesis not supported in this browser'));
        return;
      }

      // Create AudioContext for recording
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const destination = audioContext.createMediaStreamDestination();
      
      // Set up media recorder with better codec support
      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/webm';
      }
      
      const mediaRecorder = new MediaRecorder(destination.stream, { mimeType });
      const audioChunks = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        this.audioBlob = new Blob(audioChunks, { type: mimeType });
        
        // Convert to base64 for AnkiConnect
        const base64Audio = await this.blobToBase64(this.audioBlob);
        
        // Create URL for preview
        if (this.audioUrl) {
          URL.revokeObjectURL(this.audioUrl);
        }
        this.audioUrl = URL.createObjectURL(this.audioBlob);
        
        this.audioData = {
          blob: this.audioBlob,
          base64: base64Audio,
          url: this.audioUrl,
          format: 'webm'
        };
        
        resolve(this.audioData);
      };

      // Create speech utterance
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = rate;
      utterance.pitch = pitch;

      // Get available voices and set preferred voice
      const voices = speechSynthesis.getVoices();
      if (voice) {
        const selectedVoice = voices.find(v => v.name === voice);
        if (selectedVoice) {
          utterance.voice = selectedVoice;
        }
      } else {
        // Select best voice for language
        const preferredVoice = voices.find(v => v.lang === lang && v.default) ||
                              voices.find(v => v.lang === lang) ||
                              voices.find(v => v.lang.startsWith(lang.split('-')[0]));
        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }
      }

      utterance.onstart = () => {
        mediaRecorder.start();
      };

      utterance.onend = () => {
        // Add a small delay to ensure all audio is captured
        setTimeout(() => {
          if (mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
          }
        }, 100);
      };

      utterance.onerror = (event) => {
        reject(new Error(`Speech synthesis error: ${event.error}`));
      };

      // Speak the text
      speechSynthesis.speak(utterance);
    });
  }

  // Convert blob to base64
  async blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        // Remove data URL prefix
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  // Play the generated audio
  playAudio() {
    if (!this.audioUrl) {
      throw new Error('No audio generated yet');
    }
    
    const audio = new Audio(this.audioUrl);
    return audio.play();
  }

  // Get available voices
  getAvailableVoices() {
    return new Promise((resolve) => {
      let voices = speechSynthesis.getVoices();
      
      if (voices.length > 0) {
        resolve(voices);
      } else {
        // Voices may load asynchronously
        speechSynthesis.onvoiceschanged = () => {
          voices = speechSynthesis.getVoices();
          resolve(voices);
        };
      }
    });
  }

  // Get the current audio data
  getAudioData() {
    return this.audioData;
  }

  // Clean up resources
  cleanup() {
    if (this.audioUrl) {
      URL.revokeObjectURL(this.audioUrl);
      this.audioUrl = null;
    }
    this.audioBlob = null;
    this.audioData = null;
  }
}

// Export for use in popup.js
window.TTSGenerator = TTSGenerator;
