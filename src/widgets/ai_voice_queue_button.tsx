import { renderWidget, useSyncedStorageState } from "@remnote/plugin-sdk";

// Kompakte Variante für die Queue-Toolbar (neben dem Bearbeiten-Stift)
function AIVoiceQueueButton() {
  const [on, setOn] = useSyncedStorageState<boolean>("aiVoiceEnabled", false);
  return (
    <div
      onClick={() => setOn(!on)}
      title="AI Voice (ElevenLabs) ein-/ausschalten"
      className="cursor-pointer select-none rounded-md px-2 py-1 text-sm whitespace-nowrap"
      style={{
        background: on ? "#16a34a" : "transparent",
        color: on ? "#fff" : "inherit",
        border: "1px solid " + (on ? "#16a34a" : "rgba(128,128,128,.5)"),
      }}
    >
      🤖 {on ? "ON" : "OFF"}
    </div>
  );
}

renderWidget(AIVoiceQueueButton);
