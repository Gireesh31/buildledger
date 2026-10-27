/**
 * On-device speech recognition with Whisper (transformers.js), used when the browser's own
 * speech service isn't available (e.g. Brave, Opera, VS Code's browser, or a blocked Google service).
 * The model (~80 MB) downloads from Hugging Face on first use and is cached by the browser,
 * after which it works offline. Audio never leaves the device.
 */

const MODEL = "Xenova/whisper-base.en";
const SAMPLE_RATE = 16_000;

type Transcriber = (audio: Float32Array) => Promise<{ text: string } | { text: string }[]>;

let transcriberPromise: Promise<Transcriber> | null = null;
const progressListeners = new Set<(fraction: number) => void>();

/** Starts (or reuses) the model download. `onProgress` receives 0..1 while files download. */
export function loadWhisper(onProgress?: (fraction: number) => void): Promise<Transcriber> {
  if (onProgress) progressListeners.add(onProgress);
  transcriberPromise ??= (async () => {
    const { pipeline, env } = await import("@huggingface/transformers");
    env.allowLocalModels = false;
    const files = new Map<string, { loaded: number; total: number }>();
    const transcriber = await pipeline("automatic-speech-recognition", MODEL, {
      dtype: "q8",
      progress_callback: (event: { status: string; file?: string; loaded?: number; total?: number }) => {
        if (event.status !== "progress" || !event.file || !event.total) return;
        files.set(event.file, { loaded: event.loaded ?? 0, total: event.total });
        const all = [...files.values()];
        const fraction = all.reduce((s, f) => s + f.loaded, 0) / all.reduce((s, f) => s + f.total, 0);
        progressListeners.forEach((listener) => listener(fraction));
      },
    });
    return transcriber as unknown as Transcriber;
  })().catch((error) => {
    transcriberPromise = null; // allow a retry, e.g. once the connection is back
    throw error;
  });
  return transcriberPromise.finally(() => onProgress && progressListeners.delete(onProgress));
}

/** Decodes a recorded clip and resamples it to 16 kHz mono, which Whisper expects. */
async function toWhisperAudio(blob: Blob): Promise<Float32Array> {
  const decoded = await new AudioContext().decodeAudioData(await blob.arrayBuffer());
  const offline = new OfflineAudioContext(1, Math.ceil(decoded.duration * SAMPLE_RATE), SAMPLE_RATE);
  const source = offline.createBufferSource();
  source.buffer = decoded;
  source.connect(offline.destination);
  source.start();
  return (await offline.startRendering()).getChannelData(0);
}

export async function transcribe(recording: Blob, onProgress?: (fraction: number) => void): Promise<string> {
  const [transcriber, audio] = await Promise.all([loadWhisper(onProgress), toWhisperAudio(recording)]);
  const output = await transcriber(audio);
  const text = Array.isArray(output) ? output.map((o) => o.text).join(" ") : output.text;
  // Whisper marks silence and noises like "[BLANK_AUDIO]" or "(wind blowing)".
  return text.replace(/\[[^\]]*\]|\([^)]*\)/g, "").replace(/\s+/g, " ").trim();
}

export function canRecordAudio(): boolean {
  return typeof window !== "undefined" && window.isSecureContext && !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== "undefined";
}
