# TTS Integration Guide

## Overview

The Vocabulary to Anki extension now includes Text-to-Speech (TTS) functionality that allows you to generate pronunciation audio for your vocabulary cards.

## How It Works

1. **Web Speech API**: Uses the browser's built-in speech synthesis
2. **Audio Recording**: Captures the synthesized speech using MediaRecorder API
3. **AnkiConnect Upload**: Stores the audio file in Anki's media collection
4. **Card Integration**: Embeds audio reference `[sound:filename.webm]` in the card

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
- **Format**: WebM with Opus codec
- **Quality**: Browser default (typically good quality)
- **File Size**: Usually 10-50 KB per word

### API Endpoints Used

#### AnkiConnect - Store Media File
```json
{
  "action": "storeMediaFile",
  "version": 6,
  "params": {
    "filename": "vocab_word_timestamp.webm",
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
        "Front": "word<br>[sound:vocab_word_timestamp.webm]",
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
- Check browser console for errors
- Ensure your browser supports Web Speech API
- Try reloading the extension

### Poor Quality Audio
- Different operating systems have different voice quality
- Windows 10/11 has good quality voices
- macOS has excellent voices
- Linux voices may vary

### Audio Not Playing in Anki
- Update to Anki 2.1.50 or later
- Check Anki's media folder (Tools → Check Media)
- Ensure audio isn't muted in Anki preferences

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

- [ ] Voice selection dropdown
- [ ] Speed/pitch controls in UI
- [ ] Support for phrases with pauses
- [ ] Multiple pronunciation variants
- [ ] Integration with external TTS APIs (Google Cloud TTS, Amazon Polly)
- [ ] Audio quality presets
- [ ] Bulk import with TTS generation

## Credits

Built using:
- Web Speech API (SpeechSynthesis)
- MediaRecorder API
- AnkiConnect API

## License

Free to use and modify.
