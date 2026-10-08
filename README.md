## AI Voice (ElevenLabs)

Reads your flashcards aloud in the RemNote queue using ElevenLabs text-to-speech: the question when a card appears, the answer when you reveal it.

**Bring your own key:** this plugin does not include, provide, resell or proxy any voices or credits. You need your own ElevenLabs account and your own API key. Every request is made directly from your RemNote client to ElevenLabs with *your* key, and counts against *your* ElevenLabs plan. The plugin author never sees your key, your cards or your audio. It is independent of RemNote's built-in text-to-speech features and does not use or access any RemNote-provided voices or RemNote's ElevenLabs account.

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

This plugin sends data to a third-party service, **ElevenLabs** (`https://api.elevenlabs.io`). Please read this section before using it.

### What is sent to ElevenLabs

| When | Request | Data sent |
|---|---|---|
| A question or answer is read aloud (only while AI Voice is ON, and only if the audio is not already in your local cache) | `POST /v1/text-to-speech/{voice_id}` | The **plain text of that card's question or answer** (rich text is converted to plain text; cloze blanks are replaced by the word "Lücke"), the selected voice ID, model ID, speech speed, language code, and your **API key** (`xi-api-key` header) |
| The plugin starts and an API key is configured | `GET /v1/voices` | Your **API key** only (used to list your voices) |

Technically unavoidable for any web request, ElevenLabs also receives your **IP address** and basic connection/device information (e.g. user agent).

### What is NOT sent

- No RemNote account data, no knowledge-base name, no rem or card IDs, no other notes or document content.
- No data goes to the plugin author or to any server other than `api.elevenlabs.io`. The plugin contains no analytics, tracking or telemetry.
- No request is made for cards you do not have read aloud. If AI Voice is OFF, nothing is sent (apart from the voice-list request above at startup when an API key is configured).

### What is stored locally

- Your API key, voice ID and the other settings are stored **only** in your RemNote plugin settings.
- Generated audio is cached **only in your browser/app storage** (IndexedDB) so that repeated cards don't consume credits again. It is never uploaded. Clearing the site/app data of RemNote clears this cache.

### How ElevenLabs handles this data (summary of ElevenLabs' own policies)

ElevenLabs is an independent third party; the following is a summary of their published documents (Privacy Policy last updated 20 May 2026, Terms of Service last updated 31 March 2026). These documents can change; the originals are authoritative: [Privacy Policy](https://elevenlabs.io/privacy), [Terms of Service](https://elevenlabs.io/terms-of-use).

- **Processing of your text and audio:** The text you send and the audio generated from it are processed by ElevenLabs on servers in the United States, the Netherlands and Singapore. According to their policy, all personal data is transferred to the United States for storage; they rely on the EU-US Data Privacy Framework (for the US entity), EU Standard Contractual Clauses and adequacy decisions as safeguards.
- **Retention:** ElevenLabs states it deletes personal data when it is no longer necessary for its purposes, unless the law requires or permits longer retention. The privacy policy does not name a fixed retention period for text or generated audio. Unless you use ElevenLabs' enterprise "Zero Retention Mode", assume that text and audio sent through the API may be stored by ElevenLabs.
- **Use for AI training:** ElevenLabs may use content (including text and audio) to research, develop, train and improve its AI models (legitimate interest, or consent where the law requires it). You can opt out in your ElevenLabs account under *Terms and Privacy → Data use*. The opt-out applies only to data provided after you opted out.
- **Sharing:** According to their policy, data may be shared with affiliates and service providers (they list e.g. Google Cloud for storage/security, Stripe for payments, Google Analytics, Slack for support) and with authorities where legally required.
- **Your rights (e.g. under GDPR):** access, correction, deletion, restriction/objection, portability, withdrawal of consent and the right to complain to a supervisory authority. Requests go to ElevenLabs directly: legal@elevenlabs.io or https://help.elevenlabs.io/hc/en-us/requests/new.
- **Terms of use that matter for this plugin:** you must have the rights to the text you send; the free plan is for **non-commercial use only**; protected health information must not be submitted without a HIPAA agreement; you are responsible for keeping your API key secret.

### Recommendations

- **Do not put personal, confidential or sensitive information into flashcards you let this plugin read aloud**, because the text of those cards leaves your device and is processed by ElevenLabs. If a card contains such content, switch AI Voice OFF.
- Create a dedicated API key with only the permissions you need (Text-to-Speech, plus Voices: Read if you want a voice dropdown) and revoke it in your ElevenLabs account if it is ever exposed.
- Review and set the *Data use* opt-out in your ElevenLabs account if you do not want your texts used for model training.
- The plugin author is not affiliated with ElevenLabs or RemNote and is not responsible for how ElevenLabs processes your data or for costs on your ElevenLabs account.

### Kurzfassung (Deutsch)

Das Plugin sendet den **Text der Karte** (Frage bzw. Antwort), die gewählte Stimme/Modell/Geschwindigkeit und **deinen eigenen API-Key** direkt an ElevenLabs (`api.elevenlabs.io`), nur wenn AI Voice eingeschaltet ist und das Audio nicht schon lokal im Cache liegt. Beim Start wird mit dem Key außerdem die Stimmenliste abgerufen. Es werden keine RemNote-Kontodaten, keine IDs und keine anderen Notizen gesendet, und es gibt keine Analyse- oder Tracking-Dienste. Key und Einstellungen liegen nur in deinen RemNote-Plugin-Einstellungen, das Audio-Cache nur lokal im Browser/App-Speicher. ElevenLabs verarbeitet die Daten nach eigener Datenschutzerklärung (Server u. a. in den USA, Nutzung für KI-Training möglich, Opt-out im ElevenLabs-Konto). Lege keine vertraulichen oder personenbezogenen Inhalte in Karten, die vorgelesen werden.

## Credits

Based on the official RemNote "Text to Speech" example plugin (MIT), https://github.com/remnoteio/remnote-official-plugins
