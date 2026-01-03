# Vocabulary to Anki Chrome Extension

A Chrome extension that allows you to quickly add vocabulary words to Anki flashcards.

## Features

- 🎯 **Right-click context menu** - Select any text on a webpage and add it to Anki via context menu
- 📝 **Quick popup interface** - Add words with translations and context
- 🔊 **Text-to-Speech (TTS)** - Generate high-quality pronunciation audio using Google TTS with MP3 format
- 🎵 **Audio playback** - Preview generated audio before adding to Anki
- 🗂️ **Multiple note types** - Support for Basic, Basic (and reversed card), and Basic (type in the answer)
- 🔄 **AnkiConnect integration** - Seamlessly communicates with Anki desktop app
- 💾 **Remembers preferences** - Saves your deck name, note type, and AnkiConnect URL
- 🌍 **Multi-language support** - Automatic language detection for TTS (English, Chinese, Japanese, Korean, Spanish, French, German, Russian, Arabic)
- ✨ **Modern UI** - Clean, gradient-styled interface

## Prerequisites

1. **Anki Desktop** - Download from [ankiweb.net](https://apps.ankiweb.net/)
2. **AnkiConnect Add-on** - Install from Anki:
   - Open Anki
   - Go to Tools → Add-ons → Get Add-ons
   - Enter code: `2055492159`
   - Restart Anki

## Installation

1. Download or clone this extension
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top right)
4. Click "Load unpacked"
5. Select the extension folder
6. Make sure Anki is running with AnkiConnect

## Usage

### Method 1: Context Menu
1. Select any text on a webpage
2. Right-click and choose "Add to Anki"
3. Fill in the translation/definition
4. Click "Add to Anki"

### Method 2: Extension Popup
1. Click the extension icon
2. Enter word/phrase
3. (Optional) Add pronunciation notation (IPA, etc.)
4. **Click "🔊 Generate Audio" to create pronunciation audio**
5. **Click "▶️ Play" to preview the audio**
6. Add translation/definition
7. (Optional) Add context/example sentence
8. Select your Anki deck and note type
9. Click "Add to Anki"

### Method 3: Selected Text Button
1. Select text on any webpage
2. Click the extension icon
3. Click "Get Selected Text" button
4. Fill in translation and click "Add to Anki"

## Settings

- **AnkiConnect URL**: Default is `http://127.0.0.1:8765`
- **Anki Deck**: Choose which deck to add cards to
- **Note Type**: Choose between Basic, Basic (and reversed card), or Basic (type in the answer)
- **Test Connection**: Verify connection to Anki
- **TTS Audio**: Automatically detects language and generates pronunciation audio

## Note Format

Cards are created with:
- **Front**: The word/phrase + optional pronunciation + optional audio
- **Back**: Translation/definition + optional context
- **Tags**: `vocabulary`, `chrome-extension`, `tts` (if audio included)
- **Model**: Selectable (Basic, Basic (and reversed card), or Basic (type in the answer))
- **Audio**: MP3 format (via Google TTS), stored in Anki's media collection

## TTS (Text-to-Speech) Features

The extension uses Google Translate's TTS API for high-quality pronunciation audio:

- **High-Quality Audio**: Uses Google TTS for natural-sounding pronunciation in MP3 format
- **Anki-Compatible Format**: MP3 audio files work seamlessly with Anki's built-in player
- **Automatic Language Detection**: Detects the language based on characters (supports 9+ languages)
- **Audio Preview**: Test the pronunciation before adding to Anki
- **Audio Storage**: Automatically uploads audio files to Anki's media collection
- **Customizable**: Pronunciation field for phonetic notation (IPA, etc.)
- **No API Keys Required**: Uses Google's free public TTS endpoint
- **Fallback Support**: Falls back to browser's Web Speech API if Google TTS is unavailable

## Troubleshooting

**Connection Failed?**
- Make sure Anki is running
- Verify AnkiConnect is installed
- Check that the AnkiConnect URL is correct

**Duplicate Cards?**
- The extension prevents duplicates by default
- If you see this error, the word already exists in your deck

**Audio Not Playing in Anki?**
- Make sure you're using a recent version of Anki (2.1.50+)
- Audio files are stored in MP3 format, which is fully supported by Anki
- Try replaying the card or restarting Anki
- Check that the audio file was successfully uploaded (look for [sound:vocab_*.mp3] in the card)

**TTS Not Working?**
- Check your internet connection (Google TTS requires internet access)
- If Google TTS fails, the extension will fall back to browser's Web Speech API
- For Web Speech API fallback: Make sure your browser supports it (Chrome, Edge, Safari)
- Check browser permissions if using Web Speech API fallback

**Note Type Not Found?**
- Make sure the selected note type exists in Anki
- Default note types: "Basic", "Basic (and reversed card)", "Basic (type in the answer)"
- You can create custom note types in Anki and use their names

**Context Menu Not Working?**
- Reload the extension
- Refresh the webpage
- Check extension permissions

## Technical Details

- **Manifest Version**: 3
- **Permissions**: contextMenus, storage, activeTab, scripting
- **Host Permissions**: AnkiConnect (localhost:8765), Google Translate TTS API
- **AnkiConnect API**: Version 6
- **Audio Format**: MP3 (primary), WebM (fallback)

## Development

Files structure:
- `manifest.json` - Extension configuration
- `popup.html` - Popup interface with TTS controls
- `popup.js` - Popup logic and TTS integration
- `background.js` - Background service worker
- `tts-generator.js` - TTS audio generation module
- `styles.css` - Styling

## License

Free to use and modify.
