"use client";

import { Loader2, Mic, Square } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { canRecordAudio, loadWhisper, transcribe } from "@/lib/whisper";

// The Web Speech API isn't in TypeScript's DOM lib yet; type just what we use.
interface SpeechRecognitionResultLike {
  isFinal: boolean;
  0: { transcript: string };
}
interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: { resultIndex: number; results: ArrayLike<SpeechRecognitionResultLike> }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getRecognition(): SpeechRecognitionCtor | undefined {
  if (typeof window === "undefined") return undefined;
  const w = window as unknown as { SpeechRecognition?: SpeechRecognitionCtor; webkitSpeechRecognition?: SpeechRecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

/**
 * Two engines: the browser's speech service (fast, but Chrome sends audio to Google and other
 * Chromium browsers often don't have it), and Whisper running on the device as a fallback.
 */
type Engine = "browser" | "whisper";
type Phase = "idle" | "listening" | "recording" | "transcribing";

const ENGINE_KEY = "buildledger.voiceEngine";
const MAX_RECORDING_SECONDS = 20;
// Errors meaning the browser's speech service itself is unavailable, rather than a user problem.
const SERVICE_ERRORS = new Set(["network", "service-not-allowed", "language-not-supported"]);

const BROWSER_ERRORS: Record<string, string> = {
  "not-allowed": "Microphone permission was denied. Allow it in the browser's site settings.",
  "no-speech": "Didn't hear anything. Try again.",
  "audio-capture": "No microphone found.",
};

function rememberEngine(engine: Engine) {
  try {
    localStorage.setItem(ENGINE_KEY, engine);
  } catch {
    // Storage can be blocked (private mode); the fallback still works for this visit.
  }
}

function pickEngine(): Engine | null {
  let stored: string | null = null;
  try {
    stored = localStorage.getItem(ENGINE_KEY);
  } catch {}
  if (stored === "whisper" && canRecordAudio()) return "whisper";
  if (getRecognition()) return "browser";
  return canRecordAudio() ? "whisper" : null;
}

/** Mic button: listens once and hands the final transcript to `onTranscript`. */
export function VoiceInputButton({ onTranscript, label = "Speak" }: { onTranscript: (text: string) => void; label?: string }) {
  const [engine, setEngine] = useState<Engine | null | undefined>(undefined);
  const [phase, setPhase] = useState<Phase>("idle");
  const [interim, setInterim] = useState("");
  const [seconds, setSeconds] = useState(0);
  const [modelProgress, setModelProgress] = useState<number | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fallbackPendingRef = useRef(false);

  // Feature detection must run on the client after hydration to avoid a server/client mismatch.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setEngine(pickEngine()), []);

  useEffect(
    () => () => {
      recognitionRef.current?.abort();
      if (recorderRef.current?.state === "recording") recorderRef.current.stop();
      if (timerRef.current) clearInterval(timerRef.current);
    },
    [],
  );

  if (engine === undefined) return null;
  if (engine === null) {
    return (
      <p className="text-xs text-foreground/50">
        {typeof window !== "undefined" && !window.isSecureContext
          ? "Voice input needs a secure connection. Open the site on https or localhost."
          : "Voice input isn't supported in this browser."}
      </p>
    );
  }

  function startBrowser() {
    const Recognition = getRecognition();
    if (!Recognition) return startWhisper();
    const recognition = new Recognition();
    recognition.lang = "en-IN";
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.onresult = (event) => {
      let finalText = "";
      let interimText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) finalText += result[0].transcript;
        else interimText += result[0].transcript;
      }
      setInterim(interimText);
      if (finalText) onTranscript(finalText.trim());
    };
    recognition.onerror = (event) => {
      if (SERVICE_ERRORS.has(event.error) && canRecordAudio()) {
        // The browser's speech service isn't reachable here: switch to on-device voice for good.
        fallbackPendingRef.current = true;
        rememberEngine("whisper");
        setEngine("whisper");
        setNotice("This browser’s voice service isn’t available, so on-device voice is used instead. Speak now.");
        return;
      }
      setError(BROWSER_ERRORS[event.error] ?? "Voice input failed. Try again.");
    };
    recognition.onend = () => {
      setInterim("");
      if (fallbackPendingRef.current) {
        fallbackPendingRef.current = false;
        startWhisper();
      } else {
        setPhase("idle");
      }
    };
    recognitionRef.current = recognition;
    setPhase("listening");
    recognition.start();
  }

  async function startWhisper() {
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (e) {
      const name = (e as DOMException).name;
      setError(
        name === "NotAllowedError"
          ? "Microphone permission was denied. Allow it in the browser's site settings."
          : name === "NotFoundError"
            ? "No microphone found."
            : "Couldn't start the microphone.",
      );
      setPhase("idle");
      return;
    }

    // Start downloading the model while the user talks, so it's ready (or closer) when they stop.
    loadWhisper((p) => setModelProgress(p)).catch(() => undefined);

    const chunks: Blob[] = [];
    const recorder = new MediaRecorder(stream);
    recorder.ondataavailable = (event) => event.data.size > 0 && chunks.push(event.data);
    recorder.onstop = async () => {
      stream.getTracks().forEach((track) => track.stop());
      if (timerRef.current) clearInterval(timerRef.current);
      setPhase("transcribing");
      try {
        const text = await transcribe(new Blob(chunks, { type: recorder.mimeType }), (p) => setModelProgress(p));
        if (text) onTranscript(text);
        else setError("Didn't catch that. Try again, a little closer to the mic.");
      } catch {
        setError("Couldn't load on-device voice. The first use needs an internet connection to download it (about 80 MB).");
      } finally {
        setPhase("idle");
        setModelProgress(null);
      }
    };
    recorderRef.current = recorder;
    recorder.start();
    setSeconds(0);
    setPhase("recording");
    timerRef.current = setInterval(() => {
      setSeconds((s) => {
        if (s + 1 >= MAX_RECORDING_SECONDS && recorder.state === "recording") recorder.stop();
        return s + 1;
      });
    }, 1000);
  }

  function toggle() {
    if (phase === "listening") return recognitionRef.current?.stop();
    if (phase === "recording") return recorderRef.current?.stop();
    if (phase === "transcribing") return;
    setError(null);
    setNotice(null);
    if (engine === "browser") startBrowser();
    else startWhisper();
  }

  const active = phase === "listening" || phase === "recording";
  const buttonText =
    phase === "listening"
      ? "Listening… tap to stop"
      : phase === "recording"
        ? `Recording ${seconds}s… tap when done`
        : phase === "transcribing"
          ? modelProgress !== null && modelProgress < 1
            ? `Downloading voice model ${Math.round(modelProgress * 100)}%…`
            : "Converting speech…"
          : label;

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={toggle}
        disabled={phase === "transcribing"}
        aria-pressed={active}
        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-200 active:scale-[0.97] disabled:opacity-70 ${
          active ? "border-critical/50 bg-critical/10 text-critical" : "border-violet-300 bg-violet-50 text-violet-700 hover:bg-violet-100 dark:border-violet-500/40 dark:bg-violet-500/10 dark:text-violet-300"
        }`}
      >
        {active ? (
          <Square className="h-3.5 w-3.5 animate-pulse fill-current" aria-hidden />
        ) : phase === "transcribing" ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
        ) : (
          <Mic className="h-3.5 w-3.5" aria-hidden />
        )}
        {buttonText}
      </button>
      {phase === "transcribing" && modelProgress !== null && modelProgress < 1 && (
        <p className="text-xs text-foreground/50">First time only. After this, voice works offline.</p>
      )}
      {interim && <p className="text-xs italic text-foreground/60">“{interim}”</p>}
      {notice && <p className="text-xs text-foreground/70">{notice}</p>}
      {error && <p className="text-xs text-critical">{error}</p>}
    </div>
  );
}
