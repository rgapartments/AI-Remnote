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

## Data & privacy

This plugin sends data to a third-party service, **ElevenLabs** (`https://api.elevenlabs.io`):

- **Text of the flashcard question or answer** that is being read aloud (plain text of the card, no card IDs, no other note content).
- **Your ElevenLabs API key**, as the `xi-api-key` header, so ElevenLabs can authorize the request.
- The selected voice ID, model and speed.

Nothing is sent to any other server and the plugin has no analytics. The API key is entered by you and stored only in your RemNote plugin settings. Generated audio is cached locally in your browser (IndexedDB) and never uploaded anywhere else. Requests are only made while "AI Voice" is switched ON. ElevenLabs processes the text under its own terms and privacy policy (https://elevenlabs.io/privacy), and usage counts against your own ElevenLabs credits.

The plugin requires your own ElevenLabs account and API key; it does not provide or resell any voices.

## Credits

Based on the official RemNote "Text to Speech" example plugin (MIT), https://github.com/remnoteio/remnote-official-plugins
