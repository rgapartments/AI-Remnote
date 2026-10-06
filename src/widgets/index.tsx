import {
  declareIndexPlugin,
  PluginCommandMenuLocation,
  QueueEvent,
  ReactRNPlugin,
  WidgetLocation,
} from "@remnote/plugin-sdk";
import "../App.css";
import "../style.css";
import { listVoices, synthesize, Voice } from "../lib/elevenlabs";
import { getCached, hashKey, putCached } from "../lib/cache";
import { play, stop } from "../lib/player";
import { getQuestionAndAnswer } from "../lib/cardText";

const MODELS = [
  { key: "flash", label: "Flash v2.5 (schnell, günstig)", value: "eleven_flash_v2_5" },
  { key: "multi", label: "Multilingual v2 (beste Qualität)", value: "eleven_multilingual_v2" },
];
async function registerVoiceSetting(plugin: ReactRNPlugin, voices: Voice[]) {
  if (voices.length) {
    await plugin.settings.registerDropdownSetting({
      id: "aivoice-voice",
      title: "Stimme",
      description: "ElevenLabs-Stimme (Library-Stimmen brauchen einen Bezahlplan)",
      defaultValue: voices[0].id,
      options: voices.map((v) => ({
        key: v.id,
        label: v.category === "professional" ? `${v.name} (Library – Bezahlplan nötig)` : v.name,
        value: v.id,
      })),
    });
  } else {
    await plugin.settings.registerStringSetting({
      id: "aivoice-voice",
      title: "Stimme (Voice-ID)",
      description: "Wird zur Dropdown-Liste, sobald ein gültiger API-Key hinterlegt ist (Plugin neu laden).",
      defaultValue: "",
    });
  }
}

async function onActivate(plugin: ReactRNPlugin) {
  await plugin.settings.registerStringSetting({
    id: "aivoice-apikey",
    title: "ElevenLabs API-Key",
    description: "Wird nur lokal in RemNote gespeichert.",
    defaultValue: "",
  });
  await plugin.settings.registerStringSetting({
    id: "aivoice-voice-custom",
    title: "Eigene Voice-ID (optional)",
    description: "Hat Vorrang vor der Stimmenliste. Leer lassen, um die Auswahl oben zu nutzen.",
    defaultValue: "",
  });
  await plugin.settings.registerDropdownSetting({
    id: "aivoice-model",
    title: "Modell",
    defaultValue: "eleven_flash_v2_5",
    options: MODELS,
  });
  await plugin.settings.registerStringSetting({
    id: "aivoice-speed",
    title: "Geschwindigkeit",
    description: "0.7 – 1.2 (1.0 = normal)",
    defaultValue: "1.0",
  });
  await plugin.settings.registerBooleanSetting({
    id: "aivoice-auto-question",
    title: "Frage automatisch vorlesen",
    defaultValue: true,
  });
  await plugin.settings.registerBooleanSetting({
    id: "aivoice-auto-answer",
    title: "Antwort beim Aufdecken automatisch vorlesen",
    defaultValue: true,
  });
  await plugin.settings.registerNumberSetting({
    id: "aivoice-pause",
    title: "Pause vor Antwort (Sekunden)",
    defaultValue: 0,
  });

  const apiKey0 = (await plugin.settings.getSetting<string>("aivoice-apikey")) || "";
  let voices: Voice[] = [];
  if (apiKey0) {
    try {
      voices = await listVoices(apiKey0);
    } catch (e) {
      console.warn("[AI Voice] Stimmenliste fehlgeschlagen", e);
    }
  }
  await registerVoiceSetting(plugin, voices);

  // ---- Kernlogik -------------------------------------------------------
  const enabled = async () => !!(await plugin.storage.getSynced("aiVoiceEnabled"));
  let current: string | undefined; // aktuelle Karte
  let revealed: string | undefined; // zuletzt aufgedeckte Karte
  let busy: Promise<void> = Promise.resolve(); // Sprachausgaben laufen nacheinander

  // Jede Sprachausgabe ist ein Job, der einzeln abgebrochen werden kann
  type Job = { kind: "question" | "answer" | "test"; cardId?: string; dead: boolean };
  let jobs: Job[] = [];
  let playing: Job | undefined;

  function cancel(pred: (j: Job) => boolean) {
    jobs.forEach((j) => pred(j) && (j.dead = true));
    if (playing && pred(playing)) stop();
  }

  async function speak(text: string, job: Job) {
    if (!text.trim() || job.dead) return;
    const apiKey = (await plugin.settings.getSetting<string>("aivoice-apikey")) || "";
    if (!apiKey) return void plugin.app.toast("AI Voice: ElevenLabs API-Key fehlt (Plugin-Einstellungen).");
    const custom = ((await plugin.settings.getSetting<string>("aivoice-voice-custom")) || "").trim();
    let voiceId = custom || (await plugin.settings.getSetting<string>("aivoice-voice")) || "";
    if (!custom && !voices.some((v) => v.id === voiceId)) voiceId = voices[0]?.id || voiceId;
    if (!voiceId) return void plugin.app.toast("AI Voice: Keine Stimme gefunden – API-Key prüfen und Plugin neu laden.");
    const modelId = (await plugin.settings.getSetting<string>("aivoice-model")) || "eleven_flash_v2_5";
    const speedRaw = parseFloat((await plugin.settings.getSetting<string>("aivoice-speed")) || "1") || 1;
    const speed = Math.min(1.2, Math.max(0.7, speedRaw));
    console.log("[AI Voice] speak", job.kind, { voiceId, custom: !!custom, modelId, speed, chars: text.length });
    const key = await hashKey(JSON.stringify([text, voiceId, modelId, speed]));
    let blob = await getCached(key);
    if (!blob) {
      blob = await synthesize(text, { apiKey, voiceId, modelId, speed, languageCode: "de" });
      await putCached(key, blob);
    }
    if (job.dead) return; // inzwischen abgebrochen
    await play(blob);
  }

  function enqueue(job: Job, fn: () => Promise<void>) {
    jobs.push(job);
    busy = busy.then(async () => {
      try {
        if (job.dead) return;
        playing = job;
        await fn();
      } catch (e: any) {
        console.error("[AI Voice]", e);
        plugin.app.toast(`AI Voice: ${e?.message || e}`);
      } finally {
        playing = undefined;
        jobs = jobs.filter((j) => j !== job);
      }
    });
  }

  const cardIdOf = (d: any): string | undefined => d?.cardId ?? d?.card?._id ?? d?.card?.id;

  // Kurze Verzögerung, damit eine noch laufende Antwort der alten Karte sauber endet/abgebrochen wird
  const QUESTION_DELAY_MS = 150;

  plugin.event.addListener(QueueEvent.QueueLoadCard, undefined, async (d: any) => {
    console.log("[AI Voice] load-card", d);
    const cardId = cardIdOf(d);
    if (!cardId) return; // Events ohne cardId (popCard) ignorieren
    current = cardId;
    if (!(await enabled())) return;
    if (!(await plugin.settings.getSetting<boolean>("aivoice-auto-question"))) return;
    setTimeout(() => {
      if (current !== cardId || revealed === cardId) return; // schon weitergeklickt/aufgedeckt
      const job: Job = { kind: "question", cardId, dead: false };
      enqueue(job, async () => {
        const { question } = await getQuestionAndAnswer(plugin, cardId);
        await speak(question, job);
      });
    }, QUESTION_DELAY_MS);
  });

  // Aufdecken: Frage stoppen, Antwort direkt vorlesen
  plugin.event.addListener(QueueEvent.RevealAnswer, undefined, async (d: any) => {
    const cardId = cardIdOf(d) ?? current;
    console.log("[AI Voice] reveal", d, { cardId });
    revealed = cardId;
    cancel((j) => j.kind === "question" || j.kind === "answer");
    if (!cardId) return void console.warn("[AI Voice] keine cardId für Antwort");
    if (!(await enabled())) return;
    if (!(await plugin.settings.getSetting<boolean>("aivoice-auto-answer"))) return;
    const pause = ((await plugin.settings.getSetting<number>("aivoice-pause")) || 0) * 1000;
    const job: Job = { kind: "answer", cardId, dead: false };
    enqueue(job, async () => {
      if (pause) await new Promise((r) => setTimeout(r, pause));
      if (job.dead) return;
      const { answer } = await getQuestionAndAnswer(plugin, cardId);
      await speak(answer, job);
    });
  });

  // Bewertet: Du bist weitergegangen → Antwort nicht mehr weiter vorlesen
  plugin.event.addListener(QueueEvent.QueueCompleteCard, undefined, (d: any) => {
    console.log("[AI Voice] complete-card", d);
    const cardId = cardIdOf(d);
    if (revealed === cardId) revealed = undefined;
    cancel((j) => j.kind === "answer");
  });

  const halt = () => cancel(() => true);
  plugin.event.addListener(QueueEvent.QueueEnter, undefined, halt);
  plugin.event.addListener(QueueEvent.QueueExit, undefined, halt);

  // ---- Befehle & Button ---------------------------------------------------
  plugin.app.registerCommand({
    id: "aivoice-toggle",
    name: "AI Voice ein/aus",
    action: async () => {
      const on = !(await enabled());
      await plugin.storage.setSynced("aiVoiceEnabled", on);
      if (!on) halt();
      plugin.app.toast(`AI Voice ${on ? "AN" : "AUS"}`);
    },
  });
  plugin.app.registerCommand({
    id: "aivoice-test",
    name: "AI Voice: Test vorlesen",
    action: async () => {
      cancel(() => true);
      const job: Job = { kind: "test", dead: false };
      enqueue(job, () => speak("Hallo! Das ist ein Test der ElevenLabs Sprachausgabe.", job));
    },
  });

  // Button neben dem Bearbeiten-Stift in der Queue + Eintrag im ⋯-Menü
  plugin.app.registerWidget("ai_voice_queue_button", WidgetLocation.QueueToolbar, {
    dimensions: { height: "auto", width: "auto" },
  });
  plugin.app.registerMenuItem({
    id: "aivoice-toggle-menu",
    name: "AI Voice (ElevenLabs) ein/aus",
    location: PluginCommandMenuLocation.QueueMenu,
    action: async () => {
      const on = !(await enabled());
      await plugin.storage.setSynced("aiVoiceEnabled", on);
      if (!on) halt();
      plugin.app.toast(`AI Voice ${on ? "AN" : "AUS"}`);
    },
  });
}

async function onDeactivate(_: ReactRNPlugin) {
  stop();
}

declareIndexPlugin(onActivate, onDeactivate);
