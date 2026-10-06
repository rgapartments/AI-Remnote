let audio: HTMLAudioElement | undefined;
let url: string | undefined;

export function stop() {
  if (audio) {
    audio.pause();
    audio.dispatchEvent(new Event("ended")); // laufende play()-Promises auflösen
    audio.src = "";
    audio = undefined;
  }
  if (url) {
    URL.revokeObjectURL(url);
    url = undefined;
  }
}

/** Spielt ab und löst auf, wenn das Audio zu Ende ist oder gestoppt wurde. */
export async function play(blob: Blob): Promise<void> {
  stop();
  url = URL.createObjectURL(blob);
  const a = new Audio(url);
  audio = a;
  const ended = new Promise<void>((r) => a.addEventListener("ended", () => r(), { once: true }));
  await a.play();
  await ended;
}
