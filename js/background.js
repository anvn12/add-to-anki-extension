// Background service worker for Vocabulary to Anki extension

// Create context menu on installation
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'addToAnki',
    title: 'Add "%s" to Anki',
    contexts: ['selection']
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'addToAnki') {
    const selectedText = info.selectionText;
    
    // Store the selected text for the popup to retrieve
    await chrome.storage.local.set({ 
      pendingWord: selectedText,
      timestamp: Date.now()
    });
    
    // Open the popup programmatically
    chrome.action.openPopup();
  }
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getPendingWord') {
    chrome.storage.local.get(['pendingWord', 'timestamp'], (result) => {
      // Clear pending word after retrieval
      chrome.storage.local.remove(['pendingWord', 'timestamp']);
      sendResponse({ word: result.pendingWord || '' });
    });
    return true; // Will respond asynchronously
  }
  
  if (request.action === 'addToAnki') {
    addNoteToAnki(request.data)
      .then(result => sendResponse({ success: true, result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Will respond asynchronously
  }
});

// Function to add note to Anki via AnkiConnect
async function addNoteToAnki(noteData) {
  const ankiUrl = noteData.ankiUrl || 'http://127.0.0.1:8765';
  const noteType = noteData.noteType || 'Basic';
  
  let frontHTML = noteData.word;
  
  // Add pronunciation if provided
  if (noteData.pronunciation) {
    frontHTML += `<br><span style="color: #666; font-size: 0.9em;">${noteData.pronunciation}</span>`;
  }
  
  let backHTML = noteData.translation;
  if (noteData.context) {
    backHTML += '<br><br><i>Context: ' + noteData.context + '</i>';
  }
  
  const response = await fetch(ankiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'addNote',
      version: 6,
      params: {
        note: {
          deckName: noteData.deck || 'Default',
          modelName: noteType,
          fields: {
            Front: frontHTML,
            Back: backHTML
          },
          options: {
            allowDuplicate: false
          },
          tags: ['vocabulary', 'chrome-extension']
        }
      }
    })
  });
  
  const data = await response.json();
  
  if (data.error) {
    throw new Error(data.error);
  }
  
  return data.result;
}

// Check AnkiConnect connection on startup
chrome.runtime.onStartup.addListener(async () => {
  console.log('Vocabulary to Anki extension started');
});
