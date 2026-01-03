# TTS Integration Guide

## Overview

The Vocabulary to Anki extension now includes Text-to-Speech (TTS) functionality that allows you to generate pronunciation audio for your vocabulary cards.

## How It Works

1. **Google TTS (Primary)**: Uses Google Translate's TTS API for high-quality MP3 audio
2. **Web Speech API (Fallback)**: Falls back to browser's built-in speech synthesis if Google TTS fails
3. **Audio Recording**: For fallback, captures the synthesized speech using MediaRecorder API
4. **AnkiConnect Upload**: Stores the audio file in Anki's media collection
5. **Card Integration**: Embeds audio reference `[sound:filename.mp3]` or `[sound:filename.webm]` in the card

## Supported Languages

The extension automatically detects the language based on character patterns:

- 🇺🇸 **English** (en-US) - Default
- 🇨🇳 **Chinese** (zh-CN) - 中文字符
- 🇯🇵 **Japanese** (ja-JP) - ひらがな・カタカナ
- 🇰🇷 **Korean** (ko-KR) - 한글
- 🇪🇸 **Spanish** (es-ES) - áéíñóú
- 🇫🇷 **French** (fr-FR) - àâäçéè
- 🇩🇪 **German** (de-DE) - äöüß
- 🇷🇺 **Russian** (ru-RU) - Кириллица
- 🇸🇦 **Arabic** (ar-SA) - العربية

## Usage Steps

1. Enter your word/phrase in the "Word / Phrase" field
2. Click **"🔊 Generate Audio"** button
3. Wait for audio generation (usually 1-2 seconds)
4. Click **"▶️ Play"** to preview the pronunciation
5. If satisfied, fill in the translation and click "Add to Anki"

## Technical Details

### Audio Format
- **Primary Format**: MP3 (via Google TTS)
  - High-quality natural pronunciation
  - Fully compatible with Anki
  - File size: ~10-30 KB per word
- **Fallback Format**: WebM with Opus codec (via Web Speech API)
  - Used when Google TTS is unavailable
  - File size: ~10-50 KB per word

### API Endpoints Used

#### Google TTS Endpoint
```
GET https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl={lang}&q={text}
```
- Returns MP3 audio data
- No API key required
- Free public endpoint

#### AnkiConnect - Store Media File
```json
{
  "action": "storeMediaFile",
  "version": 6,
  "params": {
    "filename": "vocab_word_timestamp.mp3",
    "data": "base64_encoded_audio_data"
  }
}
```

#### AnkiConnect - Add Note with Audio
```json
{
  "action": "addNote",
  "version": 6,
  "params": {
    "note": {
      "deckName": "Your Deck",
      "modelName": "Basic (and reversed card)",
      "fields": {
        "Front": "word<br>[sound:vocab_word_timestamp.mp3]",
        "Back": "translation"
      }
    }
  }
}
```

## Customization

### Change TTS Settings

Edit `popup.js` to modify TTS parameters:

```javascript
audioData = await ttsGenerator.generateAudio(word, {
  lang: lang,        // Language code
  rate: 0.9,        // Speech rate (0.1 - 10)
  pitch: 1,         // Voice pitch (0 - 2)
  voice: null       // Specific voice name (optional)
});
```

### Available Voices

To see all available voices in your browser, open the browser console:

```javascript
speechSynthesis.getVoices().forEach(voice => {
  console.log(voice.name, voice.lang);
});
```

## Browser Compatibility

- ✅ **Chrome/Edge**: Full support
- ✅ **Safari**: Full support
- ✅ **Firefox**: Supported (may have different voices)
- ❌ **Internet Explorer**: Not supported

## Tips & Best Practices

1. **Preview Audio First**: Always click Play to verify pronunciation before adding
2. **Use Pronunciation Field**: Add IPA or phonetic spelling for reference
3. **Multiple Languages**: The extension handles mixed languages automatically
4. **Audio Quality**: Browser voices vary by platform; test on your system
5. **File Management**: Audio files are automatically named and deduplicated

## Troubleshooting

### Audio Not Generating
- Check your internet connection (Google TTS requires internet)
- Check browser console for errors
- If Google TTS fails, extension will automatically fall back to Web Speech API
- Try reloading the extension

### Poor Quality Audio
- Google TTS should provide consistently high quality across all platforms
- If using fallback Web Speech API:
  - Different operating systems have different voice quality
  - Windows 10/11 has good quality voices
  - macOS has excellent voices
  - Linux voices may vary

### Audio Not Playing in Anki
- MP3 format is fully supported by all recent Anki versions
- Update to Anki 2.1.50 or later for best compatibility
- Check Anki's media folder (Tools → Check Media)
- Ensure audio isn't muted in Anki preferences
- Look for `[sound:vocab_*.mp3]` tag in your card

## Advanced Features

### Custom Voice Selection

You can modify `tts-generator.js` to allow users to select specific voices:

```javascript
// Get available voices
const voices = await ttsGenerator.getAvailableVoices();

// Use a specific voice
audioData = await ttsGenerator.generateAudio(word, {
  voice: 'Google UK English Female'
});
```

### Batch Processing

For future enhancement, you could add batch processing:

```javascript
// Process multiple words
for (const word of wordList) {
  const audio = await ttsGenerator.generateAudio(word);
  // Store in Anki...
}
```

## Future Enhancements

- [x] Integration with Google TTS API (Completed!)
- [ ] Voice selection dropdown
- [ ] Speed/pitch controls in UI
- [ ] Support for phrases with pauses
- [ ] Multiple pronunciation variants
- [ ] Integration with premium TTS APIs (Google Cloud TTS Pro, Amazon Polly, Azure TTS)
- [ ] Audio quality presets
- [ ] Bulk import with TTS generation
- [ ] Offline audio generation support

## Credits

Built using:
- Web Speech API (SpeechSynthesis)
- MediaRecorder API
- AnkiConnect API

## License

Free to use and modify.
