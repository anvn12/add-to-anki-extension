// Popup script for Vocabulary to Anki extension

let ttsGenerator = null;
let audioData = null;

document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('vocab-form');
  const addBtn = document.getElementById('add-btn');
  const getSelectionBtn = document.getElementById('get-selection-btn');
  const testConnectionBtn = document.getElementById('test-connection-btn');
  const generateTTSBtn = document.getElementById('generate-tts-btn');
  const playAudioBtn = document.getElementById('play-audio-btn');
  const statusMessage = document.getElementById('status-message');
  const audioStatus = document.getElementById('audio-status');
  const ankiUrlInput = document.getElementById('anki-url');
  const noteTypeSelect = document.getElementById('note-type');
  
  // Initialize TTS Generator
  ttsGenerator = new TTSGenerator();
  
  // Load saved settings
  chrome.storage.sync.get(['ankiUrl', 'deckName', 'noteType'], function(result) {
    if (result.ankiUrl) {
      ankiUrlInput.value = result.ankiUrl;
    }
    if (result.deckName) {
      document.getElementById('deck').value = result.deckName;
    }
    if (result.noteType) {
      noteTypeSelect.value = result.noteType;
    }
  });
  
  // Generate TTS audio
  generateTTSBtn.addEventListener('click', async function() {
    const word = document.getElementById('word').value.trim();
    
    if (!word) {
      showAudioStatus('Please enter a word first', 'error');
      return;
    }
    
    showAudioStatus('Generating audio...', 'info');
    generateTTSBtn.disabled = true;
    
    try {
      // Detect language (simple heuristic)
      const lang = detectLanguage(word);
      
      audioData = await ttsGenerator.generateAudio(word, {
        lang: lang,
        rate: 0.9,
        pitch: 1
      });
      
      showAudioStatus('✓ Audio generated!', 'success');
      playAudioBtn.style.display = 'inline-block';
      
    } catch (error) {
      showAudioStatus('Error: ' + error.message, 'error');
      console.error('TTS Error:', error);
    } finally {
      generateTTSBtn.disabled = false;
    }
  });
  
  // Play generated audio
  playAudioBtn.addEventListener('click', async function() {
    if (!audioData) {
      showAudioStatus('No audio available', 'error');
      return;
    }
    
    try {
      await ttsGenerator.playAudio();
      showAudioStatus('Playing...', 'info');
    } catch (error) {
      showAudioStatus('Playback error', 'error');
    }
  });
  
  // Get selected text from the active tab
  getSelectionBtn.addEventListener('click', async function() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => window.getSelection().toString()
      }, (results) => {
        if (results && results[0] && results[0].result) {
          document.getElementById('word').value = results[0].result.trim();
          showStatus('Selected text captured!', 'success');
        } else {
          showStatus('No text selected', 'error');
        }
      });
    } catch (error) {
      showStatus('Error getting selection: ' + error.message, 'error');
    }
  });
  
  // Test AnkiConnect connection
  testConnectionBtn.addEventListener('click', async function() {
    const ankiUrl = ankiUrlInput.value;
    showStatus('Testing connection...', 'info');
    
    try {
      const response = await fetch(ankiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'version',
          version: 6
        })
      });
      
      const data = await response.json();
      if (data.result) {
        showStatus('✓ Connected to AnkiConnect (v' + data.result + ')', 'success');
        chrome.storage.sync.set({ ankiUrl: ankiUrl });
      } else {
        showStatus('Error: ' + (data.error || 'Unknown error'), 'error');
      }
    } catch (error) {
      showStatus('✗ Connection failed. Make sure Anki is running with AnkiConnect addon.', 'error');
    }
  });
  
  // Submit form to add card to Anki
  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const word = document.getElementById('word').value.trim();
    const pronunciation = document.getElementById('pronunciation').value.trim();
    const translation = document.getElementById('translation').value.trim();
    const context = document.getElementById('context').value.trim();
    const deck = document.getElementById('deck').value.trim();
    const noteType = noteTypeSelect.value;
    const ankiUrl = ankiUrlInput.value;
    
    if (!word || !translation) {
      showStatus('Please fill in word and translation', 'error');
      return;
    }
    
    showStatus('Adding to Anki...', 'info');
    addBtn.disabled = true;
    
    // Save preferences
    chrome.storage.sync.set({ deckName: deck, ankiUrl: ankiUrl, noteType: noteType });
    
    try {
      let audioFileName = null;
      
      // Upload audio to Anki if generated
      if (audioData && audioData.base64) {
        const timestamp = Date.now();
        audioFileName = `vocab_${word.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}.webm`;
        
        showStatus('Uploading audio...', 'info');
        
        const storeMediaResponse = await fetch(ankiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'storeMediaFile',
            version: 6,
            params: {
              filename: audioFileName,
              data: audioData.base64
            }
          })
        });
        
        const mediaResult = await storeMediaResponse.json();
        if (mediaResult.error) {
          console.warn('Media upload warning:', mediaResult.error);
        }
      }
      
      // Build the note fields
      let frontHTML = word;
      
      // Add pronunciation if provided
      if (pronunciation) {
        frontHTML += `<br><span style="color: #666; font-size: 0.9em;">${pronunciation}</span>`;
      }
      
      // Add audio if generated
      if (audioFileName) {
        frontHTML += `<br>[sound:${audioFileName}]`;
      }
      
      let backHTML = translation;
      
      if (context) {
        backHTML += '<br><br><i>Context: ' + context + '</i>';
      }
      
      const response = await fetch(ankiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'addNote',
          version: 6,
          params: {
            note: {
              deckName: deck,
              modelName: noteType,
              fields: {
                Front: frontHTML,
                Back: backHTML
              },
              options: {
                allowDuplicate: false
              },
              tags: ['vocabulary', 'chrome-extension', 'tts']
            }
          }
        })
      });
      
      const data = await response.json();
      
      if (data.result) {
        showStatus('✓ Successfully added to Anki!', 'success');
        // Clear form
        document.getElementById('word').value = '';
        document.getElementById('pronunciation').value = '';
        document.getElementById('translation').value = '';
        document.getElementById('context').value = '';
        playAudioBtn.style.display = 'none';
        audioData = null;
        ttsGenerator.cleanup();
        showAudioStatus('', '');
        
        // Auto-close popup after 1.5 seconds
        setTimeout(() => window.close(), 1500);
      } else {
        showStatus('✗ Error: ' + (data.error || 'Failed to add note'), 'error');
      }
    } catch (error) {
      showStatus('✗ Connection error. Make sure Anki is running.', 'error');
      console.error('Anki error:', error);
    } finally {
      addBtn.disabled = false;
    }
  });
  
  function showStatus(message, type) {
    statusMessage.textContent = message;
    statusMessage.className = 'status-message ' + type;
    statusMessage.style.display = 'block';
    
    if (type === 'success') {
      setTimeout(() => {
        statusMessage.style.display = 'none';
      }, 3000);
    }
  }
  
  function showAudioStatus(message, type) {
    audioStatus.textContent = message;
    audioStatus.className = 'audio-status ' + type;
  }
  
  // Simple language detection based on character ranges
  function detectLanguage(text) {
    // Check for common languages
    if (/[\u4e00-\u9fa5]/.test(text)) return 'zh-CN'; // Chinese
    if (/[\u3040-\u309f\u30a0-\u30ff]/.test(text)) return 'ja-JP'; // Japanese
    if (/[\uac00-\ud7af]/.test(text)) return 'ko-KR'; // Korean
    if (/[\u0600-\u06ff]/.test(text)) return 'ar-SA'; // Arabic
    if (/[\u0400-\u04ff]/.test(text)) return 'ru-RU'; // Russian
    if (/[àâäçéèêëïîôùûü]/.test(text)) return 'fr-FR'; // French
    if (/[áéíñóúü¡¿]/.test(text)) return 'es-ES'; // Spanish
    if (/[äöüß]/.test(text)) return 'de-DE'; // German
    
    return 'en-US'; // Default to English
  }
});
