// TTS Audio Generator Module
// Uses Web Speech API to generate and record audio for Anki cards

class TTSGenerator {
  constructor() {
    this.audioBlob = null;
    this.audioUrl = null;
    this.mediaRecorder = null;
    this.audioChunks = [];
  }

  // Generate audio using Web Speech API and record it
  async generateAudio(text, options = {}) {
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
      
      // Set up media recorder
      this.mediaRecorder = new MediaRecorder(destination.stream);
      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = async () => {
        this.audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        
        // Convert to base64 for AnkiConnect
        const base64Audio = await this.blobToBase64(this.audioBlob);
        
        // Create URL for preview
        if (this.audioUrl) {
          URL.revokeObjectURL(this.audioUrl);
        }
        this.audioUrl = URL.createObjectURL(this.audioBlob);
        
        resolve({
          blob: this.audioBlob,
          base64: base64Audio,
          url: this.audioUrl
        });
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
        this.mediaRecorder.start();
      };

      utterance.onend = () => {
        // Add a small delay to ensure all audio is captured
        setTimeout(() => {
          if (this.mediaRecorder.state === 'recording') {
            this.mediaRecorder.stop();
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

  // Clean up resources
  cleanup() {
    if (this.audioUrl) {
      URL.revokeObjectURL(this.audioUrl);
      this.audioUrl = null;
    }
    this.audioBlob = null;
    this.audioChunks = [];
  }
}

// Export for use in popup.js
window.TTSGenerator = TTSGenerator;
