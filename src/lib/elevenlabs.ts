const API = "https://api.elevenlabs.io/v1";

export interface SynthOptions {
  apiKey: string;
  voiceId: string;
  modelId: string;
  speed: number;
  languageCode: string;
}

export async function synthesize(text: string, o: SynthOptions): Promise<Blob> {
  const body: Record<string, unknown> = {
    text,
    model_id: o.modelId,
    voice_settings: { stability: 0.5, similarity_boost: 0.75, speed: o.speed },
  };
  // language_code wird nur von Flash/Turbo v2.5 unterstützt
  if (o.modelId.includes("v2_5")) body.language_code = o.languageCode;

  const res = await fetch(
    `${API}/text-to-speech/${encodeURIComponent(o.voiceId)}?output_format=mp3_44100_128`,
    {
      method: "POST",
      headers: { "xi-api-key": o.apiKey, "Content-Type": "application/json", Accept: "audio/mpeg" },
      body: JSON.stringify(body),
    }
  );
  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    if (res.status === 402) {
      throw new Error(
        `Stimme ${o.voiceId} ist eine Library-Stimme und im Free-Plan per API gesperrt. Wähle eine andere Stimme oder upgrade bei ElevenLabs.`
      );
    }
    throw new Error(`ElevenLabs ${res.status}: ${msg.slice(0, 200)}`);
  }
  return await res.blob();
}

export interface Voice {
  id: string;
  name: string;
  category: string;
}

/** Stimmen des Accounts; Library-Stimmen ("professional") sind im Free-Plan per API gesperrt und kommen ans Ende. */
export async function listVoices(apiKey: string): Promise<Voice[]> {
  const res = await fetch(`${API}/voices`, { headers: { "xi-api-key": apiKey } });
  if (!res.ok) throw new Error(`ElevenLabs ${res.status}`);
  const json = await res.json();
  const voices: Voice[] = (json.voices || []).map((v: any) => ({
    id: v.voice_id,
    name: v.name,
    category: v.category || "",
  }));
  const rank = (v: Voice) => (v.category === "professional" ? 1 : 0);
  return voices.sort((a, b) => rank(a) - rank(b));
}
