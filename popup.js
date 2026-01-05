// Popup script for Vocabulary to Anki extension

let ttsGenerator = null;
let audioData = null;
let frontAudioData = null;
let backAudioData = null;

document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('vocab-form');
  const addBtn = document.getElementById('add-btn');
  const getSelectionBtn = document.getElementById('get-selection-btn');
  const getSelectionBtnExtended = document.getElementById('get-selection-btn-extended');
  const testConnectionBtn = document.getElementById('test-connection-btn');
  const generateTTSBtn = document.getElementById('generate-tts-btn');
  const playAudioBtn = document.getElementById('play-audio-btn');
  const statusMessage = document.getElementById('status-message');
  const audioStatus = document.getElementById('audio-status');
  const ankiUrlInput = document.getElementById('anki-url');
  const noteTypeSelect = document.getElementById('note-type');
  
  // Extended fields elements
  const extendedFields = document.getElementById('extended-fields');
  const generateFrontAudioBtn = document.getElementById('generate-front-audio-btn');
  const playFrontAudioBtn = document.getElementById('play-front-audio-btn');
  const generateBackAudioBtn = document.getElementById('generate-back-audio-btn');
  const playBackAudioBtn = document.getElementById('play-back-audio-btn');
  const frontAudioStatus = document.getElementById('front-audio-status');
  const backAudioStatus = document.getElementById('back-audio-status');
  
  // Initialize TTS Generator
  ttsGenerator = new TTSGenerator();
  
  // Toggle extended fields visibility based on note type
  noteTypeSelect.addEventListener('change', function() {
    const isExtended = noteTypeSelect.value === 'Basic Quizlet Extended';
    extendedFields.style.display = isExtended ? 'block' : 'none';
    
    // Get the form fields
    const wordField = document.getElementById('word');
    const translationField = document.getElementById('translation');
    const frontTextField = document.getElementById('front-text');
    const backTextField = document.getElementById('back-text');
    
    // Toggle required attributes based on note type
    if (isExtended) {
      // Remove required from Basic fields
      wordField.removeAttribute('required');
      translationField.removeAttribute('required');
      // Add required to Extended fields
      frontTextField.setAttribute('required', 'required');
      backTextField.setAttribute('required', 'required');
    } else {
      // Add required to Basic fields
      wordField.setAttribute('required', 'required');
      translationField.setAttribute('required', 'required');
      // Remove required from Extended fields
      frontTextField.removeAttribute('required');
      backTextField.removeAttribute('required');
    }
    
    // Show/hide original fields based on note type
    const originalFields = ['word', 'pronunciation', 'translation', 'context'].map(id => 
      document.getElementById(id).closest('.form-group')
    );
    originalFields.forEach(field => {
      field.style.display = isExtended ? 'none' : 'block';
    });
    
    // Show/hide original audio controls
    if (generateTTSBtn.closest('.form-group')) {
      generateTTSBtn.closest('.form-group').style.display = isExtended ? 'none' : 'block';
    }
  });
  
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
      // Trigger change event to show/hide fields
      noteTypeSelect.dispatchEvent(new Event('change'));
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
  
  // Generate Front Audio for Extended format
  generateFrontAudioBtn.addEventListener('click', async function() {
    const frontText = document.getElementById('front-text').value.trim();
    
    if (!frontText) {
      showFrontAudioStatus('Please enter front text first', 'error');
      return;
    }
    
    showFrontAudioStatus('Generating audio...', 'info');
    generateFrontAudioBtn.disabled = true;
    
    try {
      const lang = detectLanguage(frontText);
      const tempGen = new TTSGenerator();
      frontAudioData = await tempGen.generateAudio(frontText, {
        lang: lang,
        rate: 0.9,
        pitch: 1
      });
      
      showFrontAudioStatus('\u2713 Audio generated!', 'success');
      playFrontAudioBtn.style.display = 'inline-block';
      document.getElementById('front-audio').value = frontText;
      
    } catch (error) {
      showFrontAudioStatus('Error: ' + error.message, 'error');
      console.error('TTS Error:', error);
    } finally {
      generateFrontAudioBtn.disabled = false;
    }
  });
  
  // Play Front Audio
  playFrontAudioBtn.addEventListener('click', async function() {
    if (!frontAudioData) {
      showFrontAudioStatus('No audio available', 'error');
      return;
    }
    
    try {
      const tempGen = new TTSGenerator();
      const blob = base64ToBlob(frontAudioData.base64, 'audio/mpeg');
      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);
      await audio.play();
      showFrontAudioStatus('Playing...', 'info');
    } catch (error) {
      showFrontAudioStatus('Playback error', 'error');
    }
  });
  
  // Generate Back Audio for Extended format
  generateBackAudioBtn.addEventListener('click', async function() {
    const backText = document.getElementById('back-text').value.trim();
    
    if (!backText) {
      showBackAudioStatus('Please enter back text first', 'error');
      return;
    }
    
    showBackAudioStatus('Generating audio...', 'info');
    generateBackAudioBtn.disabled = true;
    
    try {
      const lang = detectLanguage(backText);
      const tempGen = new TTSGenerator();
      backAudioData = await tempGen.generateAudio(backText, {
        lang: lang,
        rate: 0.9,
        pitch: 1
      });
      
      showBackAudioStatus('\u2713 Audio generated!', 'success');
      playBackAudioBtn.style.display = 'inline-block';
      document.getElementById('back-audio').value = backText;
      
    } catch (error) {
      showBackAudioStatus('Error: ' + error.message, 'error');
      console.error('TTS Error:', error);
    } finally {
      generateBackAudioBtn.disabled = false;
    }
  });
  
  // Play Back Audio
  playBackAudioBtn.addEventListener('click', async function() {
    if (!backAudioData) {
      showBackAudioStatus('No audio available', 'error');
      return;
    }
    
    try {
      const tempGen = new TTSGenerator();
      const blob = base64ToBlob(backAudioData.base64, 'audio/mpeg');
      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);
      await audio.play();
      showBackAudioStatus('Playing...', 'info');
    } catch (error) {
      showBackAudioStatus('Playback error', 'error');
    }
  });
  
  // Get selected text from the active tab
  const getSelectedTextHandler = async function() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => window.getSelection().toString()
      }, (results) => {
        if (results && results[0] && results[0].result) {
          const selectedText = results[0].result.trim();
          const noteType = noteTypeSelect.value;
          
          // Populate appropriate field based on note type
          if (noteType === 'Basic Quizlet Extended') {
            document.getElementById('front-text').value = selectedText;
          } else {
            document.getElementById('word').value = selectedText;
          }
          
          showStatus('Selected text captured!', 'success');
        } else {
          showStatus('No text selected', 'error');
        }
      });
    } catch (error) {
      showStatus('Error getting selection: ' + error.message, 'error');
    }
  };
  
  getSelectionBtn.addEventListener('click', getSelectedTextHandler);
  getSelectionBtnExtended.addEventListener('click', getSelectedTextHandler);
  
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
    
    const noteType = noteTypeSelect.value;
    const deck = document.getElementById('deck').value.trim();
    const ankiUrl = ankiUrlInput.value;
    
    // Handle Basic Quizlet Extended separately
    if (noteType === 'Basic Quizlet Extended') {
      await handleExtendedCardSubmit(deck, ankiUrl);
      return;
    }
    
    // Original card handling
    const word = document.getElementById('word').value.trim();
    const pronunciation = document.getElementById('pronunciation').value.trim();
    const translation = document.getElementById('translation').value.trim();
    const context = document.getElementById('context').value.trim();
    
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
        const format = audioData.format || 'mp3';
        audioFileName = `vocab_${word.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}.${format}`;
        
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
          // Continue even if media upload has issues
        } else {
          showStatus('Audio uploaded successfully', 'info');
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
  
  function showFrontAudioStatus(message, type) {
    frontAudioStatus.textContent = message;
    frontAudioStatus.className = 'audio-status ' + type;
  }
  
  function showBackAudioStatus(message, type) {
    backAudioStatus.textContent = message;
    backAudioStatus.className = 'audio-status ' + type;
  }
  
  // Handle Extended Card Format submission
  async function handleExtendedCardSubmit(deck, ankiUrl) {
    const frontText = document.getElementById('front-text').value.trim();
    const backText = document.getElementById('back-text').value.trim();
    const imageUrl = document.getElementById('image-url').value.trim();
    const addReverse = document.getElementById('add-reverse').checked;
    const tagsInput = document.getElementById('tags-input').value.trim();
    
    if (!frontText || !backText) {
      showStatus('Please fill in front text and back text', 'error');
      return;
    }
    
    showStatus('Adding to Anki...', 'info');
    addBtn.disabled = true;
    
    // Save preferences
    chrome.storage.sync.set({ deckName: deck, ankiUrl: ankiUrl, noteType: 'Basic Quizlet Extended' });
    
    try {
      let frontAudioFileName = null;
      let backAudioFileName = null;
      
      // Upload front audio if generated
      if (frontAudioData && frontAudioData.base64) {
        const timestamp = Date.now();
        const format = frontAudioData.format || 'mp3';
        frontAudioFileName = `front_audio_${timestamp}.${format}`;
        
        showStatus('Uploading front audio...', 'info');
        
        const storeMediaResponse = await fetch(ankiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'storeMediaFile',
            version: 6,
            params: {
              filename: frontAudioFileName,
              data: frontAudioData.base64
            }
          })
        });
        
        const mediaResult = await storeMediaResponse.json();
        if (mediaResult.error) {
          console.warn('Front audio upload warning:', mediaResult.error);
        }
      }
      
      // Upload back audio if generated
      if (backAudioData && backAudioData.base64) {
        const timestamp = Date.now();
        const format = backAudioData.format || 'mp3';
        backAudioFileName = `back_audio_${timestamp}.${format}`;
        
        showStatus('Uploading back audio...', 'info');
        
        const storeMediaResponse = await fetch(ankiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'storeMediaFile',
            version: 6,
            params: {
              filename: backAudioFileName,
              data: backAudioData.base64
            }
          })
        });
        
        const mediaResult = await storeMediaResponse.json();
        if (mediaResult.error) {
          console.warn('Back audio upload warning:', mediaResult.error);
        }
      }
      
      // Build the note fields
      let frontHTML = frontText;
      if (frontAudioFileName) {
        frontHTML += `<br>[sound:${frontAudioFileName}]`;
      }
      
      let backHTML = backText;
      if (backAudioFileName) {
        backHTML += `<br>[sound:${backAudioFileName}]`;
      }
      
      // Add image if provided
      let imageHTML = '';
      if (imageUrl) {
        imageHTML = `<img src=\"${imageUrl}\">`;
      }
      
      // Parse tags
      const tags = tagsInput ? tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag) : [];
      tags.push('chrome-extension', 'quizlet-extended');
      
      // Create the note fields object - match Anki's field names exactly
      const noteFields = {
        FrontText: frontText,
        FrontAudio: frontAudioFileName ? `[sound:${frontAudioFileName}]` : '',
        BackText: backText,
        BackAudio: backAudioFileName ? `[sound:${backAudioFileName}]` : '',
        Tags: tagsInput || ''
      };
      
      const response = await fetch(ankiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'addNote',
          version: 6,
          params: {
            note: {
              deckName: deck,
              modelName: 'Basic Quizlet Extended',
              fields: noteFields,
              options: {
                allowDuplicate: false
              },
              tags: tags
            }
          }
        })
      });
      
      const data = await response.json();
      
      if (data.result) {
        showStatus('\u2713 Successfully added to Anki!', 'success');
        // Clear form
        document.getElementById('front-text').value = '';
        document.getElementById('front-audio').value = '';
        document.getElementById('back-text').value = '';
        document.getElementById('back-audio').value = '';
        document.getElementById('image-url').value = '';
        document.getElementById('add-reverse').checked = false;
        document.getElementById('tags-input').value = '';
        playFrontAudioBtn.style.display = 'none';
        playBackAudioBtn.style.display = 'none';
        frontAudioData = null;
        backAudioData = null;
        showFrontAudioStatus('', '');
        showBackAudioStatus('', '');
        
        // Auto-close popup after 1.5 seconds
        setTimeout(() => window.close(), 1500);
      } else {
        showStatus('\u2717 Error: ' + (data.error || 'Failed to add note'), 'error');
      }
    } catch (error) {
      showStatus('\u2717 Connection error. Make sure Anki is running.', 'error');
      console.error('Anki error:', error);
    } finally {
      addBtn.disabled = false;
    }
  }
  
  // Helper function to convert base64 to blob
  function base64ToBlob(base64, mimeType) {
    const byteCharacters = atob(base64);
    const byteArrays = [];
    
    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
      const slice = byteCharacters.slice(offset, offset + 512);
      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }
    
    return new Blob(byteArrays, { type: mimeType });
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
