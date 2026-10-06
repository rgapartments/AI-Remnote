## AI Voice (ElevenLabs)

Reads your flashcards aloud in the RemNote queue using ElevenLabs text-to-speech: the question when a card appears, the answer when you reveal it.

## Features

- Automatic question playback when a card appears, answer playback when you reveal it
- On/off toggle in the flashcard queue (button next to the edit pencil, or the ⋯ menu)
- Settings: API key, voice ID, model (Flash v2.5 / Multilingual v2), speed, pause before answer
- Audio cache (IndexedDB) so repeated cards don't call the API again
- German by default

## Setup

1. Create an ElevenLabs API key (needs Text-to-Speech permission).
2. In RemNote: Settings → Plugin Settings → AI Voice, paste your API key and a voice ID.
3. Note: voices from the ElevenLabs Voice Library are not available via the API on the free plan. Use a premade/default voice or a paid plan.
4. Start a flashcard queue and switch AI Voice to ON.

Your API key is stored only in your RemNote plugin settings and sent only to api.elevenlabs.io.

## Credits

Based on the official RemNote "Text to Speech" example plugin (MIT), https://github.com/remnoteio/remnote-official-plugins
